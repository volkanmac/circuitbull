/**
 * Index product facts into Qdrant collection `product_facts` for semantic Q&A.
 * Uses Cloudflare Workers AI embeddings when available, else hash-bag fallback vectors are NOT used —
 * requires CF Workers AI embed model or skips with warning.
 *
 * Usage: node scripts/sync-qdrant-facts.mjs [--force] [--slug=...]
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { createHash } from "crypto";

const COLLECTION = process.env.QDRANT_FACTS_COLLECTION || "product_facts";
const QDRANT_URL = (process.env.QDRANT_URL || "").replace(/\/$/, "");
const QDRANT_KEY = process.env.QDRANT_API_KEY;
const ACCOUNT = process.env.CF_AI_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_AI_API_TOKEN || process.env.CF_API_TOKEN;
const EMBED_MODEL = process.env.CF_AI_EMBED_MODEL || "@cf/baai/bge-base-en-v1.5";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY_SLUG = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const DELAY_MS = Number(process.env.LLM_DELAY_MS || 200);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!QDRANT_URL || !QDRANT_KEY) {
  console.error("QDRANT_URL / QDRANT_API_KEY missing");
  process.exit(1);
}

async function qdrant(path, opts = {}) {
  const res = await fetch(`${QDRANT_URL}${path}`, {
    ...opts,
    headers: {
      "api-key": QDRANT_KEY,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`Qdrant ${res.status} ${path}: ${text.slice(0, 300)}`);
  return json;
}

async function embed(text) {
  if (!ACCOUNT || !TOKEN) throw new Error("CF_AI credentials required for embeddings");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${EMBED_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [String(text).slice(0, 2000)] }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json?.errors?.[0]?.message || `embed HTTP ${res.status}`);
  }
  const data = json.result?.data || json.result;
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  if (Array.isArray(data)) return data;
  throw new Error("unexpected embed response");
}

function pointId(factId, lang) {
  // Qdrant unsigned int or UUID — use stable hash as unsigned 64-ish via hex→number string uuid
  const h = createHash("sha1").update(`${factId}:${lang}`).digest("hex");
  // UUID-like
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Ensure collection
let dim = 768;
try {
  await qdrant(`/collections/${COLLECTION}`);
  console.log("collection exists", COLLECTION);
} catch {
  // probe dim
  const probe = await embed("circuitbull fact probe");
  dim = probe.length;
  await qdrant(`/collections/${COLLECTION}`, {
    method: "PUT",
    body: JSON.stringify({
      vectors: { size: dim, distance: "Cosine" },
    }),
  });
  console.log("created collection", COLLECTION, "dim", dim);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const filter = { "facts.0": { $exists: true } };
if (ONLY_SLUG) filter.slug = ONLY_SLUG;
const products = await db.collection("products").find(filter).toArray();

let upserted = 0;
let failed = 0;

for (const p of products) {
  for (const f of p.facts || []) {
    for (const [lang, block] of Object.entries(f.i18n || { en: f.i18n?.en })) {
      if (!block) continue;
      if (!FORCE && lang !== "en" && !block.translated) continue;
      const text = [
        block.groupLabel || f.groupKey,
        block.label || f.propertyKey,
        block.value || f.value,
        p.model || "",
        p.smartId || "",
        p.name || "",
      ]
        .filter(Boolean)
        .join(" | ");
      try {
        const vector = await embed(text);
        await qdrant(`/collections/${COLLECTION}/points?wait=true`, {
          method: "PUT",
          body: JSON.stringify({
            points: [
              {
                id: pointId(f.id, lang),
                vector,
                payload: {
                  factId: f.id,
                  productId: String(p._id),
                  smartId: p.smartId || null,
                  slug: p.slug,
                  groupKey: f.groupKey,
                  propertyId: f.propertyId,
                  propertyKey: f.propertyKey,
                  lang,
                  label: block.label,
                  value: block.value || f.value,
                  groupLabel: block.groupLabel,
                  text,
                },
              },
            ],
          }),
        });
        upserted++;
        if (upserted % 20 === 0) console.log("upserted", upserted);
        await sleep(DELAY_MS);
      } catch (e) {
        failed++;
        console.warn("fail", p.slug, f.id, lang, e.message);
      }
    }
  }
}

console.log(JSON.stringify({ collection: COLLECTION, products: products.length, upserted, failed, dim }, null, 2));
await client.close();
