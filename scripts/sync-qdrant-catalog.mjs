/**
 * Index one vector per catalog product into Qdrant `catalog_products`
 * for similar-platform recommendations.
 *
 * Usage: node scripts/sync-qdrant-catalog.mjs
 */
import "dotenv/config";
import { createHash } from "crypto";
import { MongoClient } from "mongodb";

const COLLECTION = process.env.QDRANT_CATALOG_COLLECTION || "catalog_products";
const QDRANT_URL = (process.env.QDRANT_URL || "").replace(/\/$/, "");
const QDRANT_KEY = process.env.QDRANT_API_KEY;
const ACCOUNT = process.env.CF_AI_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_AI_API_TOKEN || process.env.CF_API_TOKEN;
const EMBED_MODEL = process.env.CF_AI_EMBED_MODEL || "@cf/baai/bge-base-en-v1.5";

if (!QDRANT_URL || !QDRANT_KEY) {
  console.error("QDRANT_URL / QDRANT_API_KEY missing");
  process.exit(1);
}
if (!ACCOUNT || !TOKEN) {
  console.error("CF AI credentials required");
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
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${EMBED_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [String(text).slice(0, 2000)] }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json?.errors?.[0]?.message || `embed HTTP ${res.status}`);
  }
  const data = json.result?.data || json.result;
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  if (Array.isArray(data)) return data;
  throw new Error("unexpected embed response");
}

function pointId(slug) {
  const h = createHash("sha1").update(`catalog:${slug}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function productText(p) {
  const en = p.i18n?.en || {};
  return [
    p.slug,
    p.model,
    p.smartId,
    p.sku,
    p.name,
    en.name,
    p.summary,
    en.summary,
    (p.needSlugs || []).join(" "),
    (p.applications || en.applications || []).join(" "),
    p.category,
  ]
    .filter(Boolean)
    .join(" | ");
}

const probe = await embed("circuitbull catalog probe");
const dim = probe.length;
try {
  await qdrant(`/collections/${COLLECTION}`);
  console.log("collection exists", COLLECTION);
} catch {
  await qdrant(`/collections/${COLLECTION}`, {
    method: "PUT",
    body: JSON.stringify({ vectors: { size: dim, distance: "Cosine" } }),
  });
  console.log("created collection", COLLECTION, "dim", dim);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({ slug: { $exists: true } }).toArray();
console.log("products", products.length);

let upserted = 0;
let failed = 0;
const batch = [];
for (const p of products) {
  if (!p.slug) continue;
  try {
    const vector = await embed(productText(p));
    batch.push({
      id: pointId(p.slug),
      vector,
      payload: {
        slug: p.slug,
        smartId: p.smartId || p.sku || null,
        name: p.name || p.i18n?.en?.name || "",
        needSlugs: p.needSlugs || [],
      },
    });
    if (batch.length >= 8) {
      const chunk = batch.splice(0, batch.length);
      await qdrant(`/collections/${COLLECTION}/points?wait=true`, {
        method: "PUT",
        body: JSON.stringify({ points: chunk }),
      });
      upserted += chunk.length;
      process.stdout.write(`upserted ${upserted}\r`);
    }
  } catch (err) {
    failed += 1;
    console.error("fail", p.slug, err.message);
  }
}
if (batch.length) {
  await qdrant(`/collections/${COLLECTION}/points?wait=true`, {
    method: "PUT",
    body: JSON.stringify({ points: batch }),
  });
  upserted += batch.length;
}
await client.close();
console.log("\ndone", { upserted, failed, collection: COLLECTION });
