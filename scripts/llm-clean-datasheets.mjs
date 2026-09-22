/**
 * LLM clean/normalize product datasheets → structured English JSON.
 * Idempotent: skips if datasheetStatus.cleaned unless --force
 *
 * Usage:
 *   node scripts/llm-clean-datasheets.mjs
 *   node scripts/llm-clean-datasheets.mjs --force --limit=5
 *   node scripts/llm-clean-datasheets.mjs --slug=agt-tc12618c-49375081
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { emptyLocaleBlock } from "./lib/locales.mjs";
import { runJsonChat, getAiConfig } from "./lib/workers-ai.mjs";
import { buildDatasheetHtml, stripHtmlToText } from "./lib/datasheet-html.mjs";
import { r2Put } from "./lib/r2.mjs";
import {
  allocateProductMediaSlug,
  allocateDatasheetNameSlug,
  productDatasheetKey,
  productNameDatasheetKey,
  toCdnUrl,
} from "./lib/cdn-paths.mjs";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const DELAY_MS = Number(process.env.LLM_DELAY_MS || 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CLEAN_SCHEMA = `{
  "name": "string — cleaned product display name",
  "summary": "string — 1-2 sentence summary, max 320 chars",
  "description": "string — 1-3 paragraph plain-text description",
  "benefits": ["string bullet"],
  "overview": ["string bullet or short paragraph"],
  "applications": ["string bullet"],
  "specs": { "SpecKeyInEnglish": "value string" }
}`;

function normalizeCleaned(raw, product) {
  const specsIn = raw.specs && typeof raw.specs === "object" ? raw.specs : {};
  const specs = {};
  for (const [k, v] of Object.entries(specsIn)) {
    const key = String(k || "").trim();
    const val = Array.isArray(v) ? v.join(", ") : String(v ?? "").trim();
    if (key && val) specs[key] = val;
  }
  const existing = product.specs || product.datasheet?.specs || {};
  if (Object.keys(specs).length < 3) {
    for (const [k, v] of Object.entries(existing)) {
      if (!specs[k] && v) specs[k] = String(v);
    }
  }
  if (product.model && !specs.Model) specs.Model = product.model;

  const arr = (x) =>
    (Array.isArray(x) ? x : typeof x === "string" && x ? [x] : [])
      .map((s) => String(s).replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 2 && s.length < 500)
      .slice(0, 24);

  const name = String(raw.name || product.name || "").replace(/\s+/g, " ").trim() || product.name;
  const description = String(raw.description || product.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
  const summary = String(raw.summary || description || product.summary || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);

  return {
    name,
    summary,
    description,
    benefits: arr(raw.benefits),
    overview: arr(raw.overview),
    applications: arr(raw.applications),
    specs,
  };
}

async function cleanOne(product) {
  const html = product.datasheet?.rawHtml || product.datasheet?.html || product.descriptionHtml || "";
  const text = stripHtmlToText(html, 24000);
  const existingSpecs = product.specs || product.datasheet?.specs || {};

  const userPrompt = `Normalize this industrial/thermal camera product datasheet into clean structured JSON.
Brand context: Circuitbull® catalog (do NOT mention any other manufacturer or "China supplier" language).
Return ONLY valid JSON matching this schema:
${CLEAN_SCHEMA}

Rules:
- Language: English (source). Do NOT translate to other languages.
- Extract benefits, overview, applications from the text even if headings use odd punctuation.
- Specs keys stay concise English labels; values keep units as written.
- Fix OCR/HTML junk; remove navigation noise, cookie text, "from China", company boilerplate.
- If a section is missing, use [] or {}.
- Prefer concrete technical content over marketing fluff.

Product model: ${product.model || "unknown"}
Product name: ${product.name || ""}
Existing specs JSON: ${JSON.stringify(existingSpecs).slice(0, 4000)}

Datasheet text:
"""
${text || product.description || product.summary || product.name}
"""`;

  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content:
          "You are a datasheet structuring engine for Circuitbull®. Output only a single JSON object. No markdown commentary.",
      },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.2 }
  );

  return normalizeCleaned(json, product);
}

const cfg = getAiConfig();
if (!cfg.configured) {
  console.error("Workers AI not configured — set CF_AI_API_TOKEN / CF_AI_ACCOUNT_ID");
  process.exit(1);
}
console.log("AI", cfg.model, "account", cfg.accountId?.slice(0, 8) + "…");

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const filter = {};
if (ONLY_SLUG) filter.slug = ONLY_SLUG;
let cursor = db.collection("products").find(filter).sort({ slug: 1 });
if (LIMIT > 0) cursor = cursor.limit(LIMIT);
const products = await cursor.toArray();

const usedNameSlugs = new Set();
for (const p of products) {
  for (const s of Object.values(p.cdn?.datasheetSlugs || {})) {
    if (s) usedNameSlugs.add(String(s));
  }
}

let cleaned = 0;
let skipped = 0;
let failed = 0;

for (const p of products) {
  if (p.datasheetStatus?.cleaned && !FORCE) {
    skipped++;
    console.log("skip", p.slug, "(already cleaned)");
    continue;
  }

  try {
    console.log("clean", p.slug, "…");
    const data = await cleanOne(p);
    const now = new Date().toISOString();
    const enBlock = emptyLocaleBlock({
      name: data.name,
      summary: data.summary,
      description: data.description,
      benefits: data.benefits,
      overview: data.overview,
      applications: data.applications,
      translated: false,
      lang: "en",
    });

    const prevDs = p.datasheet || {};
    const datasheet = {
      ...prevDs,
      model: p.model || prevDs.model || null,
      benefits: data.benefits,
      overview: data.overview,
      applications: data.applications,
      specs: data.specs,
      rawHtml: prevDs.rawHtml || prevDs.html || p.descriptionHtml || null,
      html: prevDs.html || p.descriptionHtml || null,
      i18n: {
        ...(prevDs.i18n || {}),
        en: {
          name: data.name,
          summary: data.summary,
          description: data.description,
          benefits: data.benefits,
          overview: data.overview,
          applications: data.applications,
          specs: data.specs,
          translated: false,
          lang: "en",
        },
      },
    };

    const mediaSlug = p.cdn?.slug || allocateProductMediaSlug(p, new Set());
    const htmlDoc = buildDatasheetHtml(
      {
        name: data.name,
        model: p.model,
        smartId: p.smartId,
        summary: data.summary,
        description: data.description,
        benefits: data.benefits,
        overview: data.overview,
        applications: data.applications,
        specs: data.specs,
      },
      "en"
    );
    const dsKeyLegacy = productDatasheetKey(mediaSlug);
    const dsKeyLegacyEn = productDatasheetKey(mediaSlug, "en");
    for (const prev of Object.values(p.cdn?.datasheetSlugs || {})) {
      if (prev) usedNameSlugs.delete(String(prev));
    }
    const nameSlug = allocateDatasheetNameSlug(data.name, usedNameSlugs, p.model || p.slug);
    const dsKey = productNameDatasheetKey(nameSlug);
    await r2Put(dsKey, htmlDoc, "text/html; charset=utf-8");
    await r2Put(dsKeyLegacy, htmlDoc, "text/html; charset=utf-8");
    await r2Put(dsKeyLegacyEn, htmlDoc, "text/html; charset=utf-8");

    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          name: data.name,
          summary: data.summary,
          description: data.description,
          benefits: data.benefits,
          overview: data.overview,
          applications: data.applications,
          specs: data.specs,
          datasheet,
          datasheetUrl: toCdnUrl(dsKey),
          cdn: {
            bucket: "circuitbull-media",
            slug: mediaSlug,
            prefix: "products",
            datasheetSlugs: { ...(p.cdn?.datasheetSlugs || {}), en: nameSlug },
          },
          "i18n.en": enBlock,
          datasheetStatus: {
            cleaned: true,
            cleanedAt: now,
            translatedAt: p.datasheetStatus?.translatedAt || null,
            model: cfg.model,
          },
          updatedAt: new Date(),
        },
      }
    );

    cleaned++;
    console.log(
      "ok",
      p.slug,
      `benefits=${data.benefits.length}`,
      `overview=${data.overview.length}`,
      `apps=${data.applications.length}`,
      `specs=${Object.keys(data.specs).length}`
    );
    await sleep(DELAY_MS);
  } catch (e) {
    failed++;
    console.warn("fail", p.slug, e.message);
    await sleep(DELAY_MS);
  }
}

console.log(JSON.stringify({ cleaned, skipped, failed, total: products.length, model: cfg.model }, null, 2));
await client.close();
