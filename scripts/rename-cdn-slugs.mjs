/**
 * Rename R2 product/solution media from ID folders to slug filenames.
 * Updates Mongo image/images/datasheetUrl/cdn, rewrites Redis CDN URLs, prints summary.
 *
 * Usage: node scripts/rename-cdn-slugs.mjs [--dry-run] [--keep-old]
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { r2List, r2Copy, r2Delete } from "./lib/r2.mjs";
import {
  allocateProductMediaSlug,
  allocateNeedMediaSlug,
  productImageKey,
  productDatasheetKey,
  productPdfKey,
  solutionImageKey,
  solutionVideoKey,
  toCdnUrl,
  cdnKeyFromUrl,
  isLegacyIdProductKey,
  legacyProductIdFromKey,
  extFromUrlOrKey,
  CDN_BASE,
} from "./lib/cdn-paths.mjs";

const DRY = process.argv.includes("--dry-run");
const KEEP_OLD = process.argv.includes("--keep-old");
const CONCURRENCY = 6;

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function contentTypeForKey(key) {
  const ext = String(key).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      html: "text/html; charset=utf-8",
      pdf: "application/pdf",
      mp4: "video/mp4",
      webm: "video/webm",
    }[ext] || "application/octet-stream"
  );
}

/** Map a legacy object basename under products/{id}/ to a slug key. */
function mapLegacyBasename(basename, mediaSlug) {
  const img = basename.match(/^img-(\d+)\.([a-z0-9]+)$/i);
  if (img) {
    const idx = Number(img[1]);
    return productImageKey(mediaSlug, idx, `.${img[2].toLowerCase() === "jpeg" ? "jpg" : img[2]}`);
  }
  const dsLang = basename.match(/^datasheet-([a-z]{2}(?:-[A-Za-z]+)?)\.html$/i);
  if (dsLang) return productDatasheetKey(mediaSlug, dsLang[1]);
  if (/^datasheet\.html$/i.test(basename)) return productDatasheetKey(mediaSlug);
  const pdf = basename.match(/^datasheet-(\d+)\.pdf$/i);
  if (pdf) return productPdfKey(mediaSlug, Number(pdf[1]));
  // fallback: products/{slug}-{original}
  return `products/${mediaSlug}-${basename}`;
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

console.log("listing R2 products/ + solutions/ …");
const [productKeys, solutionKeys] = await Promise.all([r2List("products/"), r2List("solutions/")]);
console.log("r2", { products: productKeys.length, solutions: solutionKeys.length });

const products = await db.collection("products").find({}).toArray();
const needs = await db.collection("needs").find({}).toArray();

const usedSlugs = new Set();
const productBySourceId = new Map();
const mediaSlugByProductId = new Map();
const urlRewrites = new Map(); // oldUrl -> newUrl
const copies = []; // { from, to }
const examples = [];

for (const p of products) {
  const mediaSlug = allocateProductMediaSlug(p, usedSlugs);
  mediaSlugByProductId.set(String(p._id), mediaSlug);
  const sid = String(p.sourceId || String(p._id).replace(/^product:/, ""));
  productBySourceId.set(sid, { p, mediaSlug });
}

// Plan copies from R2 keys keyed by product id folder
const keysById = new Map();
for (const key of productKeys) {
  if (!isLegacyIdProductKey(key)) continue;
  const id = legacyProductIdFromKey(key);
  if (!keysById.has(id)) keysById.set(id, []);
  keysById.get(id).push(key);
}

let planned = 0;
for (const [id, keys] of keysById) {
  const hit = productBySourceId.get(id);
  if (!hit) {
    console.warn("orphan id folder (no mongo product)", id, keys.length, "objects");
    continue;
  }
  const { p, mediaSlug } = hit;
  for (const from of keys) {
    const basename = from.split("/").pop();
    const to = mapLegacyBasename(basename, mediaSlug);
    if (from === to) continue;
    copies.push({ from, to, productId: p._id, mediaSlug });
    urlRewrites.set(toCdnUrl(from), toCdnUrl(to));
    planned++;
  }
}

// Also map Mongo-referenced URLs that may not be in list (safety)
for (const p of products) {
  const mediaSlug = mediaSlugByProductId.get(String(p._id));
  const urls = [p.image, ...(p.images || []), p.datasheetUrl, ...(p.datasheetPdfs || [])].filter(Boolean);
  for (const u of urls) {
    const key = cdnKeyFromUrl(u);
    if (!key || !isLegacyIdProductKey(key)) continue;
    const basename = key.split("/").pop();
    const to = mapLegacyBasename(basename, mediaSlug);
    if (!urlRewrites.has(toCdnUrl(key))) {
      copies.push({ from: key, to, productId: p._id, mediaSlug });
      urlRewrites.set(toCdnUrl(key), toCdnUrl(to));
      planned++;
    }
  }
}

// Solutions: rename any legacy keys → solutions/{needSlug}.*
const needBySlug = new Map(needs.map((n) => [n.slug, n]));
const usedNeedSlugs = new Set();
for (const n of needs) allocateNeedMediaSlug(n, usedNeedSlugs);

for (const key of solutionKeys) {
  // Already flat slug style? solutions/border-control.jpg — leave
  if (/^solutions\/[^/]+\.[a-z0-9]+$/i.test(key)) continue;
  // solutions/{something}/file → flatten using need slug if match
  const parts = key.split("/");
  const maybeNeed = parts[1];
  const need = needBySlug.get(maybeNeed) || needs.find((n) => key.includes(n.slug));
  if (!need) continue;
  const mediaSlug = allocateNeedMediaSlug(need, new Set(usedNeedSlugs));
  const basename = parts[parts.length - 1];
  const ext = extFromUrlOrKey(basename);
  let to;
  if (/\.(mp4|webm)$/i.test(basename)) to = solutionVideoKey(mediaSlug, ext);
  else if (/^img/i.test(basename) || /\.(jpe?g|png|webp|gif)$/i.test(basename)) {
    to = solutionImageKey(mediaSlug, ext);
  } else {
    to = `solutions/${mediaSlug}-${basename}`;
  }
  if (key !== to) {
    copies.push({ from: key, to, needSlug: need.slug });
    urlRewrites.set(toCdnUrl(key), toCdnUrl(to));
    planned++;
  }
}

// Dedupe copy jobs by from→to
const seenCopy = new Set();
const uniqueCopies = [];
for (const c of copies) {
  const k = `${c.from}=>${c.to}`;
  if (seenCopy.has(k)) continue;
  seenCopy.add(k);
  uniqueCopies.push(c);
}

console.log(JSON.stringify({ dryRun: DRY, copyJobs: uniqueCopies.length, urlRewrites: urlRewrites.size }, null, 2));
if (uniqueCopies[0]) {
  examples.push({
    before: toCdnUrl(uniqueCopies[0].from),
    after: toCdnUrl(uniqueCopies[0].to),
  });
}

if (!DRY) {
  let ok = 0;
  let fail = 0;
  await mapPool(uniqueCopies, CONCURRENCY, async (job) => {
    try {
      await r2Copy(job.from, job.to, contentTypeForKey(job.to));
      ok++;
      if (ok <= 3 || ok % 25 === 0) console.log("copied", ok, job.from, "→", job.to);
    } catch (e) {
      fail++;
      console.warn("copy fail", job.from, e.message);
    }
  });
  console.log("copy done", { ok, fail });

  // Update Mongo products
  let productsUpdated = 0;
  for (const p of products) {
    const mediaSlug = mediaSlugByProductId.get(String(p._id));
    const rewrite = (u) => {
      if (!u) return u;
      if (urlRewrites.has(u)) return urlRewrites.get(u);
      const key = cdnKeyFromUrl(u);
      if (key && urlRewrites.has(toCdnUrl(key))) return urlRewrites.get(toCdnUrl(key));
      return u;
    };

    // Prefer deterministic slug keys for images/datasheet even if rewrite map incomplete
    const srcImages = [];
    if (p.image) srcImages.push(p.image);
    for (const im of p.images || []) if (!srcImages.includes(im)) srcImages.push(im);

    const newImages = srcImages.map((u, i) => {
      const rewritten = rewrite(u);
      if (rewritten && rewritten !== u) return rewritten;
      const key = cdnKeyFromUrl(u);
      if (key && isLegacyIdProductKey(key)) {
        const basename = key.split("/").pop();
        const img = basename.match(/^img-(\d+)\.([a-z0-9]+)$/i);
        if (img) return toCdnUrl(productImageKey(mediaSlug, Number(img[1]), `.${img[2]}`));
      }
      // if already CDN but still id path somehow
      if (/\/products\/\d+\//.test(String(u))) {
        const ext = extFromUrlOrKey(u);
        return toCdnUrl(productImageKey(mediaSlug, i, ext));
      }
      return rewritten || u;
    });

    const datasheetUrl = (() => {
      const r = rewrite(p.datasheetUrl);
      if (r && r !== p.datasheetUrl) return r;
      if (p.datasheetUrl && /\/products\/\d+\//.test(p.datasheetUrl)) {
        return toCdnUrl(productDatasheetKey(mediaSlug));
      }
      return r || p.datasheetUrl;
    })();

    const datasheetPdfs = Array.isArray(p.datasheetPdfs)
      ? p.datasheetPdfs.map((u, i) => {
          const r = rewrite(u);
          if (r && r !== u) return r;
          if (/\/products\/\d+\//.test(String(u))) return toCdnUrl(productPdfKey(mediaSlug, i));
          return r || u;
        })
      : p.datasheetPdfs;

    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          image: newImages[0] || p.image,
          images: newImages.length ? newImages : p.images,
          datasheetUrl,
          datasheetPdfs,
          cdn: {
            bucket: "circuitbull-media",
            slug: mediaSlug,
            prefix: "products",
          },
          updatedAt: new Date(),
        },
      }
    );
    productsUpdated++;
    if (examples.length < 5 && p.image !== newImages[0]) {
      examples.push({ slug: p.slug, before: p.image, after: newImages[0], datasheet: datasheetUrl });
    }
  }

  // Needs/solutions media fields if present
  const needMediaSlug = new Map();
  {
    const used = new Set();
    for (const n of needs) needMediaSlug.set(String(n._id), allocateNeedMediaSlug(n, used));
  }
  let needsUpdated = 0;
  for (const n of needs) {
    const mediaSlug = needMediaSlug.get(String(n._id));
    const fields = {};
    for (const f of ["image", "video", "poster", "heroImage"]) {
      if (!n[f]) continue;
      const r = urlRewrites.get(n[f]) || n[f];
      if (r !== n[f]) fields[f] = r;
    }
    const imgKey = solutionImageKey(mediaSlug);
    const vidKey = solutionVideoKey(mediaSlug);
    if (uniqueCopies.some((c) => c.to === imgKey) && !n.image) fields.image = toCdnUrl(imgKey);
    if (uniqueCopies.some((c) => c.to === vidKey) && !n.video) fields.video = toCdnUrl(vidKey);
    if (Object.keys(fields).length) {
      fields.cdn = { bucket: "circuitbull-media", slug: mediaSlug, prefix: "solutions" };
      fields.updatedAt = new Date();
      await db.collection("needs").updateOne({ _id: n._id }, { $set: fields });
      needsUpdated++;
    }
  }

  // Delete old keys
  let deleted = 0;
  if (!KEEP_OLD) {
    const toDelete = [...new Set(uniqueCopies.map((c) => c.from))];
    await mapPool(toDelete, CONCURRENCY, async (key) => {
      try {
        await r2Delete(key);
        deleted++;
      } catch (e) {
        console.warn("delete fail", key, e.message);
      }
    });
  }

  // Redis: rewrite any string values containing old CDN URLs; flush keys that look like product caches
  let redisRewritten = 0;
  let redisFlushed = 0;
  if (process.env.REDIS_URL) {
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (e) => console.warn("redis", e.message));
    await redis.connect();
    const keys = await redis.keys("*");
    for (const key of keys) {
      const type = await redis.type(key);
      if (type === "string") {
        let val = await redis.get(key);
        if (!val) continue;
        let next = val;
        for (const [from, to] of urlRewrites) {
          if (next.includes(from)) next = next.split(from).join(to);
        }
        // also generic id-path → look up by source id in path
        next = next.replace(
          /https:\/\/cdn\.circuitbull\.com\/products\/(\d+)\/(img-\d+\.[a-z0-9]+|datasheet(?:-[a-zA-Z-]+)?\.html|datasheet-\d+\.pdf)/g,
          (full, id, base) => {
            const hit = productBySourceId.get(id);
            if (!hit) return full;
            return toCdnUrl(mapLegacyBasename(base, hit.mediaSlug));
          }
        );
        if (next !== val) {
          await redis.set(key, next);
          redisRewritten++;
        }
      } else if (/product|cdn|catalog|media/i.test(key)) {
        await redis.del(key);
        redisFlushed++;
      }
    }
    await redis.quit();
  }

  console.log(
    JSON.stringify(
      {
        productsUpdated,
        needsUpdated,
        r2Copied: uniqueCopies.length,
        r2Deleted: deleted,
        redisRewritten,
        redisFlushed,
        examples,
        cdnBase: CDN_BASE,
      },
      null,
      2
    )
  );
} else {
  console.log("dry-run examples", uniqueCopies.slice(0, 8).map((c) => ({ from: c.from, to: c.to })));
}

await client.close();
