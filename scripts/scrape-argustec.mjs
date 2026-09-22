/**
 * Scrape external catalog (menus, products, applications) → Mongo
 * Internal source metadata only — do not surface manufacturer attribution on the live site.
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { createHash } from "crypto";
import { ensureIndexes, ensureProductSmartId } from "./lib/smartid.mjs";
import { slugsFromText } from "./lib/solutions.mjs";

const BASE = process.env.SCRAPE_SOURCE || "https://www.argustecn.com";
const UA = "CircuitbullCatalogBot/0.1 (+https://circuitbull.com; catalog sync)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function abs(href) {
  try {
    return new URL(href, BASE).href.split("#")[0].split("?")[0];
  } catch {
    return null;
  }
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(html, re, flags = "i") {
  const m = html.match(new RegExp(re, flags));
  return m ? m[1].trim() : null;
}

function allHrefs(html) {
  return [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => abs(m[1])).filter(Boolean);
}

function classifyNeed(text) {
  return slugsFromText(text)[0] || "city-safety";
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function discover() {
  const home = await fetchText(BASE + "/");
  await sleep(400);
  const productsHtml = await fetchText(BASE + "/products.html");
  await sleep(400);
  const appHtml = await fetchText(BASE + "/Application.html");

  const hrefs = [...new Set([...allHrefs(home), ...allHrefs(productsHtml), ...allHrefs(appHtml)])];
  const productUrls = hrefs.filter((u) => /-pd\d+\.html$/i.test(u) && u.includes("argustecn.com"));
  const categoryUrls = hrefs.filter(
    (u) => (/-pl\d+\.html$/i.test(u) || /Thermal-Imaging|Camera|Anti-Drone|EO-IR|Night-Vision/i.test(u)) && u.includes("argustecn.com")
  );
  const applicationUrls = hrefs.filter((u) => /Application|Surveillance|Monitoring|Defense|Protection/i.test(u) && u.endsWith(".html"));

  // Crawl top categories for more product links
  const extraProducts = new Set(productUrls);
  for (const cat of categoryUrls.slice(0, 12)) {
    try {
      await sleep(350);
      const html = await fetchText(cat);
      for (const h of allHrefs(html)) {
        if (/-pd\d+\.html$/i.test(h)) extraProducts.add(h);
      }
      console.log("cat", cat, "products so far", extraProducts.size);
    } catch (e) {
      console.warn("cat fail", cat, e.message);
    }
  }

  return {
    productUrls: [...extraProducts],
    categoryUrls: [...new Set(categoryUrls)],
    applicationHtml: appHtml,
    homeHtml: home,
  };
}

function cleanText(s) {
  return stripTags(String(s || ""))
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEditorHtml(html) {
  const m =
    html.match(/class="prodDetail-editor-container\s*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i) ||
    html.match(/class="[^"]*tinymce-render-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/class="prodDesc"[^>]*>[\s\S]*?prodDetail-editor-container[^>]*>([\s\S]*?)<\/div>/i);
  return m ? m[1] : "";
}

function extractSections(editorHtml) {
  const sections = { benefits: [], overview: [], applications: [], otherHtml: editorHtml };
  const parts = editorHtml.split(/<h[23][^>]*>/i);
  for (const part of parts) {
    const titleMatch = part.match(/^([\s\S]*?)<\/h[23]>([\s\S]*)$/i);
    if (!titleMatch) continue;
    const title = cleanText(titleMatch[1]).toLowerCase();
    const body = titleMatch[2];
    const bullets = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => cleanText(x[1])).filter(Boolean);
    if (/key benefits|benefit/.test(title)) sections.benefits = bullets;
    else if (/overview/.test(title)) sections.overview = bullets.length ? bullets : [cleanText(body)].filter(Boolean);
    else if (/application/.test(title)) sections.applications = bullets;
  }
  return sections;
}

function extractSpecs(html, editorHtml) {
  const specs = {};
  for (const m of html.matchAll(/<label>([^<]+)<\/label>\s*<p>\s*([^<]+)/gi)) {
    const k = cleanText(m[1]).replace(/:$/, "");
    const v = cleanText(m[2]);
    if (k && v) specs[k] = v;
  }
  const rows = [...editorHtml.matchAll(/<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)];
  for (const m of rows) {
    const k = cleanText(m[1]).replace(/\s+/g, " ").replace(/([A-Za-z]) ([a-z])/g, "$1$2");
    const v = cleanText(m[2]);
    if (!k || !v || k.length > 80) continue;
    if (/^model$/i.test(k) && specs.Model) continue;
    specs[k] = v;
  }
  return specs;
}

function extractPdfLinks(html, baseUrl) {
  const links = [];
  for (const m of html.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi)) {
    const u = abs(m[1]);
    if (u) links.push(u);
  }
  for (const m of html.matchAll(/(https?:\/\/[^"'<\s]+\.pdf)/gi)) {
    links.push(m[1].split("?")[0]);
  }
  // Leadong sometimes embeds file paths
  for (const m of html.matchAll(/["']([^"']*\/(?:cloud|file|upload)[^"']+\.pdf)["']/gi)) {
    const u = abs(m[1].startsWith("//") ? `https:${m[1]}` : m[1]);
    if (u) links.push(u);
  }
  return [...new Set(links)];
}

function extractProductImages(html, jsonLd, model) {
  const images = [];
  const detailMatch = html.match(/class="proddetail-wrap[\s\S]*?(?=class="proddetails-detial-wrap"|class="keyword_box")/i);
  const detailBlock = detailMatch ? detailMatch[0] : html;

  for (const m of detailBlock.matchAll(/(?:src|org-src|largeimage)=["'](\/\/[^"']+\.(?:jpg|jpeg|png|webp)|https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/gi)) {
    let u = m[1].startsWith("//") ? `https:${m[1]}` : m[1];
    u = abs(u);
    if (!u || !/micyjz\.com\/cloud\//.test(u)) continue;
    if (/langBar|icon|logo|flag|facebook|twitter|spacer|sharethis|weixin/i.test(u)) continue;
    images.push(u);
  }

  if (Array.isArray(jsonLd?.image)) {
    for (const img of jsonLd.image) {
      const u = abs(img);
      if (u && /\/cloud\//.test(u)) images.push(u);
    }
  }

  // Prefer full-size / 800-800, drop tiny thumbs
  const filtered = [...new Set(images)].filter((u) => {
    if (/-\d{2,3}-\d{2,3}\.(jpg|png|webp)$/i.test(u) && !/-800-800\./i.test(u) && !/-1120-1120\./i.test(u) && !/-400-400\./i.test(u)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    const score = (u) => {
      let s = 0;
      if (/-800-800\./i.test(u) || /-\d{3,4}-\d{3,4}\./i.test(u) === false) s += 3;
      if (model && u.toLowerCase().includes(String(model).toLowerCase().slice(0, 8))) s += 5;
      if (/Z50|AGT-|TC|HTVC|DMA|TRC|DRC|CTC/i.test(u)) s += 1;
      return s;
    };
    return score(b) - score(a);
  });

  return filtered.slice(0, 10);
}

function parseProduct(url, html) {
  const pdMatch = url.match(/-pd(\d+)\.html/i);
  const sourceId = pdMatch ? pdMatch[1] : createHash("sha1").update(url).digest("hex").slice(0, 12);

  let jsonLd = null;
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const type = data?.["@type"];
      if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
        jsonLd = data;
        break;
      }
    } catch {
      /* ignore */
    }
  }

  const formName = extract(html, '<input[^>]+name=["\']name["\'][^>]+value=["\']([^"\']+)["\']');
  const h1 = cleanText(extract(html, '<h1[^>]*class=["\'][^"\']*this-description-name[^"\']*["\'][^>]*>([\\s\\S]*?)</h1>') || "");
  const titleTag = (extract(html, "<title>([^<]+)</title>") || "")
    .replace(/\s*from China.*$/i, "")
    .replace(/\s*-\s*Argustec.*$/i, "")
    .trim();
  const fromUrl = decodeURIComponent(url.split("/").pop() || "")
    .replace(/-pd\d+\.html$/i, "")
    .replace(/-/g, " ")
    .trim();

  let cleanTitle = (formName || h1 || jsonLd?.name || titleTag || fromUrl || "Untitled").replace(/\s+/g, " ").trim();
  if (/Argustec Information|Co\., Ltd/i.test(cleanTitle)) cleanTitle = fromUrl || h1 || titleTag;

  let model =
    extract(html, "<label>\\s*Model:\\s*</label>\\s*<p>\\s*([^<]+)") ||
    extract(html, "Model</strong></span></p></td>\\s*<td>[\\s\\S]*?<strong>AGT-</strong><strong>([^<]+)") ||
    (cleanTitle.match(/\b(AGT-[A-Z0-9\-]+)\b/i) || [])[1] ||
    null;
  if (model) {
    model = cleanText(model).replace(/\s+/g, "");
    if (!/^AGT-/i.test(model) && /^[A-Z0-9\-]+$/i.test(model)) model = `AGT-${model}`;
    if (/^(Display|Model|Name)$/i.test(model)) model = null;
  }

  const editorHtml = extractEditorHtml(html);
  const sections = extractSections(editorHtml);
  const specs = extractSpecs(html, editorHtml);
  if (model && !specs.Model) specs.Model = model;

  const richText = [
    sections.benefits.length ? `Key Benefits: ${sections.benefits.join(" | ")}` : "",
    sections.overview.length ? `Overview: ${sections.overview.join(" | ")}` : "",
    sections.applications.length ? `Applications: ${sections.applications.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const descMeta = extract(html, '<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']');
  const desc = (richText || jsonLd?.description || descMeta || cleanTitle).replace(/\s+/g, " ").trim().slice(0, 6000);

  const uniqImages = extractProductImages(html, jsonLd, model);
  const pdfs = extractPdfLinks(html, url);

  const needSlug = classifyNeed(`${cleanTitle} ${url} ${desc} ${sections.applications.join(" ")}`);
  const slugBase = model ? model.toLowerCase() : slugify(cleanTitle);
  const slug = `${slugBase}-${sourceId}`.replace(/[^a-z0-9\-]+/g, "-");

  const cleanedHtml = editorHtml
    ? editorHtml
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 50000)
    : null;

  const datasheet = {
    model: model || null,
    benefits: sections.benefits,
    overview: sections.overview,
    applications: sections.applications,
    specs,
    pdfs,
    rawHtml: cleanedHtml,
    html: cleanedHtml,
  };

  return {
    _id: `product:${sourceId}`,
    type: "product",
    source: "argustec",
    sourceId,
    url,
    slug,
    model,
    name: cleanTitle,
    summary: desc.slice(0, 320),
    description: desc,
    descriptionHtml: datasheet.html,
    benefits: sections.benefits,
    overview: sections.overview,
    applications: sections.applications,
    specs,
    datasheet,
    datasheets: pdfs,
    images: uniqImages,
    image: uniqImages[0] || null,
    needSlugs: [needSlug],
    category: Array.isArray(jsonLd?.category) ? jsonLd.category : [],
    brandSegment: "catalog",
    i18n: {
      en: {
        name: cleanTitle,
        summary: desc.slice(0, 320),
        description: desc,
        benefits: sections.benefits,
        overview: sections.overview,
        applications: sections.applications,
        translated: false,
        lang: "en",
      },
    },
    datasheetStatus: { cleaned: false, cleanedAt: null, translatedAt: null },
    contentHash: createHash("sha1").update(html.slice(0, 80000)).digest("hex"),
    scrapedAt: new Date(),
    updatedAt: new Date(),
  };
}

function parseApplications(html) {
  const apps = [];
  const blocks = [...html.matchAll(/href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  for (const m of blocks) {
    const url = abs(m[1]);
    const label = stripTags(m[2]);
    if (!url || !label || label.length < 6 || label.length > 120) continue;
    if (!/Airport|Coastal|Border|Marine|Vehicle|Aquaculture|Forest|Anti|Surveillance|Security|Monitoring|Defense/i.test(label))
      continue;
    const need = classifyNeed(label + " " + url);
    if (seen.has(need)) continue;
    seen.add(need);
    apps.push({
      _id: `application:${need}`,
      type: "application",
      slug: need,
      sourceUrl: url,
      i18n: {
        en: { title: label, problem: `${label} mission stack for government and enterprise operators.` },
        tr: { title: label, problem: `${label} — kamu ve kurumsal operatörler için görev yığını.` },
      },
      updatedAt: new Date(),
    });
  }

  // Ensure core needs
  const core = [
    ["border-control", "Border Surveillance"],
    ["airport-security", "Airport Security Monitoring"],
    ["coastal-surveillance", "Coastal Surveillance"],
    ["vehicle-mounted", "Marine / Vehicle Mounted System"],
    ["aquaculture", "Aquaculture Safety Monitoring"],
    ["forest-fire", "Forest Fire Protection"],
    ["anti-uav", "Anti-UAV Defense"],
  ];
  for (const [slug, title] of core) {
    if (!apps.find((a) => a.slug === slug)) {
      apps.push({
        _id: `application:${slug}`,
        type: "application",
        slug,
        sourceUrl: BASE + "/Application.html",
        i18n: {
          en: { title, problem: `${title} — sensor-to-command for critical infrastructure.` },
          tr: { title, problem: `${title} — kritik altyapı için sensörden komutaya.` },
        },
        updatedAt: new Date(),
      });
    }
  }
  return apps;
}

function parseCategories(urls) {
  return urls.slice(0, 40).map((url) => {
    const name = decodeURIComponent(url.split("/").pop().replace(/-pl\d+\.html$/i, "").replace(/-/g, " "));
    return {
      _id: `category:${slugify(name)}`,
      type: "category",
      slug: slugify(name),
      name,
      url,
      brandSegment: "catalog",
      updatedAt: new Date(),
    };
  });
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "circuitbull");

console.log("Discovering…");
const disc = await discover();
const categories = parseCategories(disc.categoryUrls);
const applications = parseApplications(disc.applicationHtml);

const products = [];
for (const url of disc.productUrls.slice(0, 60)) {
  try {
    await sleep(400);
    const html = await fetchText(url);
    const p = parseProduct(url, html);
    products.push(p);
    console.log("product", p.model || p.slug, "→", p.needSlugs[0]);
  } catch (e) {
    console.warn("product fail", url, e.message);
  }
}

for (const c of categories) {
  await db.collection("categories").updateOne({ _id: c._id }, { $set: c }, { upsert: true });
}
for (const a of applications) {
  await db.collection("applications").updateOne({ _id: a._id }, { $set: a }, { upsert: true });
  await db.collection("needs").updateOne(
    { slug: a.slug },
    {
      $set: {
        slug: a.slug,
        type: "need",
        solutionSlug: a.slug,
        i18n: a.i18n,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
await ensureIndexes(db);

let smartIdNew = 0;
for (const p of products) {
  // Preserve existing SMARTID on re-scrape; allocate from shared pool if missing.
  const existing = await db.collection("products").findOne({ _id: p._id });
  const ensured = await ensureProductSmartId(db, {
    _id: p._id,
    slug: p.slug,
    model: p.model,
    name: p.name,
    smartId: existing?.smartId,
    sku: existing?.sku,
  });
  if (ensured.allocated) smartIdNew++;

  const doc = {
    ...p,
    smartId: ensured.smartId,
    sku: ensured.sku,
  };
  if (ensured.assignedAt) doc.smartIdAssignedAt = ensured.assignedAt;
  else if (existing?.smartIdAssignedAt) doc.smartIdAssignedAt = existing.smartIdAssignedAt;

  // Preserve LLM-cleaned / translated i18n on re-scrape; keep fresh raw HTML for re-clean.
  if (existing?.datasheetStatus?.cleaned) {
    doc.name = existing.name || doc.name;
    doc.summary = existing.summary || doc.summary;
    doc.description = existing.description || doc.description;
    doc.benefits = existing.benefits || doc.benefits;
    doc.overview = existing.overview || doc.overview;
    doc.applications = existing.applications || doc.applications;
    doc.specs = existing.specs || doc.specs;
    doc.i18n = existing.i18n || doc.i18n;
    doc.datasheetStatus = existing.datasheetStatus;
    doc.datasheet = {
      ...doc.datasheet,
      benefits: existing.datasheet?.benefits || doc.datasheet.benefits,
      overview: existing.datasheet?.overview || doc.datasheet.overview,
      applications: existing.datasheet?.applications || doc.datasheet.applications,
      specs: existing.datasheet?.specs || doc.datasheet.specs,
      i18n: existing.datasheet?.i18n || {},
      rawHtml: doc.datasheet.rawHtml || existing.datasheet?.rawHtml,
      html: doc.datasheet.html || existing.datasheet?.html,
    };
    if (existing.datasheetUrl) doc.datasheetUrl = existing.datasheetUrl;
  }

  await db.collection("products").updateOne({ _id: p._id }, { $set: doc }, { upsert: true });
}

await db.collection("products").createIndex({ slug: 1 }, { unique: true });
await db.collection("products").createIndex({ needSlugs: 1 });
await db.collection("products").createIndex({ model: 1 });

console.log(
  JSON.stringify(
    {
      categories: categories.length,
      applications: applications.length,
      products: products.length,
      smartIdNew,
      needs: products.reduce((m, p) => {
        m[p.needSlugs[0]] = (m[p.needSlugs[0]] || 0) + 1;
        return m;
      }, {}),
    },
    null,
    2
  )
);

await client.close();
