/**
 * Download product images (+ optional PDFs) → Cloudflare R2
 * Writes slug-based keys: products/{slug}.jpg, products/{slug}-2.jpg, products/{slug}.html
 */
import "dotenv/config";
import { mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { MongoClient } from "mongodb";
import { r2Put } from "./lib/r2.mjs";
import {
  allocateProductMediaSlug,
  productImageKey,
  productDatasheetKey,
  productNameDatasheetKey,
  allocateDatasheetNameSlug,
  productPdfKey,
  toCdnUrl,
  CDN_BASE,
} from "./lib/cdn-paths.mjs";

const UA = "CircuitbullCatalogBot/0.1 (+https://circuitbull.com)";
const TMP = join(tmpdir(), `cb-media-${Date.now()}`);
mkdirSync(TMP, { recursive: true });

function extFromUrl(url, fallback = ".jpg") {
  const m = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|pdf|svg)(?:\?|$)/);
  return m ? `.${m[1] === "jpeg" ? "jpg" : m[1]}` : fallback;
}

function contentType(ext) {
  return (
    {
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".html": "text/html; charset=utf-8",
    }[ext] || "application/octet-stream"
  );
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

function datasheetHtml(product) {
  const specsRows = Object.entries(product.specs || {})
    .map(([k, v]) => `<tr><th>${escape(k)}</th><td>${escape(v)}</td></tr>`)
    .join("");
  const list = (arr) => (arr || []).map((x) => `<li>${escape(x)}</li>`).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escape(product.name)} Datasheet | Circuitbull®</title>
<style>body{font-family:IBM Plex Sans,system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#111}h1{font-size:1.6rem}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem;text-align:left;vertical-align:top}th{width:30%;background:#f4f6f8}.meta{color:#555;font-size:.9rem}</style></head><body>
<p class="meta">Circuitbull® mission catalog · Model: ${escape(product.model || "—")}</p>
<h1>${escape(product.name)}</h1>
${product.benefits?.length ? `<h2>Key Benefits</h2><ul>${list(product.benefits)}</ul>` : ""}
${product.overview?.length ? `<h2>Overview</h2><ul>${list(product.overview)}</ul>` : ""}
${product.applications?.length ? `<h2>Applications</h2><ul>${list(product.applications)}</ul>` : ""}
${specsRows ? `<h2>Technical Specification</h2><table>${specsRows}</table>` : ""}
<p class="meta">Source: ${escape(product.url || "")}</p>
</body></html>`;
}

function escape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({}).toArray();
console.log("products", products.length);

const usedSlugs = new Set();
const usedNameSlugs = new Set();
let ok = 0;
let fail = 0;

for (const p of products) {
  try {
    const mediaSlug = p.cdn?.slug || allocateProductMediaSlug(p, usedSlugs);
    usedSlugs.add(mediaSlug);
    const cdnImages = [];
    const sourceImages = (p.images || []).slice(0, 2);
    if (p.image && !sourceImages.includes(p.image)) sourceImages.unshift(p.image);
    const uniqSrc = [...new Set(sourceImages)].slice(0, 2);

    for (let i = 0; i < uniqSrc.length; i++) {
      const src = uniqSrc[i];
      if (!src || src.includes("/cdn/") || src.startsWith(CDN_BASE)) {
        if (src) cdnImages.push(toCdnUrl(src));
        continue;
      }
      try {
        const buf = await download(src);
        const ext = extFromUrl(src);
        const key = productImageKey(mediaSlug, i, ext);
        await r2Put(key, buf, contentType(ext));
        cdnImages.push(toCdnUrl(key));
        await new Promise((r) => setTimeout(r, 80));
      } catch (e) {
        console.warn("img fail", p.slug, src, e.message);
      }
    }

    // Structured datasheet HTML → R2 (name-based slug in the product language)
    const dsHtml = datasheetHtml(p);
    const nameSlug = allocateDatasheetNameSlug(p.name, usedNameSlugs, p.model || p.slug);
    const dsKey = productNameDatasheetKey(nameSlug);
    await r2Put(dsKey, dsHtml, contentType(".html"));
    await r2Put(productDatasheetKey(mediaSlug), dsHtml, contentType(".html"));
    const datasheetCdn = toCdnUrl(dsKey);

    // External PDFs if any
    const pdfCdns = [];
    for (let i = 0; i < (p.datasheets || []).slice(0, 3).length; i++) {
      const src = p.datasheets[i];
      try {
        const buf = await download(src);
        const key = productPdfKey(mediaSlug, i);
        await r2Put(key, buf, contentType(".pdf"));
        pdfCdns.push(toCdnUrl(key));
      } catch (e) {
        console.warn("pdf fail", src, e.message);
      }
    }

    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          image: cdnImages[0] || p.image,
          images: cdnImages.length ? cdnImages : p.images,
          imageSource: p.image,
          datasheetUrl: datasheetCdn,
          datasheetPdfs: pdfCdns,
          cdn: {
            bucket: "circuitbull-media",
            slug: mediaSlug,
            prefix: "products",
            datasheetSlugs: { ...(p.cdn?.datasheetSlugs || {}), en: nameSlug },
          },
          updatedAt: new Date(),
        },
      }
    );
    ok++;
    console.log("media", p.model || p.slug, cdnImages.length, "imgs");
  } catch (e) {
    fail++;
    console.warn("product media fail", p.slug, e.message);
  }
}

// Ensure brand keys exist (already uploaded) — write brand manifest to mongo/org
await db.collection("organization").updateOne(
  { _id: "org:volls-global" },
  {
    $set: {
      brandAssets: {
        favicon: `${CDN_BASE}/brand/favicon.ico`,
        logo: `${CDN_BASE}/brand/logo.svg`,
        logoIco: `${CDN_BASE}/brand/logo.ico`,
      },
    },
  }
);

console.log(JSON.stringify({ ok, fail, tmp: TMP }, null, 2));
try {
  rmSync(TMP, { recursive: true, force: true });
} catch {
  /* ignore */
}
await client.close();
