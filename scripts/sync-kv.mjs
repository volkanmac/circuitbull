/**
 * Sync Mongo collections → Cloudflare KV for edge Worker reads
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { syncPlatformSearchIndex } from "./lib/platform-index.mjs";
import { solutionFilterIndexKey, solutionFilterKey } from "./lib/solutions.mjs";
import { SUPPORTED_LOCALES } from "./lib/locales.mjs";
import { syncPartnersIndex } from "./lib/partners-index.mjs";
import { syncWhatsAppConfig } from "./sync-whatsapp-config.mjs";

const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const EMAIL = process.env.CF_AUTH_EMAIL;
const GLOBAL_KEY = process.env.CF_GLOBAL_API_KEY;
const NS_TITLE = "circuitbull-data";

function authHeaders(extra = {}) {
  // Account token can list Workers but KV write often needs Global API Key
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

async function getOrCreateNamespace() {
  const list = await cf(`/accounts/${ACCOUNT}/storage/kv/namespaces?per_page=100`);
  const found = list.find((n) => n.title === NS_TITLE);
  if (found) return found.id;
  const created = await cf(`/accounts/${ACCOUNT}/storage/kv/namespaces`, {
    method: "POST",
    body: JSON.stringify({ title: NS_TITLE }),
  });
  return created.id;
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

const org = await db.collection("organization").findOne({ _id: "org:volls-global" });
const partners = await db.collection("partners").find({}).toArray();
const investments = await db.collection("investments").find({}).toArray();
const needs = await db.collection("needs").find({}).toArray();
const products = await db.collection("products").find({}).toArray();
const categories = await db.collection("categories").find({}).toArray();
const applications = await db.collection("applications").find({}).toArray();
const counter = await db.collection("counters").findOne({ _id: "smartid" });
const poolAssigned = await db.collection("sku_pool").countDocuments({ status: "assigned" });
const poolAvailable = await db.collection("sku_pool").countDocuments({ status: "available" });
const recentPool = await db
  .collection("sku_pool")
  .find({ status: "assigned" })
  .sort({ assignedAt: -1 })
  .limit(40)
  .toArray();

const skuPool = {
  format: "Cb-{NNNNNN}",
  counter: counter?.seq ?? 0,
  counts: {
    assigned: poolAssigned,
    available: poolAvailable,
    products: products.filter((p) => p.smartId || p.sku).length,
  },
  recent: recentPool.map((r) => ({
    smartId: r.smartId || r.sku,
    sku: r.sku || r.smartId,
    status: r.status,
    productId: r.productId,
    productSlug: r.productSlug,
    model: r.model,
    name: r.name,
    assignedAt: r.assignedAt,
  })),
  syncedAt: new Date().toISOString(),
};

const nsId = await getOrCreateNamespace();
await putKey(nsId, "company", org);
await putKey(nsId, "investments", investments);
await putKey(nsId, "needs", needs);
await putKey(nsId, "products", products);
await putKey(nsId, "categories", categories);
await putKey(nsId, "applications", applications);
await putKey(nsId, "sku_pool", skuPool);
for (const n of needs) {
  await putKey(nsId, `need:${n.slug}`, n);
}
for (const p of products) {
  await putKey(nsId, `product:${p.slug}`, p);
}

// Ontology facet index for Products smart filter (English labels; Worker can recompute per lang)
{
  const groupMap = new Map();
  let factCount = 0;
  const ORDER = ["housing","ptz","enhancements","thermal","thermal_camera","sensor","lens","detection","power","environment","interface","laser","visible_camera"];
  for (const p of products) {
    for (const f of p.facts || []) {
      factCount += 1;
      const gKey = f.groupKey || "general";
      const block = f.i18n?.en || {};
      if (!groupMap.has(gKey)) {
        groupMap.set(gKey, { groupId: f.groupId, groupKey: gKey, label: block.groupLabel || gKey, count: 0, valueCounts: new Map(), props: new Map() });
      }
      const g = groupMap.get(gKey);
      g.count += 1;
      const val = String(block.value || f.value || "").trim();
      if (val && val.length <= 64) g.valueCounts.set(val, (g.valueCounts.get(val) || 0) + 1);
      const pKey = f.propertyKey || `${gKey}.value`;
      if (!g.props.has(pKey)) g.props.set(pKey, { propertyId: f.propertyId, propertyKey: pKey, label: block.label || pKey, count: 0, valueCounts: new Map() });
      const prop = g.props.get(pKey);
      prop.count += 1;
      if (val && val.length <= 64) prop.valueCounts.set(val, (prop.valueCounts.get(val) || 0) + 1);
    }
  }
  const toVals = (m) => [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([value,count])=>({value,count}));
  const orderIdx = (k) => { const i = ORDER.indexOf(k); return i >= 0 ? i : 999; };
  const facets = {
    lang: "en",
    factCount,
    groupCount: groupMap.size,
    builtAt: new Date().toISOString(),
    groups: [...groupMap.values()]
      .sort((a,b)=>orderIdx(a.groupKey)-orderIdx(b.groupKey)||b.count-a.count)
      .slice(0, 24)
      .map((g) => ({
        groupId: g.groupId,
        groupKey: g.groupKey,
        label: g.label,
        count: g.count,
        topValues: toVals(g.valueCounts),
        properties: [...g.props.values()].sort((a,b)=>b.count-a.count).slice(0,14).map((p)=>({
          propertyId: p.propertyId,
          propertyKey: p.propertyKey,
          label: p.label,
          count: p.count,
          values: toVals(p.valueCounts),
        })),
      })),
  };
  await putKey(nsId, "product.facets:en", facets);
}

let redisPartners = null;
try {
  redisPartners = await syncPartnersIndex({ partners, putKey, nsId });
} catch (e) {
  console.warn("redis partners sync skipped", e.message || e);
  await putKey(nsId, "partners", partners);
}

let redisCatalog = null;
try {
  redisCatalog = await syncPlatformSearchIndex({ products, putKey, nsId });
} catch (e) {
  console.warn("redis catalog sync skipped", e.message || e);
}

let whatsapp = null;
try {
  whatsapp = await syncWhatsAppConfig({ putKey, nsId });
} catch (e) {
  console.warn("whatsapp config sync skipped", e.message || e);
}

let redisFilters = 0;
if (process.env.REDIS_URL) {
  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (e) => console.warn("redis", e.message));
    await redis.connect();
    const indexByLang = {};
    for (const n of needs) {
      for (const lang of SUPPORTED_LOCALES) {
        const block = n.i18n?.[lang]?.filter || n.i18n?.en?.filter;
        if (!block?.title) continue;
        await redis.set(solutionFilterKey(n.slug, lang), JSON.stringify({ slug: n.slug, lang, ...block }));
        if (!indexByLang[lang]) indexByLang[lang] = {};
        indexByLang[lang][n.slug] = block;
        redisFilters += 1;
      }
    }
    for (const [lang, map] of Object.entries(indexByLang)) {
      await redis.set(solutionFilterIndexKey(lang), JSON.stringify({ lang, slugs: map, builtAt: new Date().toISOString() }));
    }
    await redis.quit();
  } catch (e) {
    console.warn("redis filter sync skipped", e.message || e);
  }
}

console.log(
  JSON.stringify(
    {
      kvNamespaceId: nsId,
      counts: {
        partners: partners.length,
        investments: investments.length,
        needs: needs.length,
        products: products.length,
        categories: categories.length,
        applications: applications.length,
        skuPoolAssigned: poolAssigned,
        smartIdCounter: counter?.seq ?? 0,
      },
      redisPartners,
      redisCatalog,
      redisFilters,
      whatsapp,
    },
    null,
    2
  )
);
await client.close();
