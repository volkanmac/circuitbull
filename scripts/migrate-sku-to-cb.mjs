/**
 * Migrate all SMARTID-* SKUs → Cb-{NNNNNN}.
 * Preserves sequence digits; keeps slug/_id stable for CDN.
 *
 * Updates: Mongo products + sku_pool, Neo4j Product nodes (if configured).
 * Then run: npm run sync-kv && npm run sync-neo4j-products
 *
 *   node scripts/migrate-sku-to-cb.mjs
 *   node scripts/migrate-sku-to-cb.mjs --dry-run
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { ensureIndexes, toCbSku } from "./lib/smartid.mjs";

const DRY = process.argv.includes("--dry-run");

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
await ensureIndexes(db);

const products = await db.collection("products").find({}).toArray();
const mapping = [];
let updated = 0;
let already = 0;
let skipped = 0;

for (const p of products) {
  const before = p.smartId || p.sku || null;
  const after = toCbSku(before);
  if (!after) {
    skipped++;
    continue;
  }
  if (before === after && p.sku === after) {
    already++;
    continue;
  }
  mapping.push({
    _id: p._id,
    slug: p.slug,
    model: p.model,
    before,
    after,
  });
  if (!DRY) {
    await db.collection("products").updateOne(
      { _id: p._id },
      {
        $set: {
          smartId: after,
          sku: after,
          smartIdPrevious: before && before !== after ? before : p.smartIdPrevious || null,
          skuPrevious: before && before !== after ? before : p.skuPrevious || null,
          skuFormat: "Cb-{NNNNNN}",
          skuMigratedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    // Rewrite sku_pool entry
    if (before && before !== after) {
      const oldPool = await db.collection("sku_pool").findOne({ _id: before });
      await db.collection("sku_pool").updateOne(
        { _id: after },
        {
          $set: {
            smartId: after,
            sku: after,
            seq: oldPool?.seq || Number(after.slice(-6)),
            status: "assigned",
            productId: p._id,
            productSlug: p.slug || null,
            model: p.model || null,
            name: p.name || null,
            previousId: before,
            assignedAt: oldPool?.assignedAt || p.smartIdAssignedAt || new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      await db.collection("sku_pool").updateOne(
        { _id: before },
        { $set: { status: "migrated", migratedTo: after, updatedAt: new Date() } }
      );
    }
  }
  updated++;
  console.log(DRY ? "would" : "migrated", before, "→", after, p.slug || p._id);
}

let neo4jUpdated = 0;
if (!DRY && process.env.NEO4J_URI && mapping.length) {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );
  const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    for (const m of mapping) {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MERGE (p:Product {id: $id})
          SET p.smartId = $sku,
              p.sku = $sku,
              p.smartIdPrevious = $previous,
              p.slug = coalesce($slug, p.slug),
              p.model = coalesce($model, p.model)
          WITH p
          OPTIONAL MATCH (p)-[r:HAS_FACT]->(f:Fact)
          SET f.smartId = $sku
          `,
          {
            id: m._id,
            sku: m.after,
            previous: m.before,
            slug: m.slug || null,
            model: m.model || null,
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
      dryRun: DRY,
      total: products.length,
      updated,
      alreadyCb: already,
      skipped,
      neo4jUpdated,
      examples: mapping.slice(0, 8),
      scheme: "Cb-{NNNNNN} from SMARTID-{YYMM}-{NNNNNN} sequence",
    },
    null,
    2
  )
);

await client.close();
