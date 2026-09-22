/**
 * LLM parse cleaned datasheet specs → unified ontology facts on product.
 * Idempotent: skip if facts.length && datasheetStatus.factsParsed unless --force
 *
 * Usage:
 *   node scripts/llm-parse-facts.mjs
 *   node scripts/llm-parse-facts.mjs --slug=agt-tc12618c-49375081 --force
 *   node scripts/llm-parse-facts.mjs --limit=5
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { runJsonChat, getAiConfig } from "./lib/workers-ai.mjs";
import { groupsToFacts, KNOWN_GROUP_HINTS } from "./lib/ontology.mjs";
import { stripHtmlToText } from "./lib/datasheet-html.mjs";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const DELAY_MS = Number(process.env.LLM_DELAY_MS || 700);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function parseFacts(product) {
  const specs = product.specs || product.datasheet?.specs || {};
  const textExtra = stripHtmlToText(
    product.datasheet?.rawHtml || product.datasheet?.html || product.descriptionHtml || "",
    12000
  );

  const userPrompt = `Parse this Circuitbull® product datasheet into a UNIFIED PROPERTY ONTOLOGY.
Return ONLY JSON:
{
  "groups": [
    {
      "key": "housing",
      "label": "Housing",
      "properties": [
        { "key": "material", "label": "Material", "value": "Aluminum alloy" },
        { "key": "sealing_rate", "label": "Sealing / IP rating", "value": "IP66" }
      ]
    }
  ]
}

Rules:
- Split semicolon/comma/numbered blobs (Housing, PTZ, Enhancements, Consumption, Detection ranges, etc.) into ATOMIC facts.
- group.key must be snake_case from: ${KNOWN_GROUP_HINTS.join(", ")} (or a close new key).
- property.key short snake_case WITHOUT repeating the group prefix.
- One fact = one measurable or discrete attribute (do not leave long paragraphs as a single value when they contain multiple attributes).
- Keep units in the value string.
- Prefer English labels.
- Do NOT invent specs not supported by the source.
- Model numbers and SMARTID stay as-is.

Product: ${product.name || ""}
Model: ${product.model || ""}
SMARTID: ${product.smartId || ""}

Specs object (may contain messy multi-attribute strings):
${JSON.stringify(specs).slice(0, 12000)}

Extra text (optional):
"""
${textExtra.slice(0, 8000)}
"""`;

  const { json } = await runJsonChat(
    [
      {
        role: "system",
        content:
          "You are a product ontology engineer for Circuitbull®. Output only JSON with groups[].properties[]. No markdown.",
      },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.15 }
  );

  const groups = Array.isArray(json?.groups) ? json.groups : Array.isArray(json) ? json : [];
  return groupsToFacts(groups, product);
}

const cfg = getAiConfig();
if (!cfg.configured) {
  console.error("Workers AI not configured");
  process.exit(1);
}
console.log("AI", cfg.model);

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const filter = {};
if (ONLY_SLUG) filter.slug = ONLY_SLUG;
else filter["datasheetStatus.cleaned"] = true;

let cursor = db.collection("products").find(filter).sort({ slug: 1 });
if (LIMIT > 0) cursor = cursor.limit(LIMIT);
const products = await cursor.toArray();

let parsed = 0;
let skipped = 0;
let failed = 0;

for (const p of products) {
  if (p.datasheetStatus?.factsParsed && Array.isArray(p.facts) && p.facts.length && !FORCE) {
    skipped++;
    console.log("skip", p.slug, `facts=${p.facts.length}`);
    continue;
  }
  try {
    console.log("parse-facts", p.slug, "…");
    const facts = await parseFacts(p);
    if (!facts.length) throw new Error("no facts extracted");
    const now = new Date().toISOString();
    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          facts,
          "datasheet.groups": [...new Set(facts.map((f) => f.groupKey))],
          "datasheetStatus.factsParsed": true,
          "datasheetStatus.factsParsedAt": now,
          "datasheetStatus.factsModel": cfg.model,
          updatedAt: new Date(),
        },
      }
    );
    parsed++;
    const byGroup = facts.reduce((m, f) => {
      m[f.groupKey] = (m[f.groupKey] || 0) + 1;
      return m;
    }, {});
    console.log("ok", p.slug, "facts=", facts.length, byGroup);
    await sleep(DELAY_MS);
  } catch (e) {
    failed++;
    console.warn("fail", p.slug, e.message);
    await sleep(DELAY_MS);
  }
}

console.log(JSON.stringify({ parsed, skipped, failed, total: products.length }, null, 2));
await client.close();
