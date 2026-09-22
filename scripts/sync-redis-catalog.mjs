/**
 * Build compact Find-platforms indexes → Redis (+ Cloudflare KV when creds exist)
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { syncPlatformSearchIndex } from "./lib/platform-index.mjs";

const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const EMAIL = process.env.CF_AUTH_EMAIL;
const GLOBAL_KEY = process.env.CF_GLOBAL_API_KEY;
const NS_TITLE = "circuitbull-data";

function authHeaders(extra = {}) {
  if (EMAIL && GLOBAL_KEY) {
    return {
      "X-Auth-Email": EMAIL,
      "X-Auth-Key": GLOBAL_KEY,
      "Content-Type": "application/json",
      ...extra,
    };
  }
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function cf(path, opts = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...opts,
    headers: authHeaders(opts.headers || {}),
  });
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors || json));
  return json.result;
}

async function getNamespaceId() {
  if (!ACCOUNT || !(TOKEN || (EMAIL && GLOBAL_KEY))) return null;
  const list = await cf(`/accounts/${ACCOUNT}/storage/kv/namespaces?per_page=100`);
  const found = list.find((n) => n.title === NS_TITLE);
  return found?.id || null;
}

async function putKey(nsId, key, value) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: typeof value === "string" ? value : JSON.stringify(value),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({}).toArray();
await client.close();

let nsId = null;
try {
  nsId = await getNamespaceId();
} catch (e) {
  console.warn("kv lookup skipped", e.message || e);
}

const result = await syncPlatformSearchIndex({
  products,
  putKey: nsId ? putKey : undefined,
  nsId,
});

console.log(JSON.stringify({ products: products.length, kv: Boolean(nsId), ...result }, null, 2));
