import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { createClient } from "redis";

const results = {};

async function checkMongo() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  await client.db(process.env.MONGODB_DB || "circuitbull").command({ ping: 1 });
  await client.close();
  results.mongodb = "ok";
}

async function checkNeo4j() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );
  await driver.verifyConnectivity();
  await driver.close();
  results.neo4j = "ok";
}

async function checkRedis() {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (e) => console.error("redis error", e.message));
  await client.connect();
  const pong = await client.ping();
  await client.quit();
  results.redis = pong;
}

async function checkQdrant() {
  const res = await fetch(`${process.env.QDRANT_URL}/collections`, {
    headers: { "api-key": process.env.QDRANT_API_KEY },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  results.qdrant = "ok";
  results.qdrantCollections = json.result?.collections?.length ?? 0;
}

async function checkCloudflare() {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}`,
    { headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}` } }
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  results.cloudflare = json.result.name;
  results.zoneStatus = json.result.status;
}

try {
  await Promise.all([checkMongo(), checkNeo4j(), checkRedis(), checkQdrant(), checkCloudflare()]);
  console.log(JSON.stringify(results, null, 2));
} catch (e) {
  console.error("VERIFY_FAILED", e.message || e);
  console.log("partial:", JSON.stringify(results, null, 2));
  process.exit(1);
}
