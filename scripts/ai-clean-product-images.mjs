/**
 * Logo-wipe + military studio restyle for scraped CDN product stills.
 *
 * Preferred: FLUX.2 [max] image-edit (needs AI Gateway credits / BYOK).
 * Workers AI: @cf/black-forest-labs/flux-2-dev (best identity lock without gateway).
 * Last resort: @cf/black-forest-labs/flux-2-klein-9b.
 *
 * Usage:
 *   node scripts/ai-clean-product-images.mjs --limit=2
 *   node scripts/ai-clean-product-images.mjs --limit=2 --promote --sync-kv
 *   node scripts/ai-clean-product-images.mjs --all --promote --sync-kv --skip-max
 *   node scripts/ai-clean-product-images.mjs --slug=agt-tc12618c-49375081 --force --prefer-dev
 */
import "dotenv/config";
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { MongoClient } from "mongodb";
import { spawnSync } from "child_process";
import { r2Put } from "./lib/r2.mjs";
import {
  allocateProductMediaSlug,
  productCleanedKey,
  toCdnUrl,
} from "./lib/cdn-paths.mjs";

const ACCOUNT = process.env.CF_AI_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const IMAGE_TOKEN = process.env.CF_IMAGE_AI_TOKEN || process.env.CF_AI_API_TOKEN;
const AI_TOKEN = process.env.CF_AI_API_TOKEN || IMAGE_TOKEN;
const IMAGE_MODEL = process.env.CF_IMAGE_AI_MODEL || "black-forest-labs/flux-2-max";
const IMAGE_DEV = process.env.CF_IMAGE_AI_DEV || "@cf/black-forest-labs/flux-2-dev";
const IMAGE_FALLBACK = process.env.CF_IMAGE_AI_FALLBACK || "@cf/black-forest-labs/flux-2-klein-9b";
const OUT_DIR = join(process.cwd(), ".tmp", "ai-clean");

const argv = process.argv.slice(2);
const args = new Set(argv);
const argVal = (flag, fallback = null) => {
  const hit = argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const slugFilter = argVal("--slug");
const limit = args.has("--all") ? Infinity : Number(argVal("--limit", "2"));
const promote = args.has("--promote");
const syncKv = args.has("--sync-kv");
const force = args.has("--force");
const gallery = args.has("--gallery");
const skipExisting = !force;

const PALETTE = {
  sand: "#F4F3EF",
  sandWarm: "#EDE6D4",
  elev: "#E2DFC9",
  khaki: "#C4B896",
  coyote: "#A67C52",
  olive: "#4B5320",
  cta: "#D96B27",
  fg: "#2B261F",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function snap(n) {
  return Math.max(64, Math.round(Number(n) / 16) * 16);
}

function imageSize(buf) {
  if (!buf || buf.length < 24) return { width: 1024, height: 1024 };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 8 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        i += 2;
        continue;
      }
      const len = (buf[i + 2] << 8) + buf[i + 3];
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: (buf[i + 7] << 8) + buf[i + 8], height: (buf[i + 5] << 8) + buf[i + 6] };
      }
      i += 2 + len;
    }
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return { width: 1024, height: 1024 };
}

function outputSize({ width, height }) {
  const ratio = width / Math.max(1, height);
  if (ratio > 2.2) return { width: snap(1920), height: snap(Math.max(512, 1920 / ratio)) };
  if (ratio < 0.55) return { width: snap(1080), height: snap(1440) };
  return { width: 1440, height: 1440 };
}

function dataUri(buf, contentType = "image/jpeg") {
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

function guessContentType(url, buf) {
  const u = String(url || "").toLowerCase();
  if (u.endsWith(".png") || (buf && buf[0] === 0x89)) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function productLabel(p) {
  return p.i18n?.en?.name || p.name || p.model || p.slug;
}

function buildPrompt(product) {
  const name = productLabel(product);
  const model = product.model ? ` (${product.model})` : "";
  return [
    `Edit this Circuitbull® catalog product photograph of ${name}${model}.`,
    `IDENTITY LOCK: Keep the exact same physical unit — silhouette, housing, lenses, windows, antennas, mounts, connectors, fasteners, paint color, and mechanical details. Do not invent a different product, do not add extra sensors, and do not change the form factor.`,
    `LOGO WIPE: Completely remove ARGUSTEC, AGT wordmark, the AGT graphic mark, Chinese text, watermarks, captions, website URLs, stickers, and any other brand decals or printed labels on the housing or in the frame. Fill those areas with matching paint, panel texture, and hardware so the housing looks factory-clean. Do not add Circuitbull or any new logo or text.`,
    `BACKGROUND: Clean military product studio only — no extra cases, binoculars, people, HUDs, flags, or other equipment. Seamless olive-drab backdrop ${PALETTE.olive} meeting a sand/khaki floor ${PALETTE.sand} / ${PALETTE.khaki} / ${PALETTE.sandWarm}, coyote shadow ${PALETTE.coyote}. Soft cinematic key light, grounded contact shadow. Product is the only subject.`,
    `QUALITY: Upscale to crisp HD catalog photography — sharper optic glass, richer metal/composite texture, clean edges, professional color grade.`,
  ].join("\n");
}

async function fetchBuf(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function parseAiError(buf, status) {
  try {
    const json = JSON.parse(buf.toString("utf8"));
    return (
      json?.errors?.[0]?.message ||
      json?.error?.[0]?.message ||
      json?.error?.message ||
      json?.message ||
      `HTTP ${status}`
    );
  } catch {
    return buf.toString("utf8").slice(0, 400) || `HTTP ${status}`;
  }
}

function extractImageUrlOrB64(json) {
  const r = json?.result ?? json;
  if (typeof r?.image === "string") return r.image;
  if (typeof r?.result?.image === "string") return r.result.image;
  if (typeof r?.output?.image === "string") return r.output.image;
  if (typeof json?.image === "string") return json.image;
  return null;
}

async function imageFromResult(value) {
  if (!value) throw new Error("empty image result");
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return fetchBuf(value);
  }
  if (value.startsWith("data:")) {
    const b64 = value.split(",")[1];
    return Buffer.from(b64, "base64");
  }
  return Buffer.from(value, "base64");
}

async function runFluxMaxEdit({ prompt, dataUrl, width, height }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run`;
  const body = {
    model: IMAGE_MODEL,
    input: {
      prompt,
      input_images: [dataUrl],
      width,
      height,
      output_format: "jpeg",
      safety_tolerance: 4,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${IMAGE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json") && res.ok && buf[0] !== 0x7b) {
    return { buf, model: IMAGE_MODEL, mode: "unified-binary" };
  }
  const json = JSON.parse(buf.toString("utf8"));
  if (!res.ok || json.success === false) {
    throw new Error(parseAiError(buf, res.status));
  }
  const payload = json.result ?? json;
  if (payload?.state && payload.state !== "Completed" && payload.state !== "succeeded") {
    throw new Error(`flux-2-max state=${payload.state} ${JSON.stringify(payload).slice(0, 240)}`);
  }
  const img = extractImageUrlOrB64(json);
  if (!img) throw new Error(`no image in flux-2-max response: ${JSON.stringify(json).slice(0, 280)}`);
  return { buf: await imageFromResult(img), model: IMAGE_MODEL, mode: "unified-run" };
}

let ffmpegBin = null;
function resolveFfmpeg() {
  if (ffmpegBin) return ffmpegBin;
  try {
    const r = spawnSync(
      "node",
      ["-e", "import('@ffmpeg-installer/ffmpeg').then(m=>process.stdout.write(m.default.path||m.path))"],
      { encoding: "utf8", cwd: process.cwd() }
    );
    if (r.status === 0 && r.stdout?.trim()) ffmpegBin = r.stdout.trim();
  } catch {
    /* ignore */
  }
  if (!ffmpegBin) {
    const which = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
    if (which.status === 0) ffmpegBin = which.stdout.trim();
  }
  return ffmpegBin;
}

/** flux-2-dev reference images must be ≤512px on each side. */
function downscaleForDev(srcBuf, contentType) {
  const bin = resolveFfmpeg();
  if (!bin) throw new Error("ffmpeg missing for flux-2-dev 512px reference");
  const ext = contentType.includes("png") ? "png" : "jpg";
  const tmpIn = join(OUT_DIR, `_in-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`);
  const tmpOut = join(OUT_DIR, `_ref-${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`);
  writeFileSync(tmpIn, srcBuf);
  const r = spawnSync(
    bin,
    ["-y", "-i", tmpIn, "-vf", "scale=512:512:force_original_aspect_ratio=decrease", "-q:v", "2", tmpOut],
    { encoding: "utf8" }
  );
  try {
    unlinkSync(tmpIn);
  } catch {
    /* ignore */
  }
  if (r.status !== 0) throw new Error(r.stderr?.slice(-300) || "ffmpeg scale failed");
  const out = readFileSync(tmpOut);
  try {
    unlinkSync(tmpOut);
  } catch {
    /* ignore */
  }
  return out;
}

async function runWorkersImageEdit(model, { prompt, srcBuf, contentType, width, height, downscale }) {
  const bodyBuf = downscale ? downscaleForDev(srcBuf, contentType) : srcBuf;
  const blob = new Blob([bodyBuf], { type: downscale ? "image/jpeg" : contentType });
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("input_image_0", blob, "product.jpg");
  form.append("width", String(Math.min(1440, width)));
  form.append("height", String(Math.min(1440, height)));
  if (downscale) form.append("steps", "25");
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${AI_TOKEN}` },
    body: form,
    signal: AbortSignal.timeout(300000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json") || buf[0] === 0x7b) {
    const json = JSON.parse(buf.toString("utf8"));
    if (!res.ok || json.success === false) throw new Error(parseAiError(buf, res.status));
    const img = extractImageUrlOrB64(json);
    if (!img) throw new Error(`no image in ${model} response: ${JSON.stringify(json).slice(0, 280)}`);
    return { buf: await imageFromResult(img), model, mode: "workers-ai-rest" };
  }
  if (!res.ok) throw new Error(`${model} HTTP ${res.status}`);
  return { buf, model, mode: "workers-ai-binary" };
}

async function editProductImage({ prompt, srcBuf, srcUrl, contentType, width, height }) {
  if (!args.has("--skip-max")) {
    try {
      console.log(`  flux-max ${width}x${height}…`);
      return await runFluxMaxEdit({ prompt, dataUrl: dataUri(srcBuf, contentType), width, height });
    } catch (e) {
      console.warn(`  flux-max failed: ${e.message}`);
    }
  }
  if (args.has("--prefer-dev")) {
    try {
      console.log(`  flux-dev ${width}x${height}…`);
      return await runWorkersImageEdit(IMAGE_DEV, {
        prompt,
        srcBuf,
        contentType,
        width,
        height,
        downscale: true,
      });
    } catch (e) {
      console.warn(`  flux-dev failed: ${e.message}`);
    }
  }
  console.log(`  klein ${width}x${height}…`);
  return runWorkersImageEdit(IMAGE_FALLBACK, {
    prompt,
    srcBuf,
    contentType,
    width,
    height,
    downscale: false,
  });
}

function isQualityClean(p) {
  return Boolean(p.media?.cleaned);
}

function sourceUrls(product) {
  const urls = [];
  const orig = product.imageOriginal || product.media?.original || product.image;
  if (orig) urls.push(orig);
  if (gallery) {
    for (const u of product.images || []) if (u && !urls.includes(u)) urls.push(u);
  }
  return urls.filter(
    (u) =>
      /cdn\.circuitbull\.com\/products\//.test(u) &&
      !/-cleaned\./i.test(u) &&
      !/-ai-hero\./i.test(u)
  );
}

function applyPromoteFields(p, cleanedUrl, srcUrl) {
  const original = p.imageOriginal || srcUrl;
  const hide = new Set([cleanedUrl, original, p.media?.original].filter(Boolean));
  const extras = (p.images || []).filter((u) => u && !hide.has(u) && !/-source\./i.test(u));
  return {
    image: cleanedUrl,
    images: [cleanedUrl, ...extras],
    imageOriginal: original,
  };
}

function writeCompareHtml(rows) {
  const cards = rows
    .map((r) => {
      const before = r.localOriginal ? `originals/${r.localOriginal}` : r.sourceUrl;
      const after = r.localCleaned ? `cleaned/${r.localCleaned}` : r.cleanedUrl;
      return `<article>
  <h2>${escapeHtml(r.slug)}</h2>
  <p class="meta">${escapeHtml(r.name || "")} · ${escapeHtml(r.model || r.mode || "")}</p>
  <div class="pair">
    <figure><img src="${escapeHtml(before)}" alt="before"/><figcaption>Before</figcaption></figure>
    <figure><img src="${escapeHtml(after)}" alt="after"/><figcaption>After · ${escapeHtml(r.modelUsed || "")}</figcaption></figure>
  </div>
</article>`;
    })
    .join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Circuitbull cleaned product stills</title>
<style>
  body{margin:0;background:#F4F3EF;color:#2B261F;font-family:IBM Plex Sans,system-ui,sans-serif}
  h1{font-family:Barlow Condensed,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:1.5rem}
  article{padding:1.25rem 1.5rem;border-bottom:1px solid rgba(43,38,31,.14)}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  img{width:100%;background:#E2DFC9;border:1px solid rgba(43,38,31,.14)}
  figcaption{font-size:.8rem;color:#5C564C;margin-top:.35rem}
  .meta{color:#5C564C;font-size:.9rem}
</style></head><body>
<h1>Logo wipe + military studio</h1>
${cards}
</body></html>`;
  writeFileSync(join(OUT_DIR, "compare.html"), html);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  if (!ACCOUNT) throw new Error("CF_ACCOUNT_ID / CF_AI_ACCOUNT_ID missing");
  if (!IMAGE_TOKEN) throw new Error("CF_IMAGE_AI_TOKEN missing");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");

  mkdirSync(join(OUT_DIR, "originals"), { recursive: true });
  mkdirSync(join(OUT_DIR, "cleaned"), { recursive: true });

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "circuitbull");
  const query = slugFilter
    ? { slug: { $in: slugFilter.split(",").map((s) => s.trim()).filter(Boolean) } }
    : { image: /cdn\.circuitbull\.com/ };
  const products = await db.collection("products").find(query).toArray();
  products.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

  const selected = [];
  const promoteOnly = [];
  for (const p of products) {
    if (!force && isQualityClean(p) && skipExisting) {
      if (promote) promoteOnly.push(p);
      continue;
    }
    selected.push(p);
    if (selected.length >= limit) break;
  }

  console.log(
    JSON.stringify(
      {
        total: products.length,
        selected: selected.length,
        promoteOnly: promoteOnly.length,
        skipMax: args.has("--skip-max"),
        limit: Number.isFinite(limit) ? limit : "all",
        promote,
        syncKv,
        force,
        model: IMAGE_MODEL,
        workersDev: IMAGE_DEV,
        fallback: IMAGE_FALLBACK,
      },
      null,
      2
    )
  );

  const report = [];
  let ok = 0;
  let fail = 0;

  for (const p of selected) {
    const mediaSlug = p.cdn?.slug || allocateProductMediaSlug(p, new Set());
    const urls = sourceUrls(p);
    const srcUrl = urls[0];
    if (!srcUrl) {
      fail += 1;
      report.push({ slug: p.slug, error: "no CDN source image" });
      continue;
    }

    console.log(`\n${p.slug}`);
    try {
      const srcBuf = await fetchBuf(srcUrl);
      const contentType = guessContentType(srcUrl, srcBuf);
      const dims = imageSize(srcBuf);
      const out = outputSize(dims);
      const prompt = buildPrompt(p);
      const origName = `${mediaSlug}${srcUrl.toLowerCase().includes(".png") ? ".png" : ".jpg"}`;
      writeFileSync(join(OUT_DIR, "originals", origName), srcBuf);

      let edited = null;
      let lastErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          edited = await editProductImage({
            prompt,
            srcBuf,
            srcUrl,
            contentType,
            width: out.width,
            height: out.height,
          });
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          console.warn(`  attempt ${attempt + 1} failed: ${e.message}`);
          await sleep(2000 * (attempt + 1));
        }
      }
      if (!edited) throw lastErr || new Error("image edit failed");

      const cleanedName = `${mediaSlug}.jpg`;
      writeFileSync(join(OUT_DIR, "cleaned", cleanedName), edited.buf);
      const key = productCleanedKey(mediaSlug, ".jpg");
      await r2Put(key, edited.buf, "image/jpeg");
      const cleanedUrl = toCdnUrl(key);
      const generatedAt = new Date().toISOString();

      const set = {
        "media.cleaned": cleanedUrl,
        "media.cleanedAt": generatedAt,
        "media.cleanedModel": edited.model,
        "media.cleanedMode": edited.mode,
        "media.cleanedPrompt": prompt,
        "media.original": p.media?.original || srcUrl,
        updatedAt: new Date(),
      };

      if (promote) Object.assign(set, applyPromoteFields(p, cleanedUrl, srcUrl));

      await db.collection("products").updateOne({ _id: p._id }, { $set: set });
      ok += 1;
      report.push({
        slug: p.slug,
        name: productLabel(p),
        model: p.model,
        sourceUrl: srcUrl,
        cleanedUrl,
        localOriginal: origName,
        localCleaned: cleanedName,
        modelUsed: edited.model,
        mode: edited.mode,
        size: `${out.width}x${out.height}`,
        promoted: promote,
      });
      console.log(`  ok ${cleanedUrl} (${edited.model} / ${edited.mode})`);
      await sleep(600);
    } catch (e) {
      fail += 1;
      report.push({ slug: p.slug, name: productLabel(p), sourceUrl: srcUrl, error: e.message });
      console.error(`  FAIL ${e.message}`);
    }
  }

  let promotedExisting = 0;
  for (const p of promoteOnly) {
    const cleanedUrl = p.media.cleaned;
    const srcUrl = p.imageOriginal || p.media.original || p.image;
    await db.collection("products").updateOne(
      { _id: p._id },
      { $set: { ...applyPromoteFields(p, cleanedUrl, srcUrl), updatedAt: new Date() } }
    );
    promotedExisting += 1;
    console.log(`promote-only ${p.slug} → ${cleanedUrl}`);
  }

  writeCompareHtml(report.filter((r) => r.cleanedUrl));
  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify({ ok, fail, promote, promotedExisting, report }, null, 2));
  console.log(JSON.stringify({ ok, fail, promotedExisting, compare: join(OUT_DIR, "compare.html") }, null, 2));

  await client.close();

  if (promote && syncKv && (ok || promotedExisting)) {
    console.log("syncing KV…");
    const r = spawnSync("node", ["scripts/sync-kv.mjs"], { stdio: "inherit", cwd: process.cwd(), env: process.env });
    if (r.status !== 0) throw new Error("sync-kv failed");
  }

  if (!ok && selected.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
