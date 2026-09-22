/**
 * Rewrite stored Mongo image/datasheet/brand URLs to https://cdn.circuitbull.com/...
 * (no re-upload — keys already live in R2 circuitbull-media)
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

const CDN_BASE = process.env.CDN_BASE || "https://cdn.circuitbull.com";
const SITE = process.env.SITE_URL || "https://circuitbull.com";

function toCdn(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith(`${CDN_BASE}/`)) return url;
  if (url.startsWith(`${SITE}/cdn/`)) return `${CDN_BASE}/${url.slice(`${SITE}/cdn/`.length)}`;
  if (url.startsWith("http://circuitbull.com/cdn/")) {
    return `${CDN_BASE}/${url.slice("http://circuitbull.com/cdn/".length)}`;
  }
  if (url.startsWith("/cdn/")) return `${CDN_BASE}/${url.slice(5)}`;
  return url;
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

const products = await db.collection("products").find({}).toArray();
let updated = 0;
for (const p of products) {
  const image = toCdn(p.image);
  const images = Array.isArray(p.images) ? p.images.map(toCdn) : p.images;
  const datasheetUrl = toCdn(p.datasheetUrl);
  const datasheetPdfs = Array.isArray(p.datasheetPdfs) ? p.datasheetPdfs.map(toCdn) : p.datasheetPdfs;
  const changed =
    image !== p.image ||
    JSON.stringify(images) !== JSON.stringify(p.images) ||
    datasheetUrl !== p.datasheetUrl ||
    JSON.stringify(datasheetPdfs) !== JSON.stringify(p.datasheetPdfs);
  if (!changed) continue;
  await db.collection("products").updateOne(
    { _id: p._id },
    {
      $set: {
        image,
        images,
        datasheetUrl,
        datasheetPdfs,
        updatedAt: new Date(),
      },
    }
  );
  updated++;
}

await db.collection("organization").updateOne(
  { _id: "org:volls-global" },
  {
    $set: {
      brandAssets: {
        favicon: `${CDN_BASE}/brand/favicon.ico`,
        logo: `${CDN_BASE}/brand/logo.svg`,
        logoIco: `${CDN_BASE}/brand/logo.ico`,
      },
    },
  }
);

const sample = await db.collection("products").findOne({ _id: "product:44162612" });
console.log(
  JSON.stringify(
    {
      productsSeen: products.length,
      productsUpdated: updated,
      sample: sample
        ? { _id: sample._id, slug: sample.slug, image: sample.image, datasheetUrl: sample.datasheetUrl }
        : null,
      brandAssets: {
        favicon: `${CDN_BASE}/brand/favicon.ico`,
        logo: `${CDN_BASE}/brand/logo.svg`,
      },
    },
    null,
    2
  )
);
await client.close();
