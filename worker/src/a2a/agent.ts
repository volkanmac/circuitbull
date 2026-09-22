/** A2A / GPT Actions agent card + product catalog helpers */

import { SITE_LOCALES, productPath, solutionPath } from "../i18n/locales";

const SITE = "https://circuitbull.com";

function skuOf(p: any) {
  const raw = String(p?.sku || p?.smartId || "").trim();
  if (!raw) return null;
  if (/^SMARTID-/i.test(raw)) {
    const m = raw.match(/(\d{6})$/);
    if (m) return `Cb-${m[1]}`;
  }
  return raw;
}

export function agentCard() {
  return {
    name: "Circuitbull Catalog Agent",
    description:
      "Circuitbull® catalog — Made in USA IoT, SCADA, and carbon live monitoring, plus thermal & EO/IR sensors. Query products by SKU (Cb-xxxxxx), slug, or need.",
    url: `${SITE}/a2a`,
    provider: {
      organization: "Volls Global Inc",
      url: SITE,
    },
    version: "1.2.0",
    documentationUrl: `${SITE}/llms.txt`,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["text", "application/json"],
    defaultOutputModes: ["application/json", "text"],
    skills: [
      {
        id: "list-products",
        name: "List products",
        description: "List Circuitbull catalog products with SKU (Cb-xxxxxx), name, summary, locale-native SEO, canonical URL.",
        tags: ["catalog", "products", "SKU", "seo"],
        examples: ["List thermal cameras", "Show border control products"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "get-product",
        name: "Get product",
        description: "Fetch one product by slug or SKU with specs, datasheet summary, SEO meta, and canonical locale URL.",
        tags: ["product", "datasheet", "specs", "seo"],
        examples: ["Get AGT-TC12618C", "Product Cb-000001"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "list-solutions",
        name: "List solutions",
        description: "List mission solution pages with locale copy, SEO, and canonical slug URLs.",
        tags: ["solutions", "missions", "seo"],
        examples: ["List border control solutions", "Airport monitoring page"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "list-pages",
        name: "List pages",
        description: "Sitemap-ready index of public Circuitbull pages with canonical URL, hreflang, title, and meta description per locale.",
        tags: ["sitemap", "pages", "seo", "chatgpt"],
        examples: ["List all indexed URLs", "Turkish home canonical"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "get-facts",
        name: "Get ontology facts",
        description: "Return structured Housing/PTZ/Enhancements facts with stable IDs for a SKU.",
        tags: ["ontology", "facts", "IP66", "PTZ"],
        examples: ["What is the IP rating?", "PTZ load for Cb-000040"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "search-facts",
        name: "Semantic fact search",
        description: "Search product facts semantically (IP rating, PTZ load, housing material).",
        tags: ["search", "semantic", "qdrant"],
        examples: ["IP rating?", "PTZ load capacity"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
    ],
    authentication: {
      schemes: ["none", "apiKey"],
      credentials: "Optional A2A_SHARED_SECRET header X-A2A-Secret for write methods only. Public read OK.",
    },
    endpoints: {
      agentCard: `${SITE}/.well-known/agent.json`,
      chatgptPlugin: `${SITE}/.well-known/ai-plugin.json`,
      products: `${SITE}/a2a/v1/products`,
      productBySlug: `${SITE}/a2a/v1/products/{slug}`,
      productBySku: `${SITE}/a2a/v1/sku/{sku}`,
      productBySmartId: `${SITE}/a2a/v1/smartid/{smartId}`,
      solutions: `${SITE}/a2a/v1/solutions`,
      solutionBySlug: `${SITE}/a2a/v1/solutions/{slug}`,
      pages: `${SITE}/a2a/v1/pages`,
      sitemap: `${SITE}/sitemap.xml`,
      factsBySku: `${SITE}/a2a/v1/sku/{sku}/facts`,
      factsBySmartId: `${SITE}/a2a/v1/smartid/{smartId}/facts`,
      factsSearch: `${SITE}/a2a/v1/facts/search?q=`,
      openApi: `${SITE}/a2a/openapi.json`,
      llms: `${SITE}/llms.txt`,
    },
    locales: SITE_LOCALES,
  };
}

export function openApiSpec() {
  const langParam = { name: "lang", in: "query", schema: { type: "string", default: "en", enum: [...SITE_LOCALES] } };
  return {
    openapi: "3.1.0",
    info: {
      title: "Circuitbull A2A Catalog",
      version: "1.2.0",
      description:
        "Public read API for ChatGPT GPT Actions, Gemini, and other A2A clients. Locale-native SEO, canonical slug URLs, sitemap. Optional secret for writes.",
    },
    servers: [{ url: SITE }],
    paths: {
      "/a2a/v1/products": {
        get: {
          operationId: "listProducts",
          summary: "List catalog products with canonical URLs and SEO",
          parameters: [
            langParam,
            { name: "need", in: "query", schema: { type: "string" }, description: "Canonical solution slug" },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          ],
          responses: { "200": { description: "Product list" } },
        },
      },
      "/a2a/v1/products/{slug}": {
        get: {
          operationId: "getProduct",
          summary: "Get product by canonical slug",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }, langParam],
          responses: { "200": { description: "Product" }, "404": { description: "Not found" } },
        },
      },
      "/a2a/v1/sku/{sku}": {
        get: {
          operationId: "getProductBySku",
          summary: "Get product by SKU (Cb-xxxxxx)",
          parameters: [{ name: "sku", in: "path", required: true, schema: { type: "string" } }, langParam],
          responses: { "200": { description: "Product" }, "404": { description: "Not found" } },
        },
      },
      "/a2a/v1/smartid/{smartId}": {
        get: {
          operationId: "getProductBySmartId",
          summary: "Get product by SKU (legacy path alias)",
          parameters: [{ name: "smartId", in: "path", required: true, schema: { type: "string" } }, langParam],
          responses: { "200": { description: "Product" }, "404": { description: "Not found" } },
        },
      },
      "/a2a/v1/solutions": {
        get: {
          operationId: "listSolutions",
          summary: "List mission solutions with locale SEO and canonical slug URLs",
          parameters: [langParam],
          responses: { "200": { description: "Solution list" } },
        },
      },
      "/a2a/v1/solutions/{slug}": {
        get: {
          operationId: "getSolution",
          summary: "Get one mission solution by canonical slug",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }, langParam],
          responses: { "200": { description: "Solution" }, "404": { description: "Not found" } },
        },
      },
      "/a2a/v1/pages": {
        get: {
          operationId: "listPages",
          summary: "Sitemap-ready public pages with canonical URL, hreflang, title, meta description",
          parameters: [langParam],
          responses: { "200": { description: "Page index" } },
        },
      },
    },
  };
}

export function chatgptPlugin() {
  return {
    schema_version: "v1",
    name_for_human: "Circuitbull Catalog",
    name_for_model: "circuitbull_catalog",
    description_for_human: "Circuitbull® mission catalog — products, solutions, and canonical locale URLs.",
    description_for_model:
      "Query Circuitbull® Made in USA IoT/SCADA/carbon systems and thermal/EO-IR catalog sensors. Use locale codes en,tr,ar,es,de,fr,ru,zh-Hant,it,ko. Always cite canonical slug URLs from the response. Products: /a2a/v1/products?lang=; SKU: /a2a/v1/sku/{sku}; solutions: /a2a/v1/solutions; sitemap pages: /a2a/v1/pages.",
    auth: { type: "none" },
    api: { type: "openapi", url: `${SITE}/a2a/openapi.json` },
    logo_url: `${SITE}/favicon.svg`,
    contact_email: "info@circuitbull.com",
    legal_info_url: SITE,
  };
}

export function a2aProduct(p: any, lang: string, copy: any) {
  const sku = skuOf(p);
  const url = `${SITE}${productPath(lang, p.slug)}`;
  return {
    sku,
    smartId: sku,
    slug: p.slug,
    model: p.model || null,
    name: copy.name,
    summary: copy.summary,
    description: copy.description,
    seo: {
      title: copy.seoTitle || `${copy.name || p.slug} | Circuitbull®`,
      description: copy.seoDescription || copy.summary || copy.description || "",
      canonical: url,
    },
    benefits: copy.benefits,
    overview: copy.overview,
    applications: copy.applications,
    specs: copy.specs,
    datasheetSummary: {
      benefits: (copy.benefits || []).slice(0, 8),
      overview: (copy.overview || []).slice(0, 6),
      applications: (copy.applications || []).slice(0, 6),
      specsCount: Object.keys(copy.specs || {}).length,
    },
    image: p.image || null,
    datasheetUrl: `${SITE}${lang === "en" ? `/products/${p.slug}/datasheet` : `/${lang}/products/${p.slug}/datasheet`}`,
    datasheetPdfUrl: `${SITE}${lang === "en" ? `/products/${p.slug}/datasheet.pdf` : `/${lang}/products/${p.slug}/datasheet.pdf`}`,
    slogan: copy.slogan || null,
    needSlugs: p.needSlugs || [],
    locale: lang,
    url,
  };
}

export function a2aSolution(need: any, lang: string, copy: any) {
  const url = `${SITE}${solutionPath(lang, need.slug)}`;
  return {
    slug: need.slug,
    code: copy.code || need.code,
    title: copy.title,
    problem: copy.problem,
    lead: copy.lead,
    capabilities: copy.capabilities || [],
    seo: {
      title: copy.seoTitle || `${copy.title} | Circuitbull®`,
      description: copy.seoDescription || copy.lead || copy.problem || "",
      canonical: url,
    },
    locale: lang,
    url,
  };
}
