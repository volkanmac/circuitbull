/**
 * Backfill SMARTID SKUs for all products missing smartId, then print summary.
 * Optionally sync Neo4j Product.smartId when NEO4J_* env is set.
 * Run: node scripts/assign-smartids.mjs
 * Then: npm run sync-kv
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { ensureIndexes, ensureProductSmartId } from "./lib/smartid.mjs";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

await ensureIndexes(db);

const missing = await db
  .collection("products")
  .find({ $or: [{ smartId: { $exists: false } }, { smartId: null }, { smartId: "" }] })
  .sort({ _id: 1 })
  .toArray();

const assigned = [];
for (const p of missing) {
  const result = await ensureProductSmartId(db, p);
  if (result.allocated) {
    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          smartId: result.smartId,
          sku: result.sku,
          smartIdAssignedAt: result.assignedAt,
          updatedAt: new Date(),
        },
      }
    );
    assigned.push({ _id: p._id, slug: p.slug, model: p.model, smartId: result.smartId });
    console.log("assigned", result.smartId, "→", p.slug || p._id);
  }
}

const counter = await db.collection("counters").findOne({ _id: "smartid" });
const poolAssigned = await db.collection("sku_pool").countDocuments({ status: "assigned" });
const poolAvailable = await db.collection("sku_pool").countDocuments({ status: "available" });
const withSmartId = await db.collection("products").countDocuments({ smartId: { $exists: true, $ne: null } });
const examples = await db
  .collection("products")
  .find({ smartId: { $exists: true } })
  .project({ smartId: 1, slug: 1, model: 1, name: 1 })
  .sort({ smartId: 1 })
  .limit(5)
  .toArray();

// Optional Neo4j property sync
let neo4jUpdated = 0;
if (process.env.NEO4J_URI && assigned.length) {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );
  const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    for (const a of assigned) {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MERGE (p:Product {id: $id})
          SET p.smartId = $smartId,
              p.sku = $smartId,
              p.slug = coalesce($slug, p.slug),
              p.model = coalesce($model, p.model),
              p.name = coalesce($name, p.name)
          `,
          {
            id: a._id,
            smartId: a.smartId,
            slug: a.slug || null,
            model: a.model || null,
            name: a.name || null,
          }
        );
      });
      neo4jUpdated++;
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

console.log(
  JSON.stringify(
    {
      backfilled: assigned.length,
      productsWithSmartId: withSmartId,
      counterSeq: counter?.seq ?? 0,
      skuPool: { assigned: poolAssigned, available: poolAvailable },
      examples: examples.map((e) => ({ smartId: e.smartId, slug: e.slug, model: e.model })),
      neo4jUpdated,
    },
    null,
    2
  )
);

await client.close();
