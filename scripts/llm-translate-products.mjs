/**
 * LLM translate cleaned product i18n + datasheet.i18n to all supported locales.
 * Requires datasheetStatus.cleaned. Idempotent per locale unless --force.
 *
 * Usage:
 *   node scripts/llm-translate-products.mjs
 *   node scripts/llm-translate-products.mjs --force --limit=2 --langs=tr,ar
 *   node scripts/llm-translate-products.mjs --slug=agt-tc12618c-49375081
 *   node scripts/llm-translate-products.mjs --concurrency=20
 */
import "dotenv/config";
import { writeSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { MongoClient } from "mongodb";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_META, emptyLocaleBlock } from "./lib/locales.mjs";
import { runJsonChat, getAiConfig } from "./lib/workers-ai.mjs";
import { buildDatasheetHtml } from "./lib/datasheet-html.mjs";
import { r2Put } from "./lib/r2.mjs";
import { allocateProductMediaSlug, allocateDatasheetNameSlug, datasheetNameSlug, productNameDatasheetKey } from "./lib/cdn-paths.mjs";

/** Sync stdout so redirects/tee see progress immediately (avoids false stall watches). */
function say(...args) {
  writeSync(1, args.map(String).join(" ") + "\n");
}

const SKIP_PATH = ".tmp/translate-skip.json";
function loadSkip() {
  try {
    const j = JSON.parse(readFileSync(SKIP_PATH, "utf8"));
    return new Set(Array.isArray(j) ? j : j.keys || []);
  } catch {
    return new Set();
  }
}
function saveSkip(set) {
  mkdirSync(".tmp", { recursive: true });
  writeFileSync(SKIP_PATH, JSON.stringify([...set], null, 2));
}
function skipKey(slug, lang) {
  return `${slug}::${lang}`;
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const CLEAR_SKIP = args.includes("--clear-skip");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const LANGS_ARG = (args.find((a) => a.startsWith("--langs=")) || "").split("=")[1] || "";
const CONCURRENCY = Math.max(
  1,
  Number((args.find((a) => a.startsWith("--concurrency=")) || "").split("=")[1] || process.env.TRANSLATE_CONCURRENCY || 1) || 1
);
const DELAY_MS = Number(process.env.LLM_DELAY_MS || (CONCURRENCY > 1 ? 0 : 600));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const skipSet = CLEAR_SKIP ? new Set() : loadSkip();
if (CLEAR_SKIP) saveSkip(skipSet);

function createMutex() {
  let tail = Promise.resolve();
  return (fn) => {
    const run = tail.then(fn, fn);
    tail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };
}
const mutex = createMutex();

async function mapPool(items, n, fn) {
  if (!items.length) return;
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) break;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

const TARGET_LANGS = (LANGS_ARG ? LANGS_ARG.split(",") : SUPPORTED_LOCALES)
  .map((s) => s.trim())
  .filter((l) => l && l !== DEFAULT_LOCALE);

function sourceBlock(product) {
  const en = product.i18n?.en || {};
  const dsEn = product.datasheet?.i18n?.en || {};
  return {
    name: en.name || product.name || "",
    summary: en.summary || product.summary || "",
    description: en.description || product.description || "",
    benefits: en.benefits?.length ? en.benefits : product.benefits || [],
    overview: en.overview?.length ? en.overview : product.overview || [],
    applications: en.applications?.length ? en.applications : product.applications || [],
    specs: dsEn.specs || product.specs || product.datasheet?.specs || {},
  };
}

const SPEC_CHUNK = 20;
const BIG_PAYLOAD_BYTES = 5000;

async function llmJson(userPrompt) {
  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content:
          "You are a technical localization engine for Circuitbull® mission catalog. Output only JSON. No markdown.",
      },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.2 }
  );
  return json && typeof json === "object" ? json : {};
}

function specObject(raw, fallback) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : fallback || {};
  const specs = {};
  for (const [k, v] of Object.entries(src)) {
    if (k && v != null && String(v).trim()) specs[String(k)] = String(v).trim();
  }
  return specs;
}

function translatePrompt(lang, meta, payload, mode) {
  const rules = `- Preserve technical model numbers, acronyms (PTZ, EO/IR, LWIR, SMARTID), and unit symbols.
- Do not add manufacturer names other than Circuitbull®.
- language/lang code for this block is "${lang}".`;
  if (mode === "specs") {
    return `Translate Circuitbull® datasheet spec VALUES into "${lang}" (${meta.name}).
Return ONLY JSON: { "specs": { "EnglishKey": "translated value" } }
Rules:
- KEEP spec keys in English; translate values only (keep pure numbers/units as-is).
${rules}

Source JSON:
${JSON.stringify(payload)}`;
  }
  const extra =
    mode === "copy"
      ? `Return ONLY JSON with keys name, summary, description, benefits, overview, applications. Do not include specs.`
      : `Return ONLY JSON with keys name, summary, description, benefits, overview, applications, specs.
- Specs object: KEEP keys in English; translate values only.`;
  return `Translate this Circuitbull® product datasheet JSON into language code "${lang}" (${meta.name}).
${extra}
Keep array lengths similar.
${rules}

Source JSON:
${JSON.stringify(payload)}`;
}

async function translateOne(src, lang) {
  const meta = LOCALE_META[lang] || { name: lang };
  const copyPayload = {
    name: src.name,
    summary: src.summary,
    description: src.description,
    benefits: src.benefits,
    overview: src.overview,
    applications: src.applications,
  };
  const specEntries = Object.entries(src.specs || {});
  const payloadBytes = JSON.stringify({ ...copyPayload, specs: src.specs || {} }).length;
  const chunkSpecs = specEntries.length > SPEC_CHUNK || payloadBytes > BIG_PAYLOAD_BYTES;

  let json;
  let specs;
  if (!chunkSpecs) {
    json = await llmJson(translatePrompt(lang, meta, { ...copyPayload, specs: src.specs || {} }, "all"));
    specs = specObject(json.specs, src.specs);
  } else {
    json = await llmJson(translatePrompt(lang, meta, copyPayload, "copy"));
    specs = {};
    for (let i = 0; i < specEntries.length; i += SPEC_CHUNK) {
      const chunk = Object.fromEntries(specEntries.slice(i, i + SPEC_CHUNK));
      const part = await llmJson(translatePrompt(lang, meta, { specs: chunk }, "specs"));
      Object.assign(specs, specObject(part.specs, chunk));
    }
  }

  const arr = (x, fallback) =>
    (Array.isArray(x) ? x : fallback || [])
      .map((s) => String(s).replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 24);

  return {
    name: String(json.name || src.name).trim(),
    summary: String(json.summary || src.summary).trim().slice(0, 400),
    description: String(json.description || src.description).trim().slice(0, 6000),
    benefits: arr(json.benefits, src.benefits),
    overview: arr(json.overview, src.overview),
    applications: arr(json.applications, src.applications),
    specs,
  };
}

const cfg = getAiConfig();
if (!cfg.configured) {
  console.error("Workers AI not configured");
  process.exit(1);
}
say("AI", cfg.model, "targets", TARGET_LANGS.join(","), "concurrency", CONCURRENCY);

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const filter = { "datasheetStatus.cleaned": true };
if (ONLY_SLUG) {
  filter.slug = ONLY_SLUG;
} else if (!FORCE && TARGET_LANGS.length) {
  filter.$or = TARGET_LANGS.flatMap((lang) => [
    { [`i18n.${lang}.translated`]: { $ne: true } },
    { [`datasheet.i18n.${lang}.translated`]: { $ne: true } },
  ]);
  // Sequential mode: skip whole slugs so one bad product cannot starve the queue.
  // Parallel mode skips only slug::lang keys inside the job loop.
  if (CONCURRENCY <= 1 && skipSet.size) {
    const skipSlugs = [...new Set([...skipSet].map((k) => String(k).split("::")[0]).filter(Boolean))];
    if (skipSlugs.length) filter.slug = { $nin: skipSlugs };
  }
}
// Over-fetch a bit when skipping so --limit still yields work
const fetchLimit = LIMIT > 0 ? LIMIT + Math.min(20, skipSet.size) : 0;
let cursor = db.collection("products").find(filter).sort({ slug: 1 });
if (fetchLimit > 0) cursor = cursor.limit(fetchLimit);
let products = await cursor.toArray();
if (LIMIT > 0) products = products.slice(0, LIMIT);
if (skipSet.size) say("skip-list", skipSet.size, "keys");

const usedNameSlugs = new Set();
for (const p of products) {
  for (const s of Object.values(p.cdn?.datasheetSlugs || {})) {
    if (s) usedNameSlugs.add(String(s));
  }
}

let translatedBlocks = 0;
let skippedBlocks = 0;
let failedBlocks = 0;
const touchedSlugs = new Set();
const jobs = [];

for (const p of products) {
  const src = sourceBlock(p);
  if (!src.name && !src.description) {
    console.warn("skip empty source", p.slug);
    continue;
  }
  const i18n = p.i18n || {};
  const dsI18n = p.datasheet?.i18n || {};
  for (const lang of TARGET_LANGS) {
    if (i18n[lang]?.translated && dsI18n[lang]?.translated && !FORCE) {
      skippedBlocks++;
      continue;
    }
    if (!FORCE && skipSet.has(skipKey(p.slug, lang))) {
      skippedBlocks++;
      say("skip-failed", p.slug, "→", lang);
      continue;
    }
    jobs.push({ p, lang, src });
  }
}
say("jobs", jobs.length, "products", products.length, "concurrency", CONCURRENCY);

await mapPool(jobs, CONCURRENCY, async ({ p, lang, src }) => {
  try {
    say("translate", p.slug, "→", lang);
    const t = await translateOne(src, lang);
    const loc = emptyLocaleBlock({
      name: t.name,
      summary: t.summary,
      description: t.description,
      benefits: t.benefits,
      overview: t.overview,
      applications: t.applications,
      translated: true,
      lang,
    });
    const dsLoc = {
      name: t.name,
      summary: t.summary,
      description: t.description,
      benefits: t.benefits,
      overview: t.overview,
      applications: t.applications,
      specs: t.specs,
      translated: true,
      lang,
    };
    const htmlDoc = buildDatasheetHtml(
      {
        name: t.name,
        model: p.model,
        smartId: p.smartId,
        summary: t.summary,
        description: t.description,
        benefits: t.benefits,
        overview: t.overview,
        applications: t.applications,
        specs: t.specs,
      },
      lang
    );
    const { nameSlug, mediaSlug } = await mutex(() => {
      const mediaSlug = p.cdn?.slug || allocateProductMediaSlug(p, new Set());
      p.cdn = p.cdn || { bucket: "circuitbull-media", slug: mediaSlug, prefix: "products" };
      const own = new Set(Object.values(p.cdn.datasheetSlugs || {}).map(String).filter(Boolean));
      let nameSlug = datasheetNameSlug(t.name);
      if (usedNameSlugs.has(nameSlug) && !own.has(nameSlug)) {
        nameSlug = allocateDatasheetNameSlug(t.name, usedNameSlugs, p.model || p.slug);
      } else {
        usedNameSlugs.add(nameSlug);
      }
      p.cdn.datasheetSlugs = { ...(p.cdn.datasheetSlugs || {}), [lang]: nameSlug };
      return { nameSlug, mediaSlug: p.cdn.slug };
    });
    await r2Put(productNameDatasheetKey(nameSlug), htmlDoc, "text/html; charset=utf-8");
    const now = new Date().toISOString();
    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          [`i18n.${lang}`]: loc,
          [`datasheet.i18n.${lang}`]: dsLoc,
          "datasheetStatus.translatedAt": now,
          "cdn.bucket": "circuitbull-media",
          "cdn.slug": mediaSlug,
          "cdn.prefix": "products",
          [`cdn.datasheetSlugs.${lang}`]: nameSlug,
          updatedAt: new Date(),
        },
      }
    );
    translatedBlocks++;
    touchedSlugs.add(p.slug);
    await mutex(() => {
      skipSet.delete(skipKey(p.slug, lang));
      saveSkip(skipSet);
    });
    say("ok", p.slug, "→", lang);
    if (DELAY_MS) await sleep(DELAY_MS);
  } catch (e) {
    failedBlocks++;
    await mutex(() => {
      skipSet.add(skipKey(p.slug, lang));
      saveSkip(skipSet);
    });
    say("fail", p.slug, lang, e.message);
    if (DELAY_MS) await sleep(DELAY_MS);
  }
});

const productsTouched = touchedSlugs.size;

say(
  JSON.stringify(
    {
      products: products.length,
      productsTouched,
      translatedBlocks,
      skippedBlocks,
      failedBlocks,
      langs: TARGET_LANGS,
      concurrency: CONCURRENCY,
      model: cfg.model,
    },
    null,
    2
  )
);
await client.close();
