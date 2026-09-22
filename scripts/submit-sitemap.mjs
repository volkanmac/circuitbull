/**
 * Ping Google/Bing and submit IndexNow URLs for circuitbull.com sitemaps.
 *   node scripts/submit-sitemap.mjs
 */
import "dotenv/config";

const HOST = "circuitbull.com";
const ORIGIN = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY || "cbidx7f3e91a2d64c8b9e1f0a4d6c8b2e19";
const KEY_LOC = `${ORIGIN}/${KEY}.txt`;
const SITEMAPS = [
  `${ORIGIN}/sitemap.xml`,
  `${ORIGIN}/sitemap-pages.xml`,
  `${ORIGIN}/sitemap-products.xml`,
  `${ORIGIN}/sitemap-solutions.xml`,
];

async function ping(name, url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    console.log(name, res.status, url);
    return res.status;
  } catch (e) {
    console.warn(name, "fail", e.message);
    return 0;
  }
}

async function collectLocs() {
  const locs = new Set([`${ORIGIN}/`, `${ORIGIN}/products`, `${ORIGIN}/solutions`, `${ORIGIN}/llms.txt`]);
  for (const sm of SITEMAPS) {
    try {
      const xml = await (await fetch(sm)).text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) locs.add(m[1].trim());
    } catch (e) {
      console.warn("sitemap fetch", sm, e.message);
    }
  }
  return [...locs];
}

const urls = await collectLocs();
console.log("urls", urls.length);

await ping("google", `https://www.google.com/ping?sitemap=${encodeURIComponent(`${ORIGIN}/sitemap.xml`)}`);
await ping("bing", `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${ORIGIN}/sitemap.xml`)}`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOC,
  urlList: urls.slice(0, 10000),
};

for (const endpoint of ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"]) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("indexnow", endpoint, res.status, text.slice(0, 200));
  } catch (e) {
    console.warn("indexnow", endpoint, e.message);
  }
}

console.log(JSON.stringify({ sitemaps: SITEMAPS, keyLocation: KEY_LOC, submitted: Math.min(urls.length, 10000) }, null, 2));
