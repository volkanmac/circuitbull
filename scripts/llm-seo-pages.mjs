/**
 * LLM SEO copy for products + solutions in every site locale.
 * Default: local Ollama (no API cost) → remote MongoDB.
 *
 *   npm run llm-seo -- --only=products
 *   npm run llm-seo -- --only=solutions --slug=border-control
 *   npm run llm-seo -- --only=products --model=gemma2:27b
 *   npm run llm-seo -- --provider=workers --concurrency=8
 *   npm run llm-seo -- --force
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_META } from "./lib/locales.mjs";
import { SOLUTION_SLUGS, SOLUTIONS } from "./lib/solutions.mjs";
import { getOllamaConfig, ollamaJson } from "./lib/ollama.mjs";
import { runJsonChat as workersJsonChat, getAiConfig } from "./lib/workers-ai.mjs";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "all";
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const PROVIDER = (args.find((a) => a.startsWith("--provider=")) || "").split("=")[1] || process.env.LLM_PROVIDER || "ollama";
const MODEL_ARG = (args.find((a) => a.startsWith("--model=")) || "").split("=")[1] || "";
const USE_OLLAMA = PROVIDER !== "workers" && PROVIDER !== "cf";
const CONCURRENCY = Math.max(
  1,
  Number(
    (args.find((a) => a.startsWith("--concurrency=")) || "").split("=")[1] ||
      process.env.SEO_CONCURRENCY ||
      (USE_OLLAMA ? 1 : 8)
  ) || 1
);
const DELAY_MS = Number(process.env.LLM_DELAY_MS || (CONCURRENCY > 1 ? 0 : USE_OLLAMA ? 80 : 700));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function runJsonChat(messages, opts = {}) {
  if (!USE_OLLAMA) return workersJsonChat(messages, opts);
  const model = MODEL_ARG || getOllamaConfig().model;
  return ollamaJson(messages, {
    temperature: opts.temperature ?? 0.2,
    model,
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 180000),
  });
}

const LANGS = SUPPORTED_LOCALES.filter(Boolean);

const CAP_SLUGS = {
  "seaport-airport": ["runway-apron-thermal", "harbor-channel-tracking", "perimeter-ptz-handoff", "quote-ready-skus"],
  "water-systems": ["reservoir-perimeter", "open-water-night-fog", "pump-transformer-heat", "iot-scada-live"],
  storage: ["yard-dock-thermal", "stockpile-fence", "low-light-patrol-handoff", "datasheet-skus"],
  "base-security": ["fence-approach", "gate-pad-overwatch", "rugged-housings", "mission-quote"],
  "oilfield-depot": ["tank-farm-perimeter", "explosion-proof", "heat-flame-cueing", "sku-range-rating"],
  "fire-prevention": ["hotspot-standoff", "forest-industrial-yard", "no-floodlight", "live-monitoring-alerts"],
  ecological: ["low-impact-night", "wetland-corridor", "long-range-observation", "detection-figures"],
  "border-control": ["multi-km-detection", "coastal-craft", "radar-ptz-handoff", "iot-scada-layer"],
  "urban-anti-uav": ["small-uav-cueing", "street-plaza", "radar-eoir", "city-venue-skus"],
  "highway-railway": ["right-of-way", "station-yard", "night-no-lighting", "datasheet-ptz"],
  "city-safety": ["tower-rooftop", "municipal-weather", "tender-sku-specs", "quote-support"],
  "stadium-plaza": ["approach-parking", "crowd-edge", "day-night-id", "event-quote"],
  "lake-river": ["channel-bank", "bridge-collision", "aquaculture", "live-monitoring"],
};

function clip(s, max) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function productPayload(p, lang = DEFAULT_LOCALE) {
  const loc = p.i18n?.[lang] || {};
  const en = p.i18n?.en || {};
  const ds = p.datasheet?.i18n?.[lang] || p.datasheet?.i18n?.en || p.datasheet || {};
  const specs = ds.specs || p.specs || {};
  const specPairs = Object.entries(specs)
    .slice(0, 24)
    .map(([k, v]) => `${k}: ${v}`);
  const facts = (Array.isArray(p.facts) ? p.facts : [])
    .slice(0, 14)
    .map((f) => {
      const k = f.label || f.propertyKey || f.groupKey || "";
      const v = f.value;
      return k && v != null ? `${k}: ${v}` : "";
    })
    .filter(Boolean);
  return {
    slug: p.slug,
    sku: p.sku || p.smartId || "",
    model: p.model || "",
    lang,
    name: loc.name || en.name || p.name || "",
    summary: clip(loc.summary || en.summary || p.summary, 400),
    description: clip(loc.description || en.description || p.description, 900),
    applications: (loc.applications?.length ? loc.applications : en.applications || p.applications || []).slice(0, 10),
    needSlugs: p.needSlugs || [],
    benefits: (loc.benefits?.length ? loc.benefits : en.benefits || p.benefits || []).slice(0, 6),
    specs: specPairs,
    facts,
  };
}

function solutionPayload(slug, needDoc) {
  const def = SOLUTIONS[slug] || {};
  const en = needDoc?.i18n?.en || def.i18n?.en || {};
  const tr = needDoc?.i18n?.tr || def.i18n?.tr || {};
  const caps = Array.isArray(en.capabilities) ? en.capabilities : [];
  const storedCaps = needDoc?.i18n?.en?.caps || {};
  return {
    slug,
    code: needDoc?.code || def.code || "",
    title: en.title || slug,
    problem: clip(en.problem, 280),
    lead: clip(en.lead, 400),
    capabilities: caps.slice(0, 6),
    trTitle: tr.title || "",
    capPages: (CAP_SLUGS[slug] || []).map((capSlug) => ({
      slug: capSlug,
      title: storedCaps[capSlug]?.title || capSlug.replace(/-/g, " "),
      lead: clip(storedCaps[capSlug]?.lead, 240),
    })),
  };
}

function normalizeSeoMap(json, fallbackTitle, fallbackDesc) {
  const out = {};
  const src = json && typeof json === "object" ? json : {};
  for (const lang of LANGS) {
    const block = src[lang] && typeof src[lang] === "object" ? src[lang] : {};
    const seoTitle = clip(block.seoTitle || block.title || fallbackTitle, 70);
    const seoDescription = clip(block.seoDescription || block.description || fallbackDesc, 170);
    out[lang] = {
      seoTitle: seoTitle || fallbackTitle,
      seoDescription: seoDescription || fallbackDesc,
      slogan: clip(block.slogan, 120) || undefined,
      description: clip(block.description, 900) || undefined,
      title: clip(block.title, 90) || undefined,
      problem: clip(block.problem, 320) || undefined,
      lead: clip(block.lead, 500) || undefined,
      capabilities: Array.isArray(block.capabilities)
        ? block.capabilities.map((x) => clip(x, 140)).filter(Boolean).slice(0, 8)
        : undefined,
      caps: block.caps && typeof block.caps === "object" ? block.caps : undefined,
    };
  }
  return out;
}

async function seoForProductLang(row, lang) {
  const meta = LOCALE_META[lang] || { name: lang };
  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content: `You are Circuitbull® SEO. Write in ${meta.name} (${lang}) only. Output only JSON. No markdown.`,
      },
      {
        role: "user",
        content: `Write locale-native SEO meta AND the product page Description section in ${lang} (${meta.name}).

Product JSON:
${JSON.stringify(row, null, 2)}

Canonical: ${lang === "en" ? `https://circuitbull.com/products/${row.slug}` : `https://circuitbull.com/${lang}/products/${row.slug}`}

Return ONLY JSON:
{
  "seoTitle": "max 60 chars, include model/name, end with | Circuitbull® when it fits",
  "seoDescription": "140-160 character HTML meta description",
  "slogan": "hero line under the H1, max 90 chars",
  "description": "page Description section: 2-4 sentences, 400-800 chars, buyer-facing"
}

Rules:
- Write IN ${meta.name}. Do not leave English for a non-en locale.
- seoDescription is the <meta name="description"> snippet (short).
- description is the on-page Description block (longer than meta).
- Ground copy in the specs and facts JSON (range, detector, PTZ, IP rating). Do not invent numbers.
- Keep SKU, model numbers, PTZ, EO/IR, LWIR, IP66 untranslated.
- Brand is Circuitbull®. Do not invent other manufacturers.
- Cameras are catalog sensors, not Made in USA.`,
      },
    ],
    { temperature: 0.25, maxRetries: 2 }
  );
  const j = json && typeof json === "object" ? json : {};
  return {
    seoTitle: clip(j.seoTitle || j.title, 70),
    seoDescription: clip(j.seoDescription, 170),
    slogan: clip(j.slogan, 120),
    description: clip(j.description, 2000),
  };
}

async function seoForSolutionLang(row, lang) {
  const meta = LOCALE_META[lang] || { name: lang };
  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content: `You are Circuitbull® SEO. Write in ${meta.name} (${lang}) only. Output only JSON.`,
      },
      {
        role: "user",
        content: `Localize this mission solution into ${lang} (${meta.name}).

${JSON.stringify({ slug: row.slug, code: row.code, title: row.title, problem: row.problem, lead: row.lead, capabilities: row.capabilities }, null, 2)}

Canonical: ${lang === "en" ? `https://circuitbull.com/solutions/${row.slug}` : `https://circuitbull.com/${lang}/solutions/${row.slug}`}

Return:
{
  "title": "native mission title",
  "problem": "one sentence",
  "lead": "two sentences, buyer-facing",
  "description": "page body, 2-4 sentences",
  "capabilities": ["four short lines"],
  "seoTitle": "max 60 chars | Circuitbull®",
  "seoDescription": "140-160 chars native"
}

Keep PTZ, EO/IR, SKU, IP ratings. Brand Circuitbull®. No other manufacturer names.
Also return a longer on-page "description" (2-4 sentences) for the solution page body if lead is short.`,
      },
    ],
    { temperature: 0.2, maxRetries: 2 }
  );
  const wrapped = { [lang]: json };
  return normalizeSeoMap(wrapped, `${row.title} | Circuitbull®`, clip(row.lead || row.problem || row.title, 160))[lang];
}

let cfg;
if (USE_OLLAMA) {
  const ollama = getOllamaConfig();
  const model = MODEL_ARG || ollama.model;
  let tags;
  try {
    const res = await fetch(`${ollama.host}/api/tags`);
    tags = await res.json();
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  } catch (e) {
    console.error(`Ollama not reachable at ${ollama.host}. Start it with: ollama serve`);
    console.error(e.message);
    process.exit(1);
  }
  const names = (tags.models || []).map((m) => m.name);
  if (!names.some((n) => n === model || n.startsWith(`${model.split(":")[0]}:`))) {
    console.error("Ollama model missing:", model, "have:", names.join(", ") || "(none)");
    process.exit(1);
  }
  cfg = { model, host: ollama.host, provider: "ollama" };
} else {
  cfg = { ...getAiConfig(), provider: "workers" };
  if (!cfg.configured) {
    console.error("Workers AI not configured");
    process.exit(1);
  }
}
console.log("AI", cfg.provider, cfg.model, cfg.host || "", "langs", LANGS.join(","), "only", ONLY, "concurrency", CONCURRENCY);

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const stats = { products: 0, productsTouched: 0, solutions: 0, solutionsTouched: 0, failed: 0 };

if (ONLY === "all" || ONLY === "solutions") {
  const needFilter = ONLY_SLUG ? { slug: ONLY_SLUG } : {};
  const needs = await db.collection("needs").find(needFilter).toArray();
  const slugs = (needs.length ? needs.map((n) => n.slug) : ONLY_SLUG ? [ONLY_SLUG] : SOLUTION_SLUGS).filter(Boolean);
  for (const slug of slugs) {
    const need = needs.find((n) => n.slug === slug) || { slug, i18n: SOLUTIONS[slug]?.i18n || {} };
    const hasAll =
      LANGS.every((l) => need.i18n?.[l]?.seoDescription && need.i18n?.[l]?.title) && !FORCE;
    if (hasAll) {
      console.log("skip solution", slug);
      continue;
    }
    stats.solutions += 1;
    try {
      console.log("seo solution", slug);
      const row = solutionPayload(slug, need);
      const i18n = { ...(need.i18n || {}) };
      for (const lang of LANGS) {
        if (i18n[lang]?.seoDescription && i18n[lang]?.title && !FORCE) {
          continue;
        }
        console.log("  ", slug, "→", lang);
        try {
          const next = await seoForSolutionLang(row, lang);
          const prev = i18n[lang] || {};
          const pageDesc = clip(next.description || next.lead, 900) || prev.description || "";
          i18n[lang] = {
            ...prev,
            title: next.title || prev.title || SOLUTIONS[slug]?.i18n?.en?.title || slug,
            problem: next.problem || prev.problem || SOLUTIONS[slug]?.i18n?.en?.problem || "",
            lead: next.lead || prev.lead || SOLUTIONS[slug]?.i18n?.en?.lead || "",
            description: pageDesc || prev.description || next.lead || "",
            capabilities: next.capabilities?.length
              ? next.capabilities
              : prev.capabilities || SOLUTIONS[slug]?.i18n?.en?.capabilities || [],
            seoTitle: next.seoTitle,
            seoDescription: next.seoDescription,
            caps: prev.caps || {},
            translated: true,
            lang,
          };
          await db.collection("needs").updateOne(
            { slug },
            {
              $set: {
                slug,
                type: "need",
                solutionSlug: slug,
                code: need.code || SOLUTIONS[slug]?.code,
                catalog: need.catalog !== false,
                [`i18n.${lang}`]: i18n[lang],
                updatedAt: new Date(),
                "seoStatus.generatedAt": new Date().toISOString(),
              },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
        } catch (e) {
          stats.failed += 1;
          console.warn("fail", slug, lang, e.message);
        }
        await sleep(DELAY_MS);
      }
      stats.solutionsTouched += 1;
    } catch (e) {
      stats.failed += 1;
      console.warn("fail solution", slug, e.message);
    }
    await sleep(DELAY_MS);
  }
}

if (ONLY === "all" || ONLY === "products") {
  const filter = ONLY_SLUG ? { slug: ONLY_SLUG } : {};
  let cursor = db.collection("products").find(filter).sort({ slug: 1 });
  if (LIMIT > 0) cursor = cursor.limit(LIMIT);
  const products = await cursor.toArray();
  stats.products = products.length;
  const jobs = [];
  for (const p of products) {
    for (const lang of LANGS) {
      const b = p.i18n?.[lang] || {};
      if (!FORCE && b.seoDescription && b.description) continue;
      jobs.push({ p, lang });
    }
  }
  console.log("seo product jobs", jobs.length, "of", products.length, "products");
  await mapPool(jobs, CONCURRENCY, async ({ p, lang }) => {
    const prev = p.i18n?.[lang] || {};
    const row = productPayload(p, lang);
    console.log("seo", p.slug, "→", lang);
    try {
      const next = await seoForProductLang(row, lang);
      const seoTitle = next.seoTitle || `${row.name} | Circuitbull®`;
      const seoDescription = next.seoDescription || clip(row.summary || row.name, 160);
      const slogan = next.slogan || prev.slogan || "";
      const description = prev.description && !FORCE ? prev.description : next.description || prev.description || row.description || "";
      const $set = {
        [`i18n.${lang}.seoTitle`]: seoTitle,
        [`i18n.${lang}.seoDescription`]: seoDescription,
        [`i18n.${lang}.lang`]: lang,
        "seoStatus.generatedAt": new Date().toISOString(),
        updatedAt: new Date(),
      };
      if (slogan) $set[`i18n.${lang}.slogan`] = slogan;
      if (description) $set[`i18n.${lang}.description`] = description;
      if (!prev.name && (lang === DEFAULT_LOCALE ? p.name : row.name)) {
        $set[`i18n.${lang}.name`] = prev.name || (lang === DEFAULT_LOCALE ? p.name : row.name) || "";
      }
      await db.collection("products").updateOne({ _id: p._id }, { $set });
      stats.productsTouched += 1;
      console.log("ok", p.slug, "→", lang);
    } catch (e) {
      stats.failed += 1;
      console.warn("fail", p.slug, lang, e.message);
    }
    if (DELAY_MS) await sleep(DELAY_MS);
  });
}

console.log(JSON.stringify({ ...stats, provider: cfg.provider, model: cfg.model, langs: LANGS }, null, 2));
await client.close();
