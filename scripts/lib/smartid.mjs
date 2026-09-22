/**
 * Circuitbull SKU allocator (shared pool).
 *
 * Format: Cb-{NNNNNN}
 *   - NNNNNN = zero-padded global sequence from counters._id = "smartid"
 *     (counter id kept for continuity; public SKUs are Cb-*)
 *
 * Legacy format SMARTID-{YYMM}-{NNNNNN} is migrated via scripts/migrate-sku-to-cb.mjs
 * Example: Cb-000042
 *
 * Storage:
 *   - counters     { _id: "smartid", seq: N }
 *   - sku_pool     { _id, smartId/sku, status: "assigned"|"available", productId?, … }
 *   - products     { smartId, sku }  (both hold Cb-* after migration)
 */

export const SKU_PREFIX = "Cb";
export const SMARTID_PREFIX = "Cb"; // alias — do not allocate SMARTID-* anymore
export const COUNTER_ID = "smartid";

export function formatCbSku(seq) {
  const n = String(seq).padStart(6, "0");
  return `${SKU_PREFIX}-${n}`;
}

/** @deprecated use formatCbSku */
export function formatSmartId(seq, _at = new Date()) {
  return formatCbSku(seq);
}

/**
 * Map legacy SMARTID-YYMM-NNNNNN → Cb-NNNNNN (same sequence).
 * Already-Cb values pass through.
 */
export function toCbSku(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (/^Cb-\d{6}$/i.test(s)) {
    const m = s.match(/(\d{6})$/);
    return `Cb-${m[1]}`;
  }
  const legacy = s.match(/^SMARTID-\d{4}-(\d{6})$/i);
  if (legacy) return `Cb-${legacy[1]}`;
  const digits = s.match(/(\d{6})$/);
  if (digits) return `Cb-${digits[1]}`;
  return null;
}

/**
 * Atomically allocate the next Cb SKU and record it in sku_pool as assigned.
 * @param {import('mongodb').Db} db
 * @param {{ productId: string, productSlug?: string, model?: string|null, name?: string|null }} meta
 */
export async function allocateSmartId(db, meta) {
  const now = new Date();
  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = counter.seq;
  const smartId = formatCbSku(seq);

  const poolDoc = {
    _id: smartId,
    smartId,
    sku: smartId,
    seq,
    status: "assigned",
    productId: meta.productId,
    productSlug: meta.productSlug || null,
    model: meta.model || null,
    name: meta.name || null,
    assignedAt: now,
    updatedAt: now,
  };
  await db.collection("sku_pool").updateOne({ _id: smartId }, { $set: poolDoc }, { upsert: true });

  return { smartId, sku: smartId, seq, assignedAt: now };
}

/**
 * Ensure a product document has smartId + sku (Cb-*). Allocates if missing.
 */
export async function ensureProductSmartId(db, product) {
  const existing = toCbSku(product?.smartId) || toCbSku(product?.sku);
  if (existing) {
    return {
      smartId: existing,
      sku: existing,
      allocated: false,
      needsRewrite: existing !== product?.smartId || existing !== product?.sku,
    };
  }
  const { smartId, seq, assignedAt } = await allocateSmartId(db, {
    productId: product._id,
    productSlug: product.slug,
    model: product.model,
    name: product.name,
  });
  return { smartId, sku: smartId, seq, assignedAt, allocated: true, needsRewrite: true };
}

export async function ensureIndexes(db) {
  await db.collection("products").createIndex({ smartId: 1 }, { unique: true, sparse: true });
  await db.collection("products").createIndex({ sku: 1 }, { sparse: true });
  await db.collection("sku_pool").createIndex({ status: 1, assignedAt: -1 });
  await db.collection("sku_pool").createIndex({ productId: 1 }, { sparse: true });
}
