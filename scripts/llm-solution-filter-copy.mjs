/**
 * LLM-write sector smart-filter copy per solution × locale.
 * Mongo: needs.i18n[lang].filter
 * Redis: solution:filter:{slug}:{lang}  +  solutions:filter:{lang}
 *
 *   node scripts/llm-solution-filter-copy.mjs
 *   node scripts/llm-solution-filter-copy.mjs --lang=en
 *   node scripts/llm-solution-filter-copy.mjs --slug=oilfield-depot --lang=en
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { getOllamaConfig, ollamaJson } from "./lib/ollama.mjs";
import { SUPPORTED_LOCALES } from "./lib/locales.mjs";
import {
  SOLUTION_SLUGS,
  SOLUTIONS,
  solutionFilterIndexKey,
  solutionFilterKey,
} from "./lib/solutions.mjs";

const args = process.argv.slice(2);
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const ONLY_LANG = (args.find((a) => a.startsWith("--lang=")) || "").split("=")[1] || "";
const MODEL = (args.find((a) => a.startsWith("--model=")) || "").split("=")[1] || getOllamaConfig().model;
const FORCE = args.includes("--force");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slugs = ONLY_SLUG ? [ONLY_SLUG] : SOLUTION_SLUGS;
const langs = ONLY_LANG ? [ONLY_LANG] : SUPPORTED_LOCALES;

function cleanFilter(raw, fallback = {}) {
  const chips = Array.isArray(raw?.chips) ? raw.chips.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : fallback.chips || [];
  const facetPriority = Array.isArray(raw?.facetPriority)
    ? raw.facetPriority.map((x) => String(x).trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : fallback.facetPriority || [];
  const pick = (k, max) => String(raw?.[k] || fallback[k] || "").trim().slice(0, max);
  return {
    kicker: pick("kicker", 48),
    title: pick("title", 72),
    sub: pick("sub", 220),
    recommend: pick("recommend", 240),
    placeholder: pick("placeholder", 80),
    listTitle: pick("listTitle", 64),
    query: pick("query", 80),
    chips,
    facetPriority,
  };
}

async function writeEnglish(slug) {
  const def = SOLUTIONS[slug];
  const en = def.i18n.en;
  const { json } = await ollamaJson(
    [
      {
        role: "system",
        content:
          "You write buyer-facing filter copy for a military-grade sensor catalog. Practical. No ontology, graph, i18n, or engineering jargon. Output only JSON.",
      },
      {
        role: "user",
        content: `Write filter copy ONLY for this one mission. Do not mention oil, gas, pipelines, or tank farms unless the slug is oilfield-depot or storage.

Slug: ${slug}
Title: ${en.title}
Problem: ${en.problem}
Lead: ${en.lead}

The buyer is specifying military-grade cameras for THIS mission. Copy must name this sector's sites.
${slug === "oilfield-depot" ? `
Oil & gas MUST name pipelines, tank farms / tank storage, and hazard / Ex zones.
Headline + recommend should tell the buyer to filter for the best result in those zones (explosion-proof housing, IP rating, range).
` : ""}
Return JSON:
{
  "kicker": "2-4 word sector label matching ${en.title}",
  "title": "short practical headline (Find / Filter / Specify…)",
  "sub": "one sentence: the sites in THIS sector + filter for the best result",
  "recommend": "what to filter first for THIS sector",
  "placeholder": "short search hint",
  "listTitle": "Platforms for ${en.title}",
  "query": "3-6 keywords for THIS sector",
  "chips": ["IP66", "PTZ", "thermal"],
  "facetPriority": ["housing", "detection", "thermal", "ptz", "environment"]
}

facetPriority from: housing, ptz, thermal, sensor, lens, detection, environment, power, interface, laser, enhancements.`,
      },
    ],
    { model: MODEL, temperature: 0.25, timeoutMs: 180000 }
  );
  return cleanFilter(json);
}

async function writeLocale(slug, lang, enFilter) {
  if (lang === "en") return enFilter;
  const def = SOLUTIONS[slug];
  const title = def.i18n[lang]?.title || def.i18n.en.title;
  const { json } = await ollamaJson(
    [
      {
        role: "system",
        content: `Translate catalog filter copy into locale "${lang}". Keep SKU/spec tokens (IP66, PTZ, EO/IR, Ex). Output only JSON with the same keys.`,
      },
      {
        role: "user",
        content: `Locale: ${lang}
Solution: ${title}
English JSON:
${JSON.stringify(enFilter, null, 2)}

Return the same keys translated. facetPriority stays English snake_case. chips may stay spec tokens.`,
      },
    ],
    { model: MODEL, temperature: 0.15, timeoutMs: 240000 }
  );
  return cleanFilter(json, enFilter);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

let redis = null;
if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: (retries) => Math.min(500 * retries, 4000) },
  });
  redis.on("error", (e) => console.warn("redis", e.message));
  await redis.connect();
}

function isTransient(err) {
  const msg = `${err?.name || ""} ${err?.code || ""} ${err?.message || err}`;
  return /abort|ETIMEDOUT|ECONNRESET|EPIPE|UND_ERR/i.test(msg);
}
process.on("uncaughtException", (err) => {
  if (isTransient(err)) {
    console.warn("transient", err.message || err);
    return;
  }
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  if (isTransient(err)) {
    console.warn("transient", err?.message || err);
    return;
  }
  console.error(err);
  process.exit(1);
});

let wrote = 0;
const indexByLang = {};

for (const slug of slugs) {
  const need = await db.collection("needs").findOne({ slug });
  if (!need) {
    console.warn("skip missing need", slug);
    continue;
  }
  let enFilter = need.i18n?.en?.filter;
  if ((!enFilter?.title || FORCE) && (!ONLY_LANG || ONLY_LANG === "en")) {
    console.log("llm en", slug);
    enFilter = await writeEnglish(slug);
    await sleep(150);
  }
  if (!enFilter?.title) {
    console.warn("no en filter", slug);
    continue;
  }

  for (const lang of langs) {
    const existing = need.i18n?.[lang]?.filter;
    let block = existing;
    if (lang === "en") block = enFilter;
    else if (!existing?.title || FORCE) {
      console.log("llm", lang, slug);
      try {
        block = await writeLocale(slug, lang, enFilter);
      } catch (err) {
        console.warn("llm fail", lang, slug, err.message || err);
        block = existing || enFilter;
      }
      await sleep(120);
    }
    if (!block?.title) continue;

    await db.collection("needs").updateOne(
      { slug },
      {
        $set: {
          [`i18n.${lang}.filter`]: block,
          updatedAt: new Date(),
        },
      }
    );
    if (redis) {
      try {
        await redis.set(solutionFilterKey(slug, lang), JSON.stringify({ slug, lang, ...block }));
      } catch (err) {
        console.warn("redis set", slug, lang, err.message);
      }
    }
    if (!indexByLang[lang]) indexByLang[lang] = {};
    indexByLang[lang][slug] = block;
    wrote += 1;
    console.log(`${slug} ${lang} → ${block.title}`);
  }
}

if (redis) {
  for (const [lang, map] of Object.entries(indexByLang)) {
    try {
      await redis.set(solutionFilterIndexKey(lang), JSON.stringify({ lang, slugs: map, builtAt: new Date().toISOString() }));
    } catch (err) {
      console.warn("redis index", lang, err.message);
    }
  }
  await redis.quit().catch(() => {});
}

console.log(JSON.stringify({ wrote, slugs: slugs.length, langs: langs.length, model: MODEL, redis: Boolean(process.env.REDIS_URL) }, null, 2));
await client.close();
