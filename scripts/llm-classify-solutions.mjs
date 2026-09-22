/**
 * Map product Applications → canonical mission solutions.
 * Deterministic alias map + local Ollama (gemma2:27b) per product.
 * Writes needSlugs on products, upserts needs, links Neo4j.
 *
 *   node scripts/llm-classify-solutions.mjs
 *   node scripts/llm-classify-solutions.mjs --limit=5
 *   node scripts/llm-classify-solutions.mjs --skip-llm
 *   node scripts/llm-classify-solutions.mjs --model=mistral-nemo:latest
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { getOllamaConfig, ollamaJson } from "./lib/ollama.mjs";
import {
  SOLUTION_SLUGS,
  SOLUTIONS,
  canonicalizeSlug,
  isCanonicalSlug,
  needDocument,
  productApplicationList,
  slugsFromApplications,
  slugsFromText,
} from "./lib/solutions.mjs";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const SKIP_LLM = args.includes("--skip-llm");
const SKIP_GRAPH = args.includes("--skip-graph");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || 0;
const MODEL = (args.find((a) => a.startsWith("--model=")) || "").split("=")[1] || getOllamaConfig().model;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function unique(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function productBlob(p) {
  const apps = productApplicationList(p);
  const name = p.i18n?.en?.name || p.name || "";
  const summary = p.i18n?.en?.summary || p.summary || "";
  return {
    slug: p.slug,
    name,
    model: p.model || "",
    summary: String(summary).slice(0, 400),
    applications: apps.slice(0, 16),
    hintSlugs: unique([...slugsFromApplications(apps), ...slugsFromText(`${name} ${summary}`)]),
  };
}

async function classifyOne(row) {
  const { json } = await ollamaJson(
    [
      {
        role: "system",
        content:
          "You assign military-grade sensors to mission solutions. Output only JSON. Use only allowed slugs. Pick 2 to 6 most relevant missions. Do not invent slugs.",
      },
      {
        role: "user",
        content: `Allowed slugs:
${SOLUTION_SLUGS.map((s) => `- ${s}: ${SOLUTIONS[s].i18n.en.title}`).join("\n")}

Product:
${JSON.stringify(row, null, 2)}

Hint slugs from the application list (you may add or drop): ${row.hintSlugs.join(", ") || "none"}

Return: {"slug":"${row.slug}","slugs":["border-control"],"reason":"short"}`,
      },
    ],
    { model: MODEL, temperature: 0.1, timeoutMs: 240000 }
  );

  const raw = Array.isArray(json?.slugs) ? json.slugs : [];
  const slugs = unique(raw.map((s) => canonicalizeSlug(s) || (isCanonicalSlug(s) ? s : "")).filter(isCanonicalSlug));
  return { slugs, reason: String(json?.reason || "").slice(0, 180), model: MODEL };
}

async function linkNeo4j(products) {
  if (!process.env.NEO4J_URI) {
    console.warn("NEO4J_URI missing — skip graph");
    return { linked: 0 };
  }
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );
  const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  let linked = 0;
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(`CREATE CONSTRAINT need_slug IF NOT EXISTS FOR (n:Need) REQUIRE n.slug IS UNIQUE`).catch(() => {});
    });
    await session.executeWrite(async (tx) => {
      await tx.run(`CREATE CONSTRAINT solution_slug IF NOT EXISTS FOR (s:Solution) REQUIRE s.slug IS UNIQUE`).catch(() => {});
    });
    await session.executeWrite(async (tx) => {
      for (const slug of SOLUTION_SLUGS) {
        const def = SOLUTIONS[slug];
        await tx.run(
          `
          MERGE (n:Need {slug: $slug})
          SET n.title = $title, n.problem = $problem, n.code = $code, n.updatedAt = datetime()
          MERGE (s:Solution {slug: $slug})
          SET s.title = $title, s.code = $code
          MERGE (n)-[:SATISFIED_BY]->(s)
          `,
          {
            slug,
            title: def.i18n.en.title,
            problem: def.i18n.en.problem,
            code: def.code,
          }
        );
      }

      for (const p of products) {
        const pid = String(p._id);
        await tx.run(
          `
          MATCH (prod:Product {id: $id})
          OPTIONAL MATCH (prod)-[r:SERVES_NEED]->()
          DELETE r
          WITH prod
          OPTIONAL MATCH (prod)-[u:USED_IN]->()
          DELETE u
          `,
          { id: pid }
        ).catch(() => {});

        await tx.run(
          `
          MERGE (prod:Product {id: $id})
          SET prod.slug = $slug, prod.name = $name, prod.model = $model, prod.updatedAt = datetime()
          `,
          { id: pid, slug: p.slug || null, name: p.name || null, model: p.model || null }
        );

        for (const need of p.needSlugs || []) {
          if (!isCanonicalSlug(need)) continue;
          await tx.run(
            `
            MATCH (prod:Product {id: $id})
            MERGE (n:Need {slug: $need})
            MERGE (s:Solution {slug: $need})
            MERGE (prod)-[:SERVES_NEED]->(n)
            MERGE (prod)-[:USED_IN]->(s)
            `,
            { id: pid, need }
          );
          linked += 1;
        }
      }
    });
  } finally {
    await session.close();
    await driver.close();
  }
  return { linked };
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const existingNeeds = await db.collection("needs").find({}).toArray();
const mediaBySlug = new Map(existingNeeds.map((n) => [n.slug, n.media || n.cdn || null]));

for (const slug of SOLUTION_SLUGS) {
  const extra = {};
  if (mediaBySlug.get(slug)) extra.media = mediaBySlug.get(slug);
  if (slug === "border-control" && mediaBySlug.get("border-control")) {
    extra.media = mediaBySlug.get("border-control");
  }
  await db.collection("needs").updateOne({ slug }, { $set: needDocument(slug, extra) }, { upsert: true });
  await db.collection("applications").updateOne(
    { _id: `application:${slug}` },
    {
      $set: {
        _id: `application:${slug}`,
        type: "application",
        slug,
        i18n: SOLUTIONS[slug].i18n,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

await db.collection("needs").deleteMany({
  slug: { $nin: [...SOLUTION_SLUGS, "solar-fleet-ops"] },
  catalog: { $ne: false },
});

const cursor = db.collection("products").find({}).sort({ slug: 1 });
const products = await cursor.toArray();
const work = LIMIT ? products.slice(0, LIMIT) : products;

console.log(`classify ${work.length}/${products.length} products  model=${SKIP_LLM ? "deterministic" : MODEL}`);

let updated = 0;
let llmOk = 0;
let llmFail = 0;
const dist = {};

for (const p of work) {
  if (!FORCE && Array.isArray(p.needSlugs) && p.needSlugs.length > 1 && p.solutionClassifiedAt && !LIMIT) {
    for (const s of p.needSlugs) dist[s] = (dist[s] || 0) + 1;
    continue;
  }

  const row = productBlob(p);
  let slugs = row.hintSlugs.filter(isCanonicalSlug);
  let reason = "deterministic";
  let model = "rules";

  if (!SKIP_LLM) {
    try {
      const llm = await classifyOne(row);
      if (llm.slugs.length) {
        slugs = unique([...llm.slugs, ...slugs]).slice(0, 8);
        reason = llm.reason || "ollama";
        model = llm.model;
        llmOk += 1;
      }
    } catch (e) {
      llmFail += 1;
      console.warn("llm fail", p.slug, e.message || e);
    }
    await sleep(200);
  }

  if (!slugs.length) slugs = ["city-safety"];

  await db.collection("products").updateOne(
    { _id: p._id },
    {
      $set: {
        needSlugs: slugs,
        solutionClassifiedAt: new Date(),
        solutionClassifiedBy: model,
        solutionClassifiedReason: reason,
        updatedAt: new Date(),
      },
    }
  );
  p.needSlugs = slugs;
  updated += 1;
  for (const s of slugs) dist[s] = (dist[s] || 0) + 1;
  console.log(`${p.slug} → ${slugs.join(", ")}`);
}

const all = await db.collection("products").find({}).toArray();
let graph = { linked: 0 };
if (!SKIP_GRAPH) {
  graph = await linkNeo4j(all);
}

console.log(
  JSON.stringify(
    {
      updated,
      llmOk,
      llmFail,
      model: SKIP_LLM ? "rules" : MODEL,
      dist,
      graph,
      needs: SOLUTION_SLUGS.length,
    },
    null,
    2
  )
);

await client.close();
