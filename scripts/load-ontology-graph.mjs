/**
 * PRIORITY: Parse all Mongo products → facts, then MERGE full ontology graph in Neo4j.
 * Schema (Browser-visible):
 *   (:Product)-[:HAS_GROUP]->(:SpecGroup)-[:HAS_PROPERTY]->(:SpecProperty)
 *   (:Product)-[:HAS_FACT]->(:Fact)-[:OF_PROPERTY]->(:SpecProperty)
 *   (:Fact)-[:HAS_VALUE]->(:SpecValue)
 *   (:Product)-[:SERVES_NEED]->(:Need)
 *
 * Usage: node scripts/load-ontology-graph.mjs [--force]
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { extractFactsDeterministic } from "./lib/parse-facts-deterministic.mjs";

const FORCE = process.argv.includes("--force");

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({}).toArray();
console.log("mongo products", products.length);

let parsed = 0;
for (const p of products) {
  if (Array.isArray(p.facts) && p.facts.length && !FORCE) {
    continue;
  }
  const facts = extractFactsDeterministic(p);
  if (!facts.length) {
    // still create a minimal "general" fact from name/model so node isn't empty
    const fallback = extractFactsDeterministic({
      ...p,
      specs: {
        ...(p.specs || {}),
        Model: p.model || p.name || "unknown",
      },
    });
    p.facts = fallback;
  } else {
    p.facts = facts;
  }
  await db.collection("products").updateOne(
    { _id: p._id },
    {
      $set: {
        facts: p.facts,
        "datasheet.groups": [...new Set(p.facts.map((f) => f.groupKey))],
        "datasheetStatus.factsParsed": true,
        "datasheetStatus.factsParsedAt": new Date().toISOString(),
        "datasheetStatus.factsModel": "deterministic-v1",
        updatedAt: new Date(),
      },
    }
  );
  parsed++;
  console.log("facts", p.smartId || p.slug, p.facts.length, [...new Set(p.facts.map((f) => f.groupKey))].join(","));
}

// Reload with facts
const withFacts = await db.collection("products").find({ "facts.0": { $exists: true } }).toArray();
console.log("products with facts", withFacts.length);

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });

let writtenFacts = 0;
try {
  // Constraints (ignore if unsupported)
  for (const cy of [
    "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT fact_id IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE",
    "CREATE CONSTRAINT specgroup_id IF NOT EXISTS FOR (g:SpecGroup) REQUIRE g.id IS UNIQUE",
    "CREATE CONSTRAINT specprop_id IF NOT EXISTS FOR (p:SpecProperty) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT specval_id IF NOT EXISTS FOR (v:SpecValue) REQUIRE v.id IS UNIQUE",
  ]) {
    try {
      await session.run(cy);
    } catch {
      /* ignore */
    }
  }

  for (const p of withFacts) {
    const pid = String(p._id);
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        MERGE (prod:Product {id: $id})
        SET prod.slug = $slug,
            prod.smartId = $smartId,
            prod.name = $name,
            prod.model = $model,
            prod.updatedAt = datetime()
        `,
        {
          id: pid,
          slug: p.slug || null,
          smartId: p.smartId || p.sku || null,
          name: p.name || null,
          model: p.model || null,
        }
      );

      for (const need of p.needSlugs || []) {
        await tx.run(
          `
          MERGE (n:Need {slug: $need})
          WITH n
          MATCH (prod:Product {id: $id})
          MERGE (prod)-[:SERVES_NEED]->(n)
          `,
          { id: pid, need }
        );
      }

      for (const f of p.facts || []) {
        await tx.run(
          `
          MATCH (prod:Product {id: $pid})
          MERGE (g:SpecGroup {id: $groupId})
            SET g.key = $groupKey
          MERGE (prop:SpecProperty {id: $propertyId})
            SET prop.key = $propertyKey, prop.groupKey = $groupKey
          MERGE (val:SpecValue {id: $valueId})
            SET val.valueCanonical = $value
          MERGE (fact:Fact {id: $factId})
            SET fact.propertyId = $propertyId,
                fact.groupId = $groupId,
                fact.value = $value,
                fact.productId = $pid,
                fact.smartId = $smartId
          MERGE (prod)-[:HAS_GROUP]->(g)
          MERGE (g)-[:HAS_PROPERTY]->(prop)
          MERGE (prod)-[:HAS_FACT]->(fact)
          MERGE (fact)-[:OF_PROPERTY]->(prop)
          MERGE (fact)-[:HAS_VALUE]->(val)
          `,
          {
            pid,
            smartId: p.smartId || null,
            groupId: f.groupId,
            groupKey: f.groupKey,
            propertyId: f.propertyId,
            propertyKey: f.propertyKey,
            valueId: f.valueId,
            value: f.value,
            factId: f.id,
          }
        );
        writtenFacts++;
      }
    });
    console.log("neo4j", p.smartId || p.slug, "facts", (p.facts || []).length);
  }

  const counts = await session.run(`
    MATCH (p:Product) WITH count(p) AS Product
    OPTIONAL MATCH (f:Fact) WITH Product, count(f) AS Fact
    OPTIONAL MATCH (g:SpecGroup) WITH Product, Fact, count(g) AS SpecGroup
    OPTIONAL MATCH (sp:SpecProperty) WITH Product, Fact, SpecGroup, count(sp) AS SpecProperty
    OPTIONAL MATCH (v:SpecValue) WITH Product, Fact, SpecGroup, SpecProperty, count(v) AS SpecValue
    OPTIONAL MATCH ()-[r1:HAS_FACT]->() WITH Product, Fact, SpecGroup, SpecProperty, SpecValue, count(r1) AS HAS_FACT
    OPTIONAL MATCH ()-[r2:HAS_GROUP]->() WITH Product, Fact, SpecGroup, SpecProperty, SpecValue, HAS_FACT, count(r2) AS HAS_GROUP
    OPTIONAL MATCH ()-[r3:OF_PROPERTY]->() WITH Product, Fact, SpecGroup, SpecProperty, SpecValue, HAS_FACT, HAS_GROUP, count(r3) AS OF_PROPERTY
    OPTIONAL MATCH ()-[r4:HAS_VALUE]->() WITH Product, Fact, SpecGroup, SpecProperty, SpecValue, HAS_FACT, HAS_GROUP, OF_PROPERTY, count(r4) AS HAS_VALUE
    OPTIONAL MATCH ()-[r5:HAS_PROPERTY]->()
    RETURN Product, Fact, SpecGroup, SpecProperty, SpecValue, HAS_FACT, HAS_GROUP, OF_PROPERTY, HAS_VALUE, count(r5) AS HAS_PROPERTY
  `);
  const rec = counts.records[0];
  const out = {};
  for (const k of rec.keys) {
    const v = rec.get(k);
    out[k] = typeof v?.toNumber === "function" ? v.toNumber() : v;
  }

  const sample = withFacts.find((p) => p.smartId) || withFacts[0];
  console.log(
    JSON.stringify(
      {
        mongoParsedNow: parsed,
        after: out,
        sample: {
          smartId: sample?.smartId,
          slug: sample?.slug,
          factCount: sample?.facts?.length || 0,
          groups: [...new Set((sample?.facts || []).map((f) => f.groupKey))],
          exampleFacts: (sample?.facts || []).slice(0, 5).map((f) => ({
            id: f.id,
            propertyKey: f.propertyKey,
            value: f.value,
          })),
        },
        browserCypher: sample?.smartId
          ? `MATCH (p:Product {smartId:'${sample.smartId}'})-[r*1..3]-(n) RETURN p,r,n LIMIT 100`
          : null,
        writtenFacts,
      },
      null,
      2
    )
  );
} finally {
  await session.close();
  await driver.close();
  await client.close();
}
