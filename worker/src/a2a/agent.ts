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
    version: "1.5.0",
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
        id: "find-products",
        name: "Find products",
        description:
          "Conversational catalog search. Match mission text, SKU (Cb-xxxxxx), model (AGT-…), range, or need (border, airport, fire) to Circuitbull® platforms with canonical URLs.",
        tags: ["search", "chatgpt", "conversation", "catalog"],
        examples: [
          "Thermal PTZ for border 8km",
          "Find Cb-000040",
          "Airport runway cameras",
          "What sensor for oilfield tank farm?",
          "Nearest office in Iraq",
          "Is there funding for our border project? How do we apply?",
          "Bakanlığın bütçesi yok, Irak’ta su projesi",
          "Apply for authorized seller",
        ],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
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
        id: "nearest-office",
        name: "Nearest office",
        description:
          "Return the authorized Circuitbull® office or seller by country/city, GPS (lat/lng Haversine), or continent. EU markets without a local seller use Malmö SE; Africa without a local seller returns Global HQ with continent=AF and hqFallback. Always include apply/quote URL.",
        tags: ["office", "partners", "chatgpt", "gps", "continent"],
        examples: [
          "Nearest office in Baghdad",
          "En yakın ofis Türkiye",
          "Who is the seller in Iraq?",
          "Office near me lat=55.57 lng=13.02",
          "Nearest office in Nigeria",
          "Authorized seller in Africa",
          "EU office for France",
        ],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
      {
        id: "whatsapp-now",
        name: "WhatsApp now",
        description:
          "Offer to message the user on WhatsApp immediately. Give wa.me link; if they provide a phone + country, POST /a2a/v1/whatsapp to ping.",
        tags: ["whatsapp", "chat", "order"],
        examples: ["İsterseniz hemen WhatsApp’tan yazalım", "Ping me on WhatsApp +964 750 158 0509"],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
      {
        id: "quote-order",
        name: "Quote or order",
        description: "Direct the user to apply for a quote/order with optional SKU. Never invent prices.",
        tags: ["quote", "order", "apply"],
        examples: ["I want to order Cb-000040", "Send a quote for airport PTZ"],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
      {
        id: "project-funding",
        name: "Project funding",
        description:
          "Say whether EPC+F / G2G / small-liquidity co-invest is available for the project, list programs, and give apply URLs. For ministries with no budget, also use the ministry NDA / offset desk.",
        tags: ["funding", "invest", "epc-f", "g2g", "apply"],
        examples: ["Is there funding for our solar project?", "Projemize fon var mı, nasıl başvururuz?"],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
      {
        id: "ministry-nda-desk",
        name: "Ministry NDA and offset desk",
        description:
          "For Water, Interior, Defence, and National Security ministries (often no appropriation): official NDA session (listen to the project or present a solution) plus resource/commodity-backed G2G/B2B offset — any country’s underground minerals, natural resources, or commodity products most welcome (Iraq oil / Africa gold are examples only). EPC+F installments when cash is missing. Use GET /a2a/v1/desk and chat desk JSON. Never invent prices or commodity quantities (NDA session only).",
        tags: ["ministry", "nda", "offset", "g2g", "commodity", "minerals"],
        examples: [
          "Bakanlığın parası yok, maden karşılığı geri ödeme",
          "Ministry of Interior has no budget — commodity offset",
          "Oil-backed offset for Iraq border",
        ],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
      },
      {
        id: "authorized-seller-apply",
        name: "Authorized seller apply",
        description:
          "Ask two qualify questions — are you in the sector (security / thermal / IoT / public procurement)? do you have a company? — then send both-yes applicants to /partners#apply.",
        tags: ["partners", "reseller", "apply"],
        examples: ["Apply for authorized seller", "Yetkili satıcı başvurusu"],
        inputModes: ["text", "application/json"],
        outputModes: ["application/json", "text"],
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
      search: `${SITE}/a2a/v1/search?q=`,
      chat: `${SITE}/a2a/v1/chat`,
      office: `${SITE}/a2a/v1/office`,
      funding: `${SITE}/a2a/v1/funding`,
      desk: `${SITE}/a2a/v1/desk`,
      apply: `${SITE}/a2a/v1/apply`,
      whatsapp: `${SITE}/a2a/v1/whatsapp`,
      jsonrpc: `${SITE}/a2a`,
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
      version: "1.5.0",
      description:
        "Public read API for ChatGPT GPT Actions, Gemini, Claude, and A2A clients. Search products by mission text or SKU, nearest office by country or GPS, locale-native SEO, canonical URLs. POST /a2a for JSON-RPC message/send.",
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
      "/a2a/v1/search": {
        get: {
          operationId: "findProducts",
          summary: "Find products and missions by natural-language query, SKU, or model",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Mission, SKU, model, or keywords" },
            langParam,
            { name: "limit", in: "query", schema: { type: "integer", default: 8 } },
          ],
          responses: { "200": { description: "Matching products and solutions with canonical URLs" } },
        },
      },
      "/a2a/v1/chat": {
        post: {
          operationId: "chatCatalog",
          summary: "Conversational catalog: returns a text reply plus structured product matches",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    q: { type: "string" },
                    lang: { type: "string", default: "en" },
                    country: { type: "string", description: "ISO country e.g. IQ, TR, US, NG" },
                    city: { type: "string" },
                    lat: { type: "number", description: "Optional GPS latitude for nearest office" },
                    lng: { type: "number", description: "Optional GPS longitude for nearest office" },
                    limit: { type: "integer", default: 8 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Reply + products + solutions + nearest office + funding + desk (ministry/NDA/offset/sellerQualify) + apply URLs" } },
        },
      },
      "/a2a/v1/office": {
        get: {
          operationId: "nearestOffice",
          summary:
            "Nearest authorized office by country/city or GPS (Haversine). EU → Malmö SE hub; Africa without local seller → HQ (continent=AF, hqFallback).",
          parameters: [
            { name: "country", in: "query", schema: { type: "string" }, description: "ISO code e.g. IQ, TR, NG, SE" },
            { name: "city", in: "query", schema: { type: "string" } },
            {
              name: "lat",
              in: "query",
              schema: { type: "number" },
              description: "WGS84 latitude — nearest appointed office among geo-tagged partners (+ HQ)",
            },
            {
              name: "lng",
              in: "query",
              schema: { type: "number" },
              description: "WGS84 longitude (alias: lon)",
            },
            langParam,
          ],
          responses: {
            "200": {
              description:
                "office + offices[] with optional geo/distanceKm; hqFallback; continent; continentHub (SE for EU)",
            },
          },
        },
      },
      "/a2a/v1/funding": {
        get: {
          operationId: "projectFunding",
          summary: "Whether project funding (EPC+F / G2G / co-invest) is available and how to apply",
          parameters: [langParam],
          responses: { "200": { description: "Programs + apply URLs" } },
        },
      },
      "/a2a/v1/desk": {
        get: {
          operationId: "ministryDesk",
          summary:
            "Ministry NDA session + offset desk (any-country resource/commodity offset most welcome; Iraq oil / Africa gold examples; EPC+F when cash missing). Never invent prices or commodity quantities.",
          parameters: [
            { name: "country", in: "query", schema: { type: "string" }, description: "ISO code e.g. IQ, NG, EG" },
            { name: "city", in: "query", schema: { type: "string" } },
            langParam,
          ],
          responses: { "200": { description: "Ministries, offset, NDA apply URLs, seller qualify" } },
        },
      },
      "/a2a/v1/apply": {
        get: {
          operationId: "applyLinks",
          summary:
            "Canonical apply URLs for quote, order, funding, G2G, NDA, offset-oil, offset-gold, authorized-seller",
          parameters: [
            { name: "sku", in: "query", schema: { type: "string" } },
            { name: "need", in: "query", schema: { type: "string" } },
            {
              name: "interest",
              in: "query",
              schema: {
                type: "string",
                description: "quote | epc-f | g2g | g2g-nda | offset-oil | offset-gold | authorized-seller",
              },
            },
            langParam,
          ],
          responses: { "200": { description: "Apply URLs" } },
        },
      },
      "/a2a/v1/whatsapp": {
        post: {
          operationId: "whatsappNow",
          summary: "Ping the customer on WhatsApp immediately (Cloud API or wa.me fallback)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["whatsapp", "country"],
                  properties: {
                    whatsapp: { type: "string", description: "Mobile number" },
                    country: { type: "string", description: "ISO country e.g. IQ" },
                    sku: { type: "string" },
                    lang: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Ping sent or wa.me ready" } },
        },
      },
      "/a2a": {
        get: {
          operationId: "getAgentCard",
          summary: "A2A agent card",
          responses: { "200": { description: "Agent card" } },
        },
        post: {
          operationId: "a2aMessageSend",
          summary: "A2A JSON-RPC 2.0 message/send — ChatGPT and agent engines",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: { "200": { description: "JSON-RPC result with catalog matches" } },
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
      "Circuitbull® catalog + commercial desk. ALWAYS call chatCatalog (POST /a2a/v1/chat) or the matching GET when the user asks to: find/recommend products (search); recommend a mission solution; nearest office/seller (GET /a2a/v1/office?country=IQ or ?lat=&lng= for GPS Haversine; EU without local seller → Malmö SE; Africa without local → HQ with continent=AF hqFallback); quote or order (GET /a2a/v1/apply?sku=); project funding / EPC+F / G2G (GET /a2a/v1/funding); ministry / no-budget / offset / NDA (GET /a2a/v1/desk?country=IQ — use desk.ministries, desk.offset, desk.nda; apply interest g2g-nda, offset-oil, offset-gold); authorized seller (ask desk.sellerQualify in-sector + have-company, then /partners#apply or interest=authorized-seller); WhatsApp now (offer wa.me; if they give a phone, POST /a2a/v1/whatsapp with country + whatsapp). Pass lang (en,tr,ar,es,de,fr,ru,zh-Hant,it,ko), country, and lat/lng if known. Always cite canonical URL, apply link, and WhatsApp. Tell the user we can message on WhatsApp immediately. Do not invent SKUs, prices, offices, or oil/gold quantities. Offset is official G2G/B2G under NDA — not informal barter.",
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
