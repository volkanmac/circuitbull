/**
 * MERGE Product nodes + HAS_LOCALE → LocaleContent from Mongo products → Neo4j
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");
const products = await db.collection("products").find({}).toArray();
console.log("mongo products", products.length);

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });

let merged = 0;
let locales = 0;
try {
  await session.executeWrite(async (tx) => {
    await tx.run(`
      MERGE (o:Organization {id: 'org:volls-global'})
      SET o.brand = coalesce(o.brand, 'Circuitbull')
    `);

    for (const p of products) {
      await tx.run(
        `
        MERGE (prod:Product {id: $id})
        SET prod.slug = $slug,
            prod.name = $name,
            prod.model = $model,
            prod.smartId = $smartId,
            prod.summary = $summary,
            prod.image = $image,
            prod.datasheetUrl = $datasheetUrl,
            prod.source = $source,
            prod.sourceId = $sourceId,
            prod.url = $url,
            prod.cleaned = $cleaned,
            prod.updatedAt = datetime()
        WITH prod
        MATCH (o:Organization {id: 'org:volls-global'})
        MERGE (o)-[:CATALOGS]->(prod)
        `,
        {
          id: String(p._id),
          slug: p.slug || null,
          name: p.name || null,
          model: p.model || null,
          smartId: p.smartId || p.sku || null,
          summary: (p.summary || "").slice(0, 500),
          image: p.image || null,
          datasheetUrl: p.datasheetUrl || null,
          source: p.source || null,
          sourceId: p.sourceId || null,
          url: p.url || null,
          cleaned: Boolean(p.datasheetStatus?.cleaned),
        }
      );

      for (const need of p.needSlugs || []) {
        await tx.run(
          `
          MERGE (n:Need {slug: $need})
          MERGE (prod:Product {id: $id})
          MERGE (prod)-[:SERVES_NEED]->(n)
          MERGE (s:Solution {slug: $need})
          MERGE (n)-[:SATISFIED_BY]->(s)
          MERGE (prod)-[:USED_IN]->(s)
          `,
          { id: String(p._id), need }
        );
      }

      const i18n = p.i18n || {};
      for (const [lang, block] of Object.entries(i18n)) {
        if (!block || typeof block !== "object") continue;
        const localeId = `${p._id}:locale:${lang}`;
        await tx.run(
          `
          MERGE (prod:Product {id: $pid})
          MERGE (lc:LocaleContent {id: $lid})
          SET lc.lang = $lang,
              lc.name = $name,
              lc.summary = $summary,
              lc.description = $description,
              lc.benefits = $benefits,
              lc.overview = $overview,
              lc.applications = $applications,
              lc.translated = $translated,
              lc.updatedAt = datetime()
          MERGE (prod)-[r:HAS_LOCALE {lang: $lang}]->(lc)
          SET r.translated = $translated
          `,
          {
            pid: String(p._id),
            lid: localeId,
            lang,
            name: block.name || null,
            summary: (block.summary || "").slice(0, 500),
            description: (block.description || "").slice(0, 2000),
            benefits: Array.isArray(block.benefits) ? block.benefits.slice(0, 30) : [],
            overview: Array.isArray(block.overview) ? block.overview.slice(0, 30) : [],
            applications: Array.isArray(block.applications) ? block.applications.slice(0, 30) : [],
            translated: Boolean(block.translated),
          }
        );
        locales++;
      }

      merged++;
    }
  });

  const count = await session.run("MATCH (p:Product) RETURN count(p) AS c");
  const locCount = await session.run("MATCH (l:LocaleContent) RETURN count(l) AS c");
  console.log(
    JSON.stringify(
      {
        merged,
        localeRelsWritten: locales,
        productNodes: count.records[0].get("c").toNumber(),
        localeContentNodes: locCount.records[0].get("c").toNumber(),
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
