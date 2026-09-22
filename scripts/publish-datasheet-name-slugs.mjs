/**
 * Copy existing datasheet HTML to localized product-name slugs.
 * Example: products/long-distance-multi-sensor-....html
 * Arabic (and other scripts) keep native letters in the filename.
 *
 * Usage: node scripts/publish-datasheet-name-slugs.mjs [--dry-run] [--slug=agt-z201-lfz-546218158]
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { r2Copy, r2List } from "./lib/r2.mjs";
import { SUPPORTED_LOCALES } from "./lib/locales.mjs";
import {
  datasheetNameSlugsForProduct,
  productNameDatasheetKey,
  productDatasheetKey,
  productNameForLang,
  toCdnUrl,
} from "./lib/cdn-paths.mjs";

const DRY = process.argv.includes("--dry-run");
const ONLY_SLUG = (process.argv.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const SITE = process.env.SITE_URL || "https://circuitbull.com";

async function liveNamesBySlug() {
  const bySlug = new Map();
  for (const lang of SUPPORTED_LOCALES) {
    try {
      const res = await fetch(`${SITE}/api/v1/products?lang=${encodeURIComponent(lang)}`);
      if (!res.ok) continue;
      const json = await res.json();
      for (const p of json.products || []) {
        if (!p?.slug || !p?.name) continue;
        if (!bySlug.has(p.slug)) bySlug.set(p.slug, {});
        bySlug.get(p.slug)[lang] = p.name;
      }
    } catch (e) {
      console.warn("live names fail", lang, e.message);
    }
  }
  return bySlug;
}

function mergeLiveNames(p, live) {
  const names = live.get(p.slug) || {};
  const i18n = { ...(p.i18n || {}) };
  for (const [lang, name] of Object.entries(names)) {
    i18n[lang] = { ...(i18n[lang] || {}), name };
  }
  return {
    ...p,
    name: names.en || p.name,
    i18n,
  };
}

function pickSourceKey(htmlKeys, mediaSlug, lang) {
  const candidates =
    lang && lang !== "en"
      ? [productDatasheetKey(mediaSlug, lang), productDatasheetKey(mediaSlug, "en"), productDatasheetKey(mediaSlug)]
      : [productDatasheetKey(mediaSlug), productDatasheetKey(mediaSlug, "en")];
  return candidates.find((k) => htmlKeys.has(k)) || null;
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const filter = ONLY_SLUG ? { slug: ONLY_SLUG } : {};
const products = await db.collection("products").find(filter).sort({ slug: 1 }).toArray();
console.log("products", products.length);

const live = await liveNamesBySlug();
console.log("live name slugs", [...live.keys()].length);

const htmlKeys = new Set((await r2List("products/")).filter((k) => k.endsWith(".html")));
console.log("r2 html", htmlKeys.size);

const used = new Set();
const jobs = [];
const mongoUpdates = [];

for (const p of products) {
  const merged = mergeLiveNames(p, live);
  const slugs = datasheetNameSlugsForProduct(merged, used, SUPPORTED_LOCALES);
  const mediaSlug = p.cdn?.slug || p.slug;
  const uniqueDest = new Map(); // destKey → sourceKey

  for (const lang of SUPPORTED_LOCALES) {
    const nameSlug = slugs[lang];
    if (!nameSlug) continue;
    const dest = productNameDatasheetKey(nameSlug);
    if (uniqueDest.has(dest)) continue;
    const src = pickSourceKey(htmlKeys, mediaSlug, lang);
    if (!src) {
      console.warn("no source html", p.slug, lang);
      continue;
    }
    uniqueDest.set(dest, src);
  }

  for (const [dest, src] of uniqueDest) {
    if (src !== dest) jobs.push({ from: src, to: dest, slug: p.slug });
  }

  const enSlug = slugs.en;
  mongoUpdates.push({
    id: p._id,
    mediaSlug,
    datasheetSlugs: slugs,
    datasheetUrl: enSlug ? toCdnUrl(productNameDatasheetKey(enSlug)) : p.datasheetUrl,
    sample: {
      slug: p.slug,
      enName: productNameForLang(merged, "en"),
      trName: productNameForLang(merged, "tr"),
      arName: productNameForLang(merged, "ar"),
      slugs,
    },
  });
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      copyJobs: jobs.length,
      examples: mongoUpdates
        .filter((u) => !ONLY_SLUG || u.sample.slug === ONLY_SLUG)
        .slice(0, 3)
        .map((u) => u.sample),
    },
    null,
    2
  )
);

if (DRY) {
  console.log("dry-run copies", jobs.slice(0, 8));
  await client.close();
  process.exit(0);
}

let copied = 0;
let failed = 0;
for (const job of jobs) {
  try {
    await r2Copy(job.from, job.to, "text/html; charset=utf-8");
    copied++;
    if (copied <= 5 || copied % 20 === 0) console.log("copied", copied, job.from, "→", job.to);
  } catch (e) {
    failed++;
    console.warn("copy fail", job.from, job.to, e.message);
  }
}

let updated = 0;
for (const u of mongoUpdates) {
  await db.collection("products").updateOne(
    { _id: u.id },
    {
      $set: {
        datasheetUrl: u.datasheetUrl,
        "cdn.bucket": "circuitbull-media",
        "cdn.slug": u.mediaSlug,
        "cdn.prefix": "products",
        "cdn.datasheetSlugs": u.datasheetSlugs,
        updatedAt: new Date(),
      },
    }
  );
  updated++;
}

console.log(JSON.stringify({ copied, failed, updated }, null, 2));
await client.close();
