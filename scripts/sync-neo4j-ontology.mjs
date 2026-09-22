/**
 * Upsert SpecGroup / SpecProperty / SpecValue / LocaleString + product fact edges from Mongo → Neo4j
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({ "facts.0": { $exists: true } }).toArray();
console.log("products with facts", products.length);

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });

let factEdges = 0;
let groups = 0;
let props = 0;
let values = 0;
let labels = 0;

try {
  await session.executeWrite(async (tx) => {
    await tx.run(`
      CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE
    `).catch(() => {});
    await tx.run(`
      CREATE CONSTRAINT specgroup_id IF NOT EXISTS FOR (g:SpecGroup) REQUIRE g.id IS UNIQUE
    `).catch(() => {});
    await tx.run(`
      CREATE CONSTRAINT specprop_id IF NOT EXISTS FOR (p:SpecProperty) REQUIRE p.id IS UNIQUE
    `).catch(() => {});
    await tx.run(`
      CREATE CONSTRAINT specval_id IF NOT EXISTS FOR (v:SpecValue) REQUIRE v.id IS UNIQUE
    `).catch(() => {});

    for (const p of products) {
      const pid = String(p._id);
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

      for (const f of p.facts || []) {
        await tx.run(
          `
          MERGE (g:SpecGroup {id: $groupId})
          SET g.key = $groupKey
          MERGE (prop:SpecProperty {id: $propertyId})
          SET prop.key = $propertyKey, prop.groupKey = $groupKey
          MERGE (val:SpecValue {id: $valueId})
          SET val.valueCanonical = $value
          WITH g, prop, val
          MATCH (prod:Product {id: $pid})
          MERGE (prod)-[:HAS_GROUP]->(g)
          MERGE (g)-[:HAS_PROPERTY]->(prop)
          MERGE (prop)-[:HAS_VALUE]->(val)
          MERGE (prod)-[r:HAS_FACT {propertyId: $propertyId}]->(val)
          SET r.factId = $factId, r.groupId = $groupId, r.value = $value
          `,
          {
            pid,
            groupId: f.groupId,
            groupKey: f.groupKey,
            propertyId: f.propertyId,
            propertyKey: f.propertyKey,
            valueId: f.valueId,
            value: f.value,
            factId: f.id,
          }
        );
        factEdges++;
        groups++;
        props++;
        values++;

        for (const [lang, block] of Object.entries(f.i18n || {})) {
          if (!block) continue;
          const labelId = `LS-${f.propertyId}-${lang}`;
          const valueLabelId = `LS-${f.valueId}-${lang}-${f.id}`;
          await tx.run(
            `
            MERGE (ls:LocaleString {id: $labelId})
            SET ls.lang = $lang, ls.text = $label, ls.kind = 'property_label', ls.translated = $translated
            WITH ls
            MATCH (prop:SpecProperty {id: $propertyId})
            MERGE (prop)-[r:LABEL {lang: $lang}]->(ls)
            SET r.translated = $translated
            `,
            {
              labelId,
              lang,
              label: block.label || f.propertyKey,
              translated: Boolean(block.translated),
              propertyId: f.propertyId,
            }
          );
          await tx.run(
            `
            MERGE (ls:LocaleString {id: $valueLabelId})
            SET ls.lang = $lang, ls.text = $value, ls.kind = 'value_label', ls.translated = $translated
            WITH ls
            MATCH (val:SpecValue {id: $valueId})
            MERGE (val)-[r:LABEL {lang: $lang}]->(ls)
            SET r.translated = $translated, r.factId = $factId
            `,
            {
              valueLabelId,
              lang,
              value: block.value || f.value,
              translated: Boolean(block.translated),
              valueId: f.valueId,
              factId: f.id,
            }
          );
          if (block.groupLabel) {
            const gLabelId = `LS-${f.groupId}-${lang}`;
            await tx.run(
              `
              MERGE (ls:LocaleString {id: $gLabelId})
              SET ls.lang = $lang, ls.text = $text, ls.kind = 'group_label', ls.translated = $translated
              WITH ls
              MATCH (g:SpecGroup {id: $groupId})
              MERGE (g)-[r:LABEL {lang: $lang}]->(ls)
              SET r.translated = $translated
              `,
              {
                gLabelId,
                lang,
                text: block.groupLabel,
                translated: Boolean(block.translated),
                groupId: f.groupId,
              }
            );
          }
          labels += 2;
        }
      }
    }
  });

  const counts = await session.run(`
    MATCH (g:SpecGroup) WITH count(g) AS groups
    MATCH (p:SpecProperty) WITH groups, count(p) AS props
    MATCH (v:SpecValue) WITH groups, props, count(v) AS vals
    MATCH (l:LocaleString) WITH groups, props, vals, count(l) AS locales
    MATCH ()-[r:HAS_FACT]->() WITH groups, props, vals, locales, count(r) AS facts
    RETURN groups, props, vals, locales, facts
  `);
  const rec = counts.records[0];
  console.log(
    JSON.stringify(
      {
        products: products.length,
        written: { factEdges, labelWrites: labels },
        neo4j: {
          SpecGroup: rec.get("groups").toNumber(),
          SpecProperty: rec.get("props").toNumber(),
          SpecValue: rec.get("vals").toNumber(),
          LocaleString: rec.get("locales").toNumber(),
          HAS_FACT: rec.get("facts").toNumber(),
        },
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
