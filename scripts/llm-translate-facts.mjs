/**
 * Translate product.facts[*].i18n labels + values for all supported locales.
 * Idempotent per fact/lang unless --force
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_META } from "./lib/locales.mjs";
import { runJsonChat, getAiConfig } from "./lib/workers-ai.mjs";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const LANGS_ARG = (args.find((a) => a.startsWith("--langs=")) || "").split("=")[1] || "";
const DELAY_MS = Number(process.env.LLM_DELAY_MS || 700);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGET_LANGS = (LANGS_ARG ? LANGS_ARG.split(",") : SUPPORTED_LOCALES)
  .map((s) => s.trim())
  .filter((l) => l && l !== DEFAULT_LOCALE);

async function translateFactsBatch(facts, lang) {
  const meta = LOCALE_META[lang] || { name: lang };
  const payload = facts.map((f) => ({
    id: f.id,
    groupLabel: f.i18n?.en?.groupLabel || f.groupKey,
    label: f.i18n?.en?.label || f.propertyKey,
    value: f.i18n?.en?.value || f.value,
  }));

  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content: "You translate technical product fact labels/values for Circuitbull®. Output only JSON.",
      },
      {
        role: "user",
        content: `Translate these ontology facts into "${lang}" (${meta.name}).
Return ONLY: { "items": [ { "id": "...", "groupLabel": "...", "label": "...", "value": "..." } ] }
Keep model numbers, IP ratings, units (°C, kg, mm, W), and acronyms (PTZ, IP66, NETD) intact.
Source:
${JSON.stringify(payload)}`,
      },
    ],
    { temperature: 0.2 }
  );

  const items = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
  const byId = Object.fromEntries(items.map((x) => [x.id, x]));
  return byId;
}

const cfg = getAiConfig();
if (!cfg.configured) {
  console.error("Workers AI not configured");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const filter = { "facts.0": { $exists: true } };
if (ONLY_SLUG) filter.slug = ONLY_SLUG;
let cursor = db.collection("products").find(filter).sort({ slug: 1 });
if (LIMIT > 0) cursor = cursor.limit(LIMIT);
const products = await cursor.toArray();

let translated = 0;
let skipped = 0;
let failed = 0;

for (const p of products) {
  let facts = structuredClone(p.facts || []);
  let touched = false;

  for (const lang of TARGET_LANGS) {
    const need = FORCE
      ? facts
      : facts.filter((f) => !f.i18n?.[lang]?.translated);
    if (!need.length) {
      skipped++;
      continue;
    }
    // batch in chunks of 25
    for (let i = 0; i < need.length; i += 25) {
      const chunk = need.slice(i, i + 25);
      try {
        console.log("translate-facts", p.slug, "→", lang, `chunk ${i / 25 + 1}`);
        const byId = await translateFactsBatch(chunk, lang);
        for (const f of facts) {
          const t = byId[f.id];
          if (!t) continue;
          f.i18n = f.i18n || {};
          f.i18n[lang] = {
            groupLabel: t.groupLabel || f.i18n.en?.groupLabel,
            label: t.label || f.i18n.en?.label,
            value: t.value || f.value,
            translated: true,
            lang,
          };
          translated++;
          touched = true;
        }
        await sleep(DELAY_MS);
      } catch (e) {
        failed++;
        console.warn("fail", p.slug, lang, e.message);
        await sleep(DELAY_MS);
      }
    }
  }

  if (touched) {
    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          facts,
          "datasheetStatus.factsTranslatedAt": new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    );
  }
}

console.log(JSON.stringify({ products: products.length, translated, skipped, failed, langs: TARGET_LANGS }, null, 2));
await client.close();
