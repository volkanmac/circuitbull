#!/usr/bin/env node
/**
 * Generate A4 catalog PDFs for products and upload to R2.
 *
 * Usage:
 *   npm run generate-datasheet-pdfs
 *   npm run generate-datasheet-pdfs -- --slug=agt-tc12618c-49375081
 *   npm run generate-datasheet-pdfs -- --lang=tr --limit=5
 *   npm run generate-datasheet-pdfs -- --base=https://circuitbull.com
 *   npm run generate-datasheet-pdfs -- --skip-existing
 *
 * Requires: playwright (npx) + CF/R2 credentials for upload.
 * PDFs land at products/{slug}.pdf and products/{slug}-{lang}.pdf
 */
import "dotenv/config";
import { mkdirSync, unlinkSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { r2Put, r2List } from "./lib/r2.mjs";
import { productCatalogPdfKey, toCdnUrl } from "./lib/cdn-paths.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE_LOCALES = ["en", "tr", "ar", "es", "de", "fr", "ru", "zh-Hant", "it", "ko"];
const require = createRequire(import.meta.url);

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function ensurePlaywright() {
  try {
    return require("playwright");
  } catch {
    console.log("Installing playwright locally…");
    const r = spawnSync("npm", ["i", "-D", "playwright@1.49.1"], {
      encoding: "utf8",
      cwd: ROOT,
      stdio: "inherit",
    });
    if (r.status !== 0) throw new Error("Failed to install playwright");
    return require("playwright");
  }
}

async function renderPdf(page, url, outPath) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.addStyleTag({ content: ".no-print,.a4-toolbar{display:none!important}" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
}

async function main() {
  const base = (arg("base") || process.env.SITE_URL || "https://circuitbull.com").replace(/\/$/, "");
  const onlySlug = arg("slug");
  const onlyLang = arg("lang");
  const limit = Number(arg("limit") || "0") || 0;
  const dry = hasFlag("dry");
  const skipExisting = hasFlag("skip-existing");
  const langList = hasFlag("all-langs") ? SITE_LOCALES : onlyLang ? [onlyLang] : ["en", "tr"];

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "circuitbull");
  const q = onlySlug ? { slug: onlySlug } : { slug: { $exists: true } };
  let cursor = db.collection("products").find(q, { projection: { slug: 1, cdn: 1, name: 1 } });
  if (limit > 0) cursor = cursor.limit(limit);
  const products = await cursor.toArray();
  await client.close();

  if (!products.length) {
    console.log("No products found");
    return;
  }

  let existing = new Set();
  if (skipExisting) {
    try {
      const keys = await r2List("products/");
      existing = new Set(keys.map((k) => String(k)));
      console.log(`Loaded ${existing.size} existing R2 keys under products/`);
    } catch (e) {
      console.warn("Could not list R2 for --skip-existing:", e.message || e);
    }
  }

  const playwright = await ensurePlaywright();
  spawnSync("npx", ["playwright", "install", "chromium"], {
    encoding: "utf8",
    cwd: ROOT,
    stdio: "inherit",
  });

  const outDir = join(tmpdir(), "cb-datasheet-pdfs");
  mkdirSync(outDir, { recursive: true });

  console.log(`Generating PDFs for ${products.length} products × ${langList.join(",")} from ${base}`);

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const p of products) {
      const slug = p.slug;
      const mediaSlug = p.cdn?.slug || p.slug;
      for (const lang of langList) {
        const path = lang === "en" ? `/products/${slug}/datasheet` : `/${lang}/products/${slug}/datasheet`;
        const url = `${base}${path}`;
        const key = productCatalogPdfKey(mediaSlug, lang === "en" ? null : lang);
        if (skipExisting && existing.has(key)) {
          console.log(`↷ skip existing ${key}`);
          skipped++;
          continue;
        }
        const localPdf = join(outDir, key.replace(/\//g, "__"));

        console.log(`→ ${url}`);
        try {
          await renderPdf(page, url, localPdf);
          if (!existsSync(localPdf)) throw new Error("pdf file missing after render");
          const buf = readFileSync(localPdf);
          if (buf.length < 5 || buf[0] !== 0x25 || buf[1] !== 0x50 || buf[2] !== 0x44 || buf[3] !== 0x46) {
            throw new Error("rendered file is not a PDF");
          }

          if (dry) {
            console.log(`  dry-run kept ${localPdf} (${buf.length} bytes)`);
            ok++;
            continue;
          }

          await r2Put(key, buf, "application/pdf");
          console.log(`  uploaded ${toCdnUrl(key)} (${buf.length} bytes)`);
          try {
            unlinkSync(localPdf);
          } catch {
            /* ignore */
          }
          ok++;
        } catch (e) {
          console.error(`  FAIL ${slug} ${lang}:`, e.message || e);
          fail++;
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Done. ok=${ok} fail=${fail} skipped=${skipped}`);
  if (fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
