import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { sendSmtpMail } from "./email/ses-smtp";
import { agentCard, a2aProduct, a2aSolution, chatgptPlugin, openApiSpec } from "./a2a/agent";
import { findCatalog, handleA2aJsonRpc, converse } from "./a2a/find";
import { applyLinks, deskPack, extractPhone, fundingPrograms, nearestOffice, whatsappOffer } from "./a2a/advise";
import {
  buildFacetIndex,
  displaySku,
  factMatchesRange,
  groupFactsForDisplay,
  isGarbageGroup,
  isGarbageProperty,
  localizeFact,
  searchFactsLocal,
} from "./i18n/facts";
import {
  DEFAULT_LANG,
  SITE_LOCALES,
  COUNTRY_TO_LANG,
  COUNTRY_TO_LANGS,
  SELECTOR_COUNTRIES,
  capabilityPath,
  catalogPath,
  contactPath,
  homePath,
  isLocaleParam,
  langFromAcceptLanguage,
  langFromCountry,
  normalizeLang,
  productPath,
  solutionPath,
  solutionsIndexPath,
  investPath,
  partnersPath,
  LEGAL_SLUGS,
  legalPath,
  SITE_ORIGIN,
  CALL_SWITCHBOARD_URL,
  absoluteUrl,
  hreflangFor,
} from "./i18n/locales";
import { legalDoc, legalKicker, legalNav } from "./legal";
import { catalogDock, categoryKey, foldSearch, productCategoryLabels } from "./i18n/catalog-dock";
import { fillCount, fillTitle, pageCopy } from "./i18n/page-copy";
import { capabilitySeo, clipMeta, productSeo, sitemapUrl, solutionSeo } from "./i18n/seo";
import {
  canonicalizeSolutionSlug,
  matchSolutionSlug,
  solutionCopy,
  solutionFilterKey,
  solutionScene,
} from "./solutions";
import { redisGet } from "./search/redis";
import { APPLE_TOUCH_PNG, BRAND_HEADERS, FAVICON_ICO, LOGO_ON_DARK_SVG, LOGO_SVG, MARK_SVG } from "./ui/brand-assets";
import {
  catalogPdfKey,
  datasheetPath,
  datasheetPdfPath,
  deriveSlogan,
  looksLikePdf,
  pdfContentDisposition,
  pdfDownloadBasename,
  renderA4Datasheet,
} from "./ui/datasheet-a4";
import { cdnUrl, datasheetNameSlug, escapeHtml, layout, sanitizeCatalogHtml } from "./ui/shell";
import { partnersForMarket, partnersPageBody } from "./ui/partners";
import { loadPartners } from "./search/partners-store";
import { buyCtaMarkup, buyChannelForCountry } from "./ui/buy-cta";
import { composeBuyWhatsApp, customerWaMe, loadWhatsAppSettings, normalizeWhatsApp, sendWhatsAppCloud } from "./buy/whatsapp";
import { investCopy, investManifestoHtml } from "./ui/invest-manifesto";
import { flyDockMarkup } from "./ui/fly-dock";
import { smartFilterMarkup } from "./ui/smart-filter";
import {
  capabilityCopy,
  findCapability,
  listCapabilities,
  rankProductsForCapability,
} from "./solution-caps";
import { filterPlatforms, loadPlatformIndex, publicPlatformCard } from "./search/catalog";
import { missionQuery, recommendSimilarProducts, searchFactHits } from "./search/similar";
import {
  facebookPublicStatus,
  loadFacebookSettings,
  loadState as loadFacebookState,
  runFacebookSlot,
} from "./social/facebook";

type Env = {
  DATA: KVNamespace;
  MEDIA: R2Bucket;
  SITE_URL: string;
  CDN_BASE?: string;
  DEFAULT_LOCALE: string;
  BRAND_NAME: string;
  COMPANY_LEGAL_NAME: string;
  SES_HOST: string;
  SES_PORT: string;
  SES_USER: string;
  SES_PASS: string;
  SES_FROM: string;
  SES_NOTIFY_TO: string;
  A2A_SHARED_SECRET?: string;
  INDEXNOW_KEY?: string;
  QDRANT_URL?: string;
  QDRANT_API_KEY?: string;
  CF_AI_API_TOKEN?: string;
  CF_AI_ACCOUNT_ID?: string;
  CF_AI_EMBED_MODEL?: string;
  CF_AI_MODEL?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  REDIS_URL?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_WABA_ID?: string;
  WHATSAPP_TEMPLATE?: string;
  WHATSAPP_TEMPLATE_LANG?: string;
  WHATSAPP_GRAPH_VERSION?: string;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_TOKEN?: string;
  FACEBOOK_GRAPH_VERSION?: string;
  FACEBOOK_DRY_RUN?: string;
  FACEBOOK_CRON_SECRET?: string;
};

const app = new Hono<{ Bindings: Env }>();

const EMPTY_PLATFORM: Record<string, { kicker: string; title: string; body: string; brief: string; catalog: string }> = {
  en: {
    kicker: "R&D stage",
    title: "Not fielded yet",
    body: "No released SKU is assigned to this mission yet. Circuitbull® is qualifying the sensor set in R&D — request a brief and we’ll share the current engineering path.",
    brief: "Request R&D brief",
    catalog: "Browse released catalog",
  },
  tr: {
    kicker: "Ar-Ge aşaması",
    title: "Henüz sahada değil",
    body: "Bu görev için yayımlanmış bir SKU yok. Circuitbull® sensör setini Ar-Ge’de kalifiye ediyor — brifing isteyin, mevcut mühendislik yolunu paylaşalım.",
    brief: "Ar-Ge brifingi iste",
    catalog: "Yayımlanmış kataloğa bak",
  },
  ar: {
    kicker: "مرحلة البحث والتطوير",
    title: "لم يُطرح ميدانياً بعد",
    body: "لا توجد منصة مُصدَرة لهذه المهمة بعد. نؤهّل مجموعة الاستشعار في البحث والتطوير — اطلب موجزاً وسنشارك المسار الهندسي الحالي.",
    brief: "اطلب موجز البحث والتطوير",
    catalog: "تصفح الكتالوج الصادر",
  },
  es: {
    kicker: "Etapa de I+D",
    title: "Aún no desplegado",
    body: "Todavía no hay un SKU publicado para esta misión. Circuitbull® está calificando el conjunto de sensores en I+D — solicite un briefing y compartiremos la ruta de ingeniería.",
    brief: "Solicitar briefing de I+D",
    catalog: "Ver catálogo publicado",
  },
  de: {
    kicker: "F&E-Phase",
    title: "Noch nicht felderprobt",
    body: "Dieser Mission ist noch keine freigegebene SKU zugeordnet. Circuitbull® qualifiziert den Sensorsatz in F&E — fordern Sie ein Briefing an, wir teilen den aktuellen Engineering-Pfad.",
    brief: "F&E-Briefing anfordern",
    catalog: "Freigegebenen Katalog öffnen",
  },
  fr: {
    kicker: "Phase R&D",
    title: "Pas encore déployé",
    body: "Aucun SKU publié n’est encore assigné à cette mission. Circuitbull® qualifie le lot capteurs en R&D — demandez un briefing, nous partagerons la trajectoire d’ingénierie.",
    brief: "Demander un briefing R&D",
    catalog: "Voir le catalogue publié",
  },
  ru: {
    kicker: "Стадия R&D",
    title: "Ещё не в поле",
    body: "Для этой задачи пока нет выпущенного SKU. Circuitbull® квалифицирует сенсорный комплект в R&D — запросите брифинг, мы покажем текущий инженерный путь.",
    brief: "Запросить R&D-брифинг",
    catalog: "Открыть выпущенный каталог",
  },
  "zh-Hant": {
    kicker: "研發階段",
    title: "尚未列裝",
    body: "此任務尚無已發布料號。Circuitbull® 正於研發中驗證感測器組合 — 請索取簡報，我們會說明目前工程路徑。",
    brief: "索取研發簡報",
    catalog: "瀏覽已發布型錄",
  },
  it: {
    kicker: "Fase R&S",
    title: "Non ancora in campo",
    body: "Nessun SKU rilasciato è ancora assegnato a questa missione. Circuitbull® sta qualificando il set sensori in R&S — richiedi un briefing e condivideremo il percorso di engineering.",
    brief: "Richiedi briefing R&S",
    catalog: "Apri il catalogo rilasciato",
  },
  ko: {
    kicker: "R&D 단계",
    title: "아직 야전 배치 전",
    body: "이 임무에 할당된 출시 SKU가 없습니다. Circuitbull®가 R&D에서 센서 세트를 검증 중입니다 — 브리핑을 요청하시면 현재 엔지니어링 경로를 공유합니다.",
    brief: "R&D 브리핑 요청",
    catalog: "출시 카탈로그 보기",
  },
};

async function kvJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

/** Resolve locale: path → cookie → CF-IPCountry → Accept-Language → en */
function resolveLocale(c: any, pathLang?: string) {
  if (pathLang && isLocaleParam(pathLang)) {
    return {
      lang: normalizeLang(pathLang),
      country: getCookie(c, "cb_country") || undefined,
      source: "path" as const,
    };
  }
  const cookieLang = getCookie(c, "cb_lang");
  if (cookieLang) {
    return {
      lang: normalizeLang(cookieLang),
      country: getCookie(c, "cb_country") || undefined,
      source: "cookie" as const,
    };
  }
  const cfCountry = c.req.header("CF-IPCountry") || c.req.header("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
    return { lang: langFromCountry(cfCountry), country: String(cfCountry).toUpperCase(), source: "geo" as const };
  }
  return {
    lang: langFromAcceptLanguage(c.req.header("Accept-Language")),
    country: undefined,
    source: "accept" as const,
  };
}

function persistLocaleCookies(c: any, lang: string, country?: string) {
  setCookie(c, "cb_lang", normalizeLang(lang), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "Lax" });
  if (country) {
    setCookie(c, "cb_country", country.toUpperCase(), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "Lax" });
  }
}

/** Product copy for locale with English fallback + top-level fields. */
function productCopy(p: any, lang: string) {
  const l = normalizeLang(lang);
  const block = p?.i18n?.[l] || p?.i18n?.en || {};
  const ds = p?.datasheet?.i18n?.[l] || p?.datasheet?.i18n?.en || {};
  const summary = block.summary || p.summary || "";
  const description = block.description || p.description || "";
  const slogan =
    block.slogan ||
    p.slogan ||
    ds.slogan ||
    p.datasheet?.slogan ||
    deriveSlogan(p, { slogan: "", summary, description });
  return {
    lang: l,
    name: block.name || p.name || "",
    summary,
    description,
    slogan,
    benefits: block.benefits?.length ? block.benefits : ds.benefits?.length ? ds.benefits : p.benefits || p.datasheet?.benefits || [],
    overview: block.overview?.length ? block.overview : ds.overview?.length ? ds.overview : p.overview || p.datasheet?.overview || [],
    applications: block.applications?.length
      ? block.applications
      : ds.applications?.length
        ? ds.applications
        : p.applications || p.datasheet?.applications || [],
    specs: Object.keys(ds.specs || {}).length ? ds.specs : p.specs || p.datasheet?.specs || {},
    seoTitle: block.seoTitle || "",
    seoDescription: block.seoDescription || "",
    translated: Boolean(block.translated),
  };
}

function productCardHtml(p: any, lang: string) {
  const copy = productCopy(p, lang);
  const imgSrc = p.media?.aiHero || p.image;
  const img = imgSrc ? cdnUrl(imgSrc) : "";
  const path = productPath(lang, p.slug);
  const sku = displaySku(p);
  const apps = (copy.applications || []).slice(0, 8).join("|");
  return `<a class="product" href="${path}">
      <div class="media">${
        img
          ? `<img src="${escapeHtml(img)}" data-full="${escapeHtml(img)}" data-lightbox data-product-peek data-sku="${escapeHtml(sku)}" data-product-name="${escapeHtml(copy.name)}" data-summary="${escapeHtml((copy.summary || "").slice(0, 220))}" data-product-path="${escapeHtml(path)}" data-apps="${escapeHtml(apps)}" alt="${escapeHtml(copy.name)}" loading="lazy"/>`
          : ""
      }</div>
      <div class="body">
        <div class="model">${escapeHtml(sku)}</div>
        <h3>${escapeHtml(copy.name)}</h3>
        <p>${escapeHtml((copy.summary || "").slice(0, 100))}</p>
      </div>
    </a>`;
}

function catalogCards(products: any[], lang: string) {
  return products.map((p) => {
    const copy = productCopy(p, lang);
    const imgSrc = p.media?.aiHero || p.image;
    return {
      slug: p.slug,
      smartId: displaySku(p),
      sku: displaySku(p),
      name: copy.name,
      summary: copy.summary || "",
      image: imgSrc ? cdnUrl(imgSrc) : "",
      path: productPath(lang, p.slug),
      apps: (copy.applications || []).slice(0, 8).join("|"),
    };
  });
}

function solutionHeroImage(need: any, products: any[] = []) {
  const scene = solutionScene(need?.slug);
  if (scene) return `${cdnUrl(scene.key)}?v=20260922b`;
  const media = need?.media || {};
  const raw = media.poster || media.image || "";
  if (raw) return cdnUrl(raw);
  const first = products.find((p) => p.media?.aiHero || p.image);
  return first ? cdnUrl(first.media?.aiHero || first.image) : "";
}

function solutionSceneCreditHtml(slug: string, lang: string) {
  const scene = solutionScene(slug);
  if (!scene) return "";
  const generic = !scene.photographer || /^pexels$/i.test(scene.photographer);
  const label = generic
    ? lang === "tr"
      ? "Fotoğraf: Pexels"
      : "Photo on Pexels"
    : lang === "tr"
      ? `Fotoğraf: ${scene.photographer} · Pexels`
      : `Photo by ${scene.photographer} on Pexels`;
  return `<p class="sol-scene-credit"><a href="${escapeHtml(scene.pexelsUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(label)}</a></p>`;
}

function applicationChipsHtml(applications: string[], lang: string) {
  const chips = applications
    .map((label) => {
      const slug = matchSolutionSlug(label);
      const text = escapeHtml(label);
      if (!slug) return `<span class="app-chip">${text}</span>`;
      return `<a class="app-chip" href="${solutionPath(lang, slug)}">${text}</a>`;
    })
    .join("");
  return chips
    ? `<div class="app-chips" aria-label="Solutions">${chips}</div>`
    : "";
}

function solutionTileHtml(need: any, lang: string, count: number, image: string) {
  const copy = solutionCopy(need, lang);
  return `<a class="sol-card" href="${solutionPath(lang, need.slug)}">
    <div class="sol-card-media">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(copy.title)}" loading="lazy"/>` : ""}</div>
    <div class="sol-card-body">
      <p class="kicker">${escapeHtml(copy.code)} · ${count} platform${count === 1 ? "" : "s"}</p>
      <h3>${escapeHtml(copy.title)}</h3>
      <p>${escapeHtml((copy.problem || "").slice(0, 140))}</p>
    </div>
  </a>`;
}

function similarCopy(lang: string) {
  return pageCopy(lang).similar;
}

function productHreflang(slug: string) {
  return SITE_LOCALES.map((l) => ({
    lang: l,
    href: `https://circuitbull.com${productPath(l, slug)}`,
  }));
}

function usaSegments(lang: string) {
  return pageCopy(lang).usa;
}

app.get("/health", (c) => c.json({ ok: true, brand: "Circuitbull®" }));

/* ——— SEO / AI crawlers ——— */
app.get("/robots.txt", (c) =>
  c.text(
    `User-agent: Googlebot
Allow: /

User-agent: Google-InspectionTool
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /
Allow: /llms.txt
Allow: /a2a/
Allow: /.well-known/agent.json
Allow: /.well-known/ai-plugin.json
Allow: /.well-known/indexnow.txt
Disallow: /api/v1/leads
Disallow: /sku-pool
Sitemap: https://circuitbull.com/sitemap.xml
Sitemap: https://circuitbull.com/sitemap-pages.xml
Sitemap: https://circuitbull.com/sitemap-products.xml
Sitemap: https://circuitbull.com/sitemap-solutions.xml
`,
    200,
    { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" }
  )
);

const INDEXNOW_KEY = "cbidx7f3e91a2d64c8b9e1f0a4d6c8b2e19";

function indexNowKey(env?: Env) {
  return String(env?.INDEXNOW_KEY || INDEXNOW_KEY).trim();
}

function indexNowResponse(key: string) {
  return new Response(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function indexNowPathMatch(pathname: string, key: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === `/${key}.txt` || path === "/.well-known/indexnow.txt" || path === "/indexnow.txt";
}

app.on(["GET", "HEAD"], `/${INDEXNOW_KEY}.txt`, (c) => indexNowResponse(indexNowKey(c.env)));
app.on(["GET", "HEAD"], `/${INDEXNOW_KEY}.txt/`, (c) => indexNowResponse(indexNowKey(c.env)));
app.on(["GET", "HEAD"], "/.well-known/indexnow.txt", (c) => indexNowResponse(indexNowKey(c.env)));
app.on(["GET", "HEAD"], "/indexnow.txt", (c) => indexNowResponse(indexNowKey(c.env)));

const SITEMAP_NS = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"`;
const xmlHeaders = {
  "Content-Type": "text/xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, must-revalidate",
};

function xmlResponse(xml: string, method = "GET") {
  return new Response(method === "HEAD" ? null : xml, { status: 200, headers: xmlHeaders });
}

function urlsetXml(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${SITEMAP_NS}>
${urls.join("\n")}
</urlset>`;
}

function sitemapIndexXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const files = ["sitemap-pages.xml", "sitemap-products.xml", "sitemap-solutions.xml"];
  const body = files
    .map(
      (f) =>
        `  <sitemap>\n    <loc>${SITE_ORIGIN}/${f}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

function sitemapPagesXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    sitemapUrl(absoluteUrl(homePath("en")), "1.0", homePath),
    sitemapUrl(absoluteUrl(catalogPath("en")), "0.9", catalogPath),
    sitemapUrl(absoluteUrl(solutionsIndexPath("en")), "0.85", solutionsIndexPath),
    sitemapUrl(absoluteUrl(contactPath("en")), "0.6", contactPath, lastmod),
    sitemapUrl(absoluteUrl(partnersPath("en")), "0.6", partnersPath, lastmod),
    sitemapUrl(absoluteUrl(investPath("en")), "0.85", investPath, lastmod),
    ...LEGAL_SLUGS.map((slug) =>
      sitemapUrl(absoluteUrl(legalPath("en", slug)), "0.4", (l) => legalPath(l, slug))
    ),
    ...SITE_LOCALES.filter((l) => l !== DEFAULT_LANG).map((l) =>
      sitemapUrl(absoluteUrl(homePath(l)), "0.8", homePath)
    ),
  ];
  return urlsetXml(urls);
}

async function sitemapProductsXml(env: Env) {
  try {
    const products = (await kvJson<any[]>(env.DATA, "products")) || [];
    const urls: string[] = [];
    for (const p of products) {
      const slug = String(p?.slug || "").trim();
      if (!slug) continue;
      const lastmod = p.updatedAt || p.datasheetStatus?.translatedAt;
      urls.push(sitemapUrl(absoluteUrl(productPath("en", slug)), "0.8", (l) => productPath(l, slug), lastmod));
      urls.push(sitemapUrl(absoluteUrl(datasheetPath("en", slug)), "0.55", (l) => datasheetPath(l, slug), lastmod));
    }
    return urlsetXml(urls);
  } catch {
    return urlsetXml([]);
  }
}

async function sitemapSolutionsXml(env: Env) {
  try {
    const needs = (await kvJson<any[]>(env.DATA, "needs")) || [];
    const urls: string[] = [];
    for (const n of needs) {
      if (n.catalog === false) continue;
      const slug = String(n?.slug || "").trim();
      if (!slug) continue;
      const lastmod = n.updatedAt;
      urls.push(sitemapUrl(absoluteUrl(solutionPath("en", slug)), "0.75", (l) => solutionPath(l, slug), lastmod));
      for (const cap of listCapabilities(slug)) {
        urls.push(
          sitemapUrl(
            absoluteUrl(capabilityPath("en", slug, cap.slug)),
            "0.65",
            (l) => capabilityPath(l, slug, cap.slug),
            lastmod
          )
        );
      }
    }
    return urlsetXml(urls);
  } catch {
    return urlsetXml([]);
  }
}

app.on(["GET", "HEAD"], "/sitemap.xml", (c) => xmlResponse(sitemapIndexXml(), c.req.method));
app.on(["GET", "HEAD"], "/sitemap.xml/", (c) => xmlResponse(sitemapIndexXml(), c.req.method));
app.on(["GET", "HEAD"], "/sitemap-pages.xml", (c) => xmlResponse(sitemapPagesXml(), c.req.method));
app.on(["GET", "HEAD"], "/sitemap-products.xml", async (c) =>
  xmlResponse(await sitemapProductsXml(c.env), c.req.method)
);
app.on(["GET", "HEAD"], "/sitemap-solutions.xml", async (c) =>
  xmlResponse(await sitemapSolutionsXml(c.env), c.req.method)
);

function llmsTxt(products: any[], needs: any[], lang = DEFAULT_LANG) {
  const ui = pageCopy(lang);
  return [
    "# Circuitbull®",
    "> Made in USA: IoT, SCADA, and carbon live monitoring. Thermal & EO/IR cameras are catalog sensors — not USA-manufactured.",
    "",
    "Organization: Volls Global Inc (Wilmington, DE)",
    `Site: ${SITE_ORIGIN}`,
    "Brand: Circuitbull®",
    `A2A agent: ${SITE_ORIGIN}/.well-known/agent.json`,
    `ChatGPT plugin: ${SITE_ORIGIN}/.well-known/ai-plugin.json`,
    `OpenAPI: ${SITE_ORIGIN}/a2a/openapi.json`,
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    `Locale: ${lang}`,
    `Locales: ${SITE_LOCALES.join(", ")}`,
    "",
    "## Canonical URL pattern",
    "- English (default): https://circuitbull.com/{slug-path}",
    "- Other locales: https://circuitbull.com/{lang}/{slug-path}",
    `- Home: ${absoluteUrl(homePath(lang))}`,
    `- Catalog: ${absoluteUrl(catalogPath(lang))}`,
    `- Solutions: ${absoluteUrl(solutionsIndexPath(lang))}`,
    `- Contact: ${absoluteUrl(contactPath(lang))}`,
    `- Partners: ${absoluteUrl(partnersPath(lang))}`,
    `- Invest: ${absoluteUrl(investPath(lang))}`,
    `- Terms: ${absoluteUrl(legalPath(lang, "terms"))}`,
    `- GDPR: ${absoluteUrl(legalPath(lang, "gdpr"))}`,
    `- Data policy: ${absoluteUrl(legalPath(lang, "data-policy"))}`,
    `- Code of conduct: ${absoluteUrl(legalPath(lang, "code-of-conduct"))}`,
    "",
    "## Solutions",
    ...needs
      .filter((n) => n.catalog !== false)
      .map((n) => {
        const copy = solutionCopy(n, lang);
        return `- ${copy.title} (${n.slug}): ${absoluteUrl(solutionPath(lang, n.slug))}`;
      }),
    "- Capability field notes: /{lang}/solutions/{need}/{capability} (English unprefixed)",
    "",
    "## Products (SKU catalog)",
    ...products.slice(0, 80).map((p) => {
      const copy = productCopy(p, lang);
      return `- ${displaySku(p)} | ${copy.name} | ${p.model || "—"} → ${absoluteUrl(productPath(lang, p.slug))}`;
    }),
    "",
    "## Invest / EPC+F",
    `- G2G launchpad: ${absoluteUrl(investPath(lang))}`,
    `- Direct briefing: ${absoluteUrl(contactPath(lang))}?interest=g2g`,
    `- Ministry NDA session: ${absoluteUrl(contactPath(lang))}?interest=g2g-nda`,
    `- Resource / commodity-backed offset: ${absoluteUrl(contactPath(lang))}?interest=offset-commodity`,
    `- Oil-backed offset (e.g. Iraq): ${absoluteUrl(contactPath(lang))}?interest=offset-oil`,
    `- Gold / mineral-backed offset (e.g. Africa): ${absoluteUrl(contactPath(lang))}?interest=offset-gold`,
    `- EPC+F financing: ${absoluteUrl(contactPath(lang))}?interest=epc-f`,
    "",
    "## API (ChatGPT / A2A)",
    `- GET /a2a/v1/products?lang=${lang}`,
    `- GET /a2a/v1/solutions?lang=${lang}`,
    `- GET /a2a/v1/pages?lang=${lang}`,
    "- GET /a2a/v1/sku/{sku}?lang=",
    `- GET /a2a/v1/products/{slug}?lang=${lang}`,
    "- GET /a2a/v1/search?q=thermal+border&lang=",
    "- POST /a2a/v1/chat  {\"message\":\"nearest office Iraq\",\"lang\":\"en\",\"country\":\"IQ\"}",
    "- GET /a2a/v1/office?country=IQ&city=Baghdad",
    "- GET /a2a/v1/office?lat=55.57&lng=13.02  (nearest by GPS)",
    "- GET /a2a/v1/office?country=NG  (Africa → HQ until regional office)",
    "- GET /a2a/v1/funding  (EPC+F / G2G — apply URLs)",
    "- GET /a2a/v1/desk?country=IQ  (ministry NDA + resource/commodity offset; oil/gold examples)",
    "- GET /a2a/v1/apply?sku=Cb-000040&interest=quote",
    "- GET /a2a/v1/apply?interest=g2g-nda",
    "- GET /a2a/v1/apply?interest=authorized-seller",
    "- POST /a2a/v1/whatsapp {\"whatsapp\":\"+9647501580509\",\"country\":\"IQ\"}",
    "- POST /a2a  JSON-RPC message/send",
    "",
    `## Page SEO (${lang})`,
    `- Home: ${ui.home.seoTitle} — ${ui.home.seoDescription}`,
    `- Catalog: ${ui.catalog.seoTitle}`,
    `- Solutions: ${ui.solutions.seoTitle}`,
    "",
  ].join("\n");
}

app.get("/llms.txt", async (c) => {
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const needs = (await kvJson<any[]>(c.env.DATA, "needs")) || [];
  return c.text(llmsTxt(products, needs, DEFAULT_LANG), 200, { "Content-Type": "text/plain; charset=utf-8" });
});

app.get("/:lang/llms.txt", async (c) => {
  const langParam = c.req.param("lang");
  if (!isLocaleParam(langParam)) return c.notFound();
  const lang = normalizeLang(langParam);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const needs = (await kvJson<any[]>(c.env.DATA, "needs")) || [];
  return c.text(llmsTxt(products, needs, lang), 200, { "Content-Type": "text/plain; charset=utf-8" });
});

/* ——— A2A / GPT Actions ——— */
app.get("/.well-known/agent.json", (c) => c.json(agentCard()));
app.get("/.well-known/ai-plugin.json", (c) => c.json(chatgptPlugin()));
app.get("/.well-known/openai-apps.json", (c) =>
  c.json({
    schema_version: "v1",
    name: "Circuitbull Catalog",
    description: "Find Circuitbull® mission sensors by SKU, model, or operational need.",
    openapi_url: `${SITE_ORIGIN}/a2a/openapi.json`,
    logo_url: `${SITE_ORIGIN}/favicon.svg`,
    contact_email: "info@circuitbull.com",
  })
);

app.get("/a2a", (c) => c.json(agentCard()));
app.post("/a2a", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const lang = normalizeLang(c.req.query("lang") || body?.params?.metadata?.lang || DEFAULT_LANG);
  const out = await handleA2aJsonRpc(c.env, body, lang);
  return c.json(out);
});
app.get("/a2a/agent.json", (c) => c.json(agentCard()));
app.get("/a2a/openapi.json", (c) => c.json(openApiSpec()));

app.get("/a2a/v1/search", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(24, Math.max(1, Number(c.req.query("limit") || 8)));
  const found = await findCatalog(c.env, q, lang, limit);
  const products = found.products.map((p) => ({
    ...p,
    url: absoluteUrl(p.path),
  }));
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    q: found.q,
    lang,
    source: found.source,
    count: products.length,
    products,
    solutions: found.solutions,
  });
});

app.post("/a2a/v1/chat", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const q = String(body.message || body.q || body.text || "").trim();
  const lang = normalizeLang(body.lang || c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(24, Math.max(1, Number(body.limit || 8)));
  const countryHeader = String(c.req.header("CF-IPCountry") || "").trim();
  const countryBody = String(body.country || c.req.query("country") || "").trim();
  const city = String(body.city || c.req.query("city") || "").trim();
  const latRaw = body.lat ?? body.latitude ?? c.req.query("lat");
  const lngRaw = body.lng ?? body.lon ?? body.longitude ?? c.req.query("lng");
  const lat = latRaw != null && latRaw !== "" ? Number(latRaw) : undefined;
  const lng = lngRaw != null && lngRaw !== "" ? Number(lngRaw) : undefined;
  // CF-IPCountry only as soft "near me" hint — never override explicit place/continent in the message.
  const out = await converse(c.env, q, lang, limit, {
    country: countryBody || undefined,
    city,
    lat,
    lng,
    geoCountryHint: countryHeader || undefined,
  });
  const products = out.found.products.map((p) => ({ ...p, url: absoluteUrl(p.path) }));
  const phone = String(body.whatsapp || body.phone || extractPhone(q) || "").trim();
  const cc = (out.advice.place.country || countryBody || countryHeader).toUpperCase();
  let ping: Awaited<ReturnType<typeof runWhatsAppPing>> | null = null;
  if (phone && /^[A-Z]{2}$/.test(cc)) {
    ping = await runWhatsAppPing(c.env, c.executionCtx, {
      country: cc,
      whatsapp: phone,
      sku: out.advice.sku || String(body.sku || ""),
      productName: String(body.productName || ""),
      source: "a2a-chat",
    });
  }
  let reply = out.reply;
  if (ping?.ok) {
    reply += ping.sent
      ? `\nWhatsApp ping sent to +${ping.e164}.`
      : `\nWhatsApp ready — tap: ${ping.waMe}`;
  }
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    lang,
    query: q,
    reply,
    products,
    solutions: out.found.solutions,
    office: out.advice.office,
    funding: out.advice.funding,
    apply: out.advice.apply,
    desk: out.advice.desk,
    whatsapp: { ...out.advice.whatsapp, pingResult: ping },
  });
});

app.get("/a2a/v1/office", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const hasGpsQuery = c.req.query("lat") != null || c.req.query("lng") != null;
  const country = (c.req.query("country") || (hasGpsQuery ? "" : c.req.header("CF-IPCountry") || "")).trim();
  const city = (c.req.query("city") || "").trim();
  const latRaw = c.req.query("lat");
  const lngRaw = c.req.query("lng") || c.req.query("lon");
  const lat = latRaw != null && latRaw !== "" ? Number(latRaw) : undefined;
  const lng = lngRaw != null && lngRaw !== "" ? Number(lngRaw) : undefined;
  const pack = await nearestOffice(c.env, { country, city, lat, lng });
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    lang,
    country: country.toUpperCase() || null,
    city: city || null,
    lat: Number.isFinite(lat as number) ? lat : null,
    lng: Number.isFinite(lng as number) ? lng : null,
    ...pack,
    apply: applyLinks(lang, { interest: "quote" }),
    whatsapp: whatsappOffer({ lang, officePhone: pack.office?.phone as string | undefined, country }),
  });
});

app.get("/a2a/v1/funding", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const funding = await fundingPrograms(c.env, lang);
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    lang,
    ...funding,
    apply: applyLinks(lang, { interest: "epc-f" }),
  });
});

app.get("/a2a/v1/desk", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const country = (c.req.query("country") || c.req.header("CF-IPCountry") || "").trim();
  const city = (c.req.query("city") || "").trim();
  const desk = deskPack(lang, country);
  const pack = await nearestOffice(c.env, country, city);
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    lang,
    country: country.toUpperCase() || null,
    city: city || null,
    desk,
    office: pack,
    apply: applyLinks(lang, { interest: desk.offset.interest || "g2g-nda" }),
    whatsapp: whatsappOffer({ lang, officePhone: pack.office?.phone, country }),
  });
});

app.get("/a2a/v1/apply", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sku = (c.req.query("sku") || "").trim();
  const need = (c.req.query("need") || "").trim();
  const interest = (c.req.query("interest") || "").trim();
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    lang,
    sku: sku || null,
    need: need || null,
    ...applyLinks(lang, { sku, need, interest }),
  });
});

app.post("/a2a/v1/whatsapp", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const country = String(body.country || c.req.query("country") || c.req.header("CF-IPCountry") || "").trim().toUpperCase();
  const ping = await runWhatsAppPing(c.env, c.executionCtx, {
    country,
    whatsapp: String(body.whatsapp || body.phone || ""),
    sku: String(body.sku || ""),
    productName: String(body.productName || body.product || ""),
    source: "a2a-whatsapp",
  });
  if (!ping.ok) return c.json({ protocol: "a2a", brand: "Circuitbull®", ...ping }, ping.error === "country_required" || ping.error === "invalid_whatsapp" ? 400 : 400);
  return c.json({ protocol: "a2a", brand: "Circuitbull®", ...ping }, ping.sent ? 201 : 202);
});

app.get("/a2a/v1/products", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const need = c.req.query("need");
  const limit = Math.min(200, Math.max(1, Number(c.req.query("limit") || 50)));
  let products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  if (need) products = products.filter((p) => (p.needSlugs || []).includes(need));
  const items = products.slice(0, limit).map((p) => a2aProduct(p, lang, productCopy(p, lang)));
  return c.json({
    protocol: "a2a",
    brand: "Circuitbull®",
    count: items.length,
    lang,
    products: items,
  });
});

app.get("/a2a/v1/solutions", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const needs = ((await kvJson<any[]>(c.env.DATA, "needs")) || []).filter((n) => n.catalog !== false);
  const items = needs.map((n) => a2aSolution(n, lang, solutionCopy(n, lang)));
  return c.json({ protocol: "a2a", brand: "Circuitbull®", count: items.length, lang, solutions: items });
});

app.get("/a2a/v1/solutions/:slug", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const raw = c.req.param("slug");
  const slug = canonicalizeSolutionSlug(raw) || raw;
  const need =
    (await kvJson<any>(c.env.DATA, `need:${slug}`)) ||
    ((await kvJson<any[]>(c.env.DATA, "needs")) || []).find((n) => n.slug === slug);
  if (!need) return c.json({ error: "not_found" }, 404);
  return c.json(a2aSolution(need, lang, solutionCopy(need, lang)));
});

app.get("/a2a/v1/pages", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const ui = pageCopy(lang);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const needs = ((await kvJson<any[]>(c.env.DATA, "needs")) || []).filter((n) => n.catalog !== false);
  const pages: any[] = [
    { type: "home", slug: "", title: ui.home.seoTitle, description: ui.home.seoDescription, url: absoluteUrl(homePath(lang)), canonical: absoluteUrl(homePath(lang)), hreflang: hreflangFor(homePath) },
    { type: "catalog", slug: "products", title: ui.catalog.seoTitle, description: ui.catalog.seoDescription, url: absoluteUrl(catalogPath(lang)), canonical: absoluteUrl(catalogPath(lang)), hreflang: hreflangFor(catalogPath) },
    { type: "solutions-index", slug: "solutions", title: ui.solutions.seoTitle, description: ui.solutions.seoDescription, url: absoluteUrl(solutionsIndexPath(lang)), canonical: absoluteUrl(solutionsIndexPath(lang)), hreflang: hreflangFor(solutionsIndexPath) },
    { type: "contact", slug: "contact", title: ui.contact.seoTitle, description: ui.contact.seoDescription, url: absoluteUrl(contactPath(lang)), canonical: absoluteUrl(contactPath(lang)), hreflang: hreflangFor(contactPath) },
    { type: "partners", slug: "partners", title: ui.partners.seoTitle, description: ui.partners.seoDescription, url: absoluteUrl(partnersPath(lang)), canonical: absoluteUrl(partnersPath(lang)), hreflang: hreflangFor(partnersPath) },
    { type: "invest", slug: "invest", title: ui.investSeo.pageTitle, description: ui.investSeo.pageDescription, url: absoluteUrl(investPath(lang)), canonical: absoluteUrl(investPath(lang)), hreflang: hreflangFor(investPath) },
    ...LEGAL_SLUGS.map((slug) => {
      const doc = legalDoc(slug, lang);
      return {
        type: "legal",
        slug,
        title: doc?.seoTitle || slug,
        description: doc?.seoDescription || "",
        url: absoluteUrl(legalPath(lang, slug)),
        canonical: absoluteUrl(legalPath(lang, slug)),
        hreflang: hreflangFor((l) => legalPath(l, slug)),
      };
    }),
  ];
  for (const n of needs) {
    const copy = solutionCopy(n, lang);
    const seo = solutionSeo(n, copy, lang);
    pages.push({ type: "solution", slug: n.slug, title: seo.title, description: seo.description, url: seo.canonical, canonical: seo.canonical, hreflang: seo.hreflang });
    for (const cap of listCapabilities(n.slug)) {
      const capCopy = capabilityCopy(cap, lang);
      const overlay = copy.caps?.[cap.slug] || {};
      const merged = { ...capCopy, title: overlay.title || capCopy.title, lead: overlay.lead || capCopy.lead, seoTitle: overlay.seoTitle, seoDescription: overlay.seoDescription };
      const capMeta = capabilitySeo(n.slug, cap.slug, merged, copy.title, lang);
      pages.push({ type: "capability", slug: `${n.slug}/${cap.slug}`, title: capMeta.title, description: capMeta.description, url: capMeta.canonical, canonical: capMeta.canonical, hreflang: capMeta.hreflang });
    }
  }
  for (const p of products) {
    const copy = productCopy(p, lang);
    const seo = productSeo(p, copy, lang);
    pages.push({ type: "product", slug: p.slug, sku: displaySku(p), title: seo.title, description: seo.description, url: seo.canonical, canonical: seo.canonical, hreflang: seo.hreflang });
  }
  return c.json({ protocol: "a2a", brand: "Circuitbull®", lang, count: pages.length, pages });
});

app.get("/a2a/v1/products/:slug", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === c.req.param("slug"));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json(a2aProduct(p, lang, productCopy(p, lang)));
});

app.get("/a2a/v1/smartid/:smartId", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("smartId");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json(a2aProduct(p, lang, productCopy(p, lang)));
});

app.get("/a2a/v1/sku/:sku", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("sku");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json(a2aProduct(p, lang, productCopy(p, lang)));
});

app.post("/a2a/v1/echo", async (c) => {
  const secret = c.env.A2A_SHARED_SECRET;
  const hdr = c.req.header("X-A2A-Secret") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && hdr !== secret) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  return c.json({ ok: true, echo: body });
});

app.get("/a2a/v1/smartid/:smartId/facts", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("smartId");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  const facts = (p.facts || []).map((f: any) => localizeFact(f, lang));
  return c.json({
    sku: displaySku(p),
    smartId: displaySku(p),
    slug: p.slug,
    lang,
    count: facts.length,
    groups: groupFactsForDisplay(p.facts || [], lang),
    facts,
  });
});

app.get("/a2a/v1/sku/:sku/facts", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("sku");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  const facts = (p.facts || []).map((f: any) => localizeFact(f, lang));
  return c.json({
    sku: displaySku(p),
    smartId: displaySku(p),
    slug: p.slug,
    lang,
    count: facts.length,
    groups: groupFactsForDisplay(p.facts || [], lang),
    facts,
  });
});

app.get("/a2a/v1/facts/search", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || 15)));
  if (!q) return c.json({ error: "q_required" }, 400);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const semantic = await searchFactsSemantic(c.env, q, lang, limit);
  const hits = semantic.length ? semantic : searchFactsLocal(products, q, lang, limit);
  return c.json({ q, lang, mode: semantic.length ? "qdrant" : "local", count: hits.length, hits });
});

async function searchFactsSemantic(env: Env, q: string, lang: string, limit: number) {
  return searchFactHits(env, q, lang, limit);
}

const CDN_TYPES: Record<string, string> = {
  ico: "image/x-icon",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  html: "text/html; charset=utf-8",
};

app.get("/cdn/*", async (c) => {
  let key = c.req.path.replace(/^\/cdn\//, "");
  try {
    key = decodeURIComponent(key);
  } catch {
    /* keep raw */
  }
  if (!key || key.includes("..")) return c.notFound();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || CDN_TYPES[ext] || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
});

app.get("/favicon.ico", () => new Response(FAVICON_ICO, { headers: BRAND_HEADERS.ico }));
app.get("/favicon.svg", () => new Response(MARK_SVG, { headers: BRAND_HEADERS.svg }));
app.get("/apple-touch-icon.png", () => new Response(APPLE_TOUCH_PNG, { headers: BRAND_HEADERS.png }));
app.get("/brand/mark.svg", () => new Response(MARK_SVG, { headers: BRAND_HEADERS.svg }));
app.get("/brand/logo.svg", () => new Response(LOGO_SVG, { headers: BRAND_HEADERS.svg }));
app.get("/brand/logo-on-dark.svg", () => new Response(LOGO_ON_DARK_SVG, { headers: BRAND_HEADERS.svg }));
app.get("/brand/favicon.ico", () => new Response(FAVICON_ICO, { headers: BRAND_HEADERS.ico }));

app.get("/api/v1/company", async (c) => {
  const lang = c.req.query("lang") || "en";
  const org = await kvJson<any>(c.env.DATA, "company");
  if (!org) return c.json({ error: "not_seeded" }, 404);
  return c.json({
    legalName: org.legalName,
    brand: org.brand,
    phone: org.phone,
    email: org.email,
    address: org.address,
    copy: org.i18n?.[lang] || org.i18n?.en,
  });
});

app.get("/api/v1/partners", async (c) => {
  const { partners: all, source } = await loadPartners(c.env);
  const country = (c.req.query("country") || "").trim().toUpperCase();
  const city = (c.req.query("city") || "").trim();
  const role = c.req.query("role");
  let partners = all;
  let hqFallback = false;
  if (country) {
    const market = partnersForMarket(all, country, city);
    partners = market.partners;
    hqFallback = market.hqFallback;
  } else if (city) {
    const needle = city.toLowerCase();
    partners = all.filter((p) => String(p.city || p.address?.city || "").toLowerCase() === needle);
  }
  if (role) partners = partners.filter((p) => p.role === role);
  return c.json({ count: partners.length, hqFallback, source, partners });
});

app.get("/api/v1/investments", async (c) => {
  const lang = c.req.query("lang") || "en";
  const items = (await kvJson<any[]>(c.env.DATA, "investments")) || [];
  return c.json({
    count: items.length,
    investments: items.map((i) => ({
      slug: i.slug,
      status: i.status,
      liquidity: i.liquidity,
      customerTypes: i.customerTypes,
      sectors: i.sectors,
      needSlugs: i.needSlugs,
      ownStack: i.ownStack,
      copy: i.i18n?.[lang] || i.i18n?.en,
    })),
  });
});

app.get("/api/v1/products", async (c) => {
  const need = c.req.query("need");
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  let products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  if (need) products = products.filter((p) => (p.needSlugs || []).includes(need));
  const mapped = products.map((p) => {
    const copy = productCopy(p, lang);
    return {
      ...p,
      smartId: displaySku(p),
      sku: displaySku(p),
      name: copy.name,
      summary: copy.summary,
      description: copy.description,
      benefits: copy.benefits,
      overview: copy.overview,
      applications: copy.applications,
      specs: copy.specs,
      locale: lang,
      translated: copy.translated,
      path: productPath(lang, p.slug),
    };
  });
  return c.json({ count: mapped.length, lang, products: mapped });
});

app.get("/api/v1/products/:slug", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === c.req.param("slug"));
  if (!p) return c.json({ error: "not_found" }, 404);
  const copy = productCopy(p, lang);
  return c.json({
    ...p,
    name: copy.name,
    summary: copy.summary,
    description: copy.description,
    benefits: copy.benefits,
    overview: copy.overview,
    applications: copy.applications,
    specs: copy.specs,
    facts: (p.facts || []).map((f: any) => localizeFact(f, lang)),
    factGroups: groupFactsForDisplay(p.facts || [], lang),
    locale: lang,
    translated: copy.translated,
    path: productPath(lang, p.slug),
  });
});

app.get("/api/v1/products/:slug/facts", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === c.req.param("slug"));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json({
    slug: p.slug,
    sku: displaySku(p),
    smartId: displaySku(p),
    lang,
    count: (p.facts || []).length,
    groups: groupFactsForDisplay(p.facts || [], lang),
    facts: (p.facts || []).map((f: any) => localizeFact(f, lang)),
  });
});

app.get("/api/v1/facts/search", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || 15)));
  if (!q) return c.json({ error: "q_required" }, 400);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const semantic = await searchFactsSemantic(c.env, q, lang, limit);
  const hits = semantic.length ? semantic : searchFactsLocal(products, q, lang, limit);
  return c.json({ q, lang, mode: semantic.length ? "qdrant" : "local", count: hits.length, hits });
});

function parseOptNumber(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function skuMatchesProduct(p: any, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toUpperCase().replace(/^CB-/, "CB-");
  const candidates = [p.sku, p.smartId, p.skuPrevious, p.smartIdPrevious]
    .filter(Boolean)
    .map((x: string) => String(x).toUpperCase());
  if (candidates.some((c) => c === n || c.replace(/^SMARTID-\d{4}-/, "CB-") === n.replace(/^CB-/, "CB-"))) return true;
  // bare sequence: 000040 or 40
  const seq = n.replace(/^CB-/, "").replace(/^SMARTID-\d{4}-/, "");
  return candidates.some((c) => c.endsWith(seq) || c.replace(/\D/g, "").endsWith(seq.replace(/\D/g, "")));
}

/** Unified search: mode=semantic|logical|hybrid (+ optional numeric min/max on facts) */
app.get("/api/v1/search", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const mode = (c.req.query("mode") || "hybrid").toLowerCase();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") || 20)));
  const propertyId = c.req.query("propertyId") || "";
  const groupId = c.req.query("groupId") || "";
  const groupKey = c.req.query("group") || c.req.query("groupKey") || "";
  const value = (c.req.query("value") || "").trim();
  const propertyKey = (c.req.query("property") || c.req.query("propertyKey") || "").trim();
  const skuQ = (c.req.query("sku") || c.req.query("smartId") || "").trim();
  const rangeMin = parseOptNumber(c.req.query("min"));
  const rangeMax = parseOptNumber(c.req.query("max"));
  const hasRange = rangeMin != null || rangeMax != null;

  const need = (c.req.query("need") || "").trim();
  let products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  if (need) products = products.filter((p) => (p.needSlugs || []).includes(need));

  const logicalFilter = (hits: any[]) => {
    return hits.filter((h) => {
      const f = h.fact || h;
      if (skuQ && !skuMatchesProduct({ smartId: h.smartId || h.sku, sku: h.sku || h.smartId }, skuQ) && !skuMatchesProduct(h, skuQ))
        return false;
      if (propertyId && f.propertyId !== propertyId) return false;
      if (groupId && f.groupId !== groupId) return false;
      if (groupKey && f.groupKey !== groupKey) return false;
      if (propertyKey && !(f.propertyKey || "").includes(propertyKey) && !(f.label || "").toLowerCase().includes(propertyKey.toLowerCase()))
        return false;
      if (value) {
        const vv = String(f.value || "").toLowerCase();
        if (!vv.includes(value.toLowerCase())) return false;
      }
      if (hasRange && !factMatchesRange(String(f.value || ""), rangeMin, rangeMax)) return false;
      return true;
    });
  };

  const logicalScan = () => {
    const hits: any[] = [];
    for (const p of products) {
      if (skuQ && !skuMatchesProduct(p, skuQ)) continue;
      for (const raw of p.facts || []) {
        const f = localizeFact(raw, lang);
        const row = {
          score: 1,
          smartId: p.smartId,
          sku: displaySku(p),
          slug: p.slug,
          productName: p.name,
          fact: f,
        };
        if (!logicalFilter([row]).length) continue;
        if (q) {
          const hay = `${f.groupLabel} ${f.label} ${f.value} ${displaySku(p)}`.toLowerCase();
          if (!hay.includes(q.toLowerCase()) && !q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) continue;
        }
        hits.push(row);
        if (hits.length >= limit * 3) return hits;
      }
    }
    return hits;
  };

  let hits: any[] = [];
  let resolvedMode = mode;
  const hasStructured = !!(propertyId || groupId || groupKey || value || propertyKey || skuQ || hasRange);

  if (mode === "logical") {
    hits = logicalScan();
  } else if (mode === "semantic") {
    if (!q) return c.json({ error: "q_required_for_semantic" }, 400);
    const semantic = await searchFactsSemantic(c.env, q, lang, limit);
    hits = semantic.length ? semantic : searchFactsLocal(products, q, lang, limit);
    resolvedMode = semantic.length ? "semantic" : "semantic_fallback_local";
    if (hasStructured) hits = logicalFilter(hits);
  } else {
    if (q) {
      const semantic = await searchFactsSemantic(c.env, q, lang, Math.max(limit, 40));
      hits = semantic.length ? semantic : searchFactsLocal(products, q, lang, Math.max(limit, 40));
      resolvedMode = semantic.length ? "hybrid_semantic" : "hybrid_local";
    } else {
      hits = logicalScan();
      resolvedMode = "hybrid_logical_only";
    }
    if (hasStructured) {
      const filtered = logicalFilter(hits);
      if (filtered.length) {
        hits = filtered;
      } else {
        hits = logicalScan();
        resolvedMode = `${resolvedMode}_logical_fallback`;
      }
    }
    hits = hits.slice(0, limit);
  }

  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const productsOut: any[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    const slug = h.slug;
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const p = productBySlug.get(slug);
    if (!p) continue;
    const copy = productCopy(p, lang);
    productsOut.push({
      slug: p.slug,
      smartId: displaySku(p),
      sku: displaySku(p),
      name: copy.name,
      summary: copy.summary,
      image: p.image ? cdnUrl(p.image) : "",
      path: productPath(lang, p.slug),
      matchedFact: h.fact || null,
      score: h.score,
    });
  }

  return c.json({
    q: q || null,
    mode: resolvedMode,
    lang,
    filters: {
      propertyId: propertyId || null,
      groupId: groupId || null,
      groupKey: groupKey || null,
      propertyKey: propertyKey || null,
      value: value || null,
      sku: skuQ || null,
      min: rangeMin,
      max: rangeMax,
    },
    count: hits.length,
    hits,
    products: productsOut,
    productCount: productsOut.length,
  });
});

/** Compact platform index from Redis (KV fallback). Prefetch for Ctrl+K. */
app.get("/api/v1/platforms/index", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const { index, source } = await loadPlatformIndex(c.env, lang);
  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return c.json({
    lang: index.lang,
    source,
    builtAt: index.builtAt,
    count: index.count,
    items: index.items,
  });
});

/** Fast typeahead — Redis catalog, no Qdrant round-trip. */
app.get("/api/v1/platforms/search", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(48, Math.max(1, Number(c.req.query("limit") || 12)));
  const { index, source } = await loadPlatformIndex(c.env, lang);
  const hits = filterPlatforms(index.items, q, limit).map(publicPlatformCard);
  c.header("Cache-Control", q ? "public, max-age=15" : "public, max-age=30");
  return c.json({
    q: q || null,
    lang,
    source,
    count: hits.length,
    products: hits,
  });
});

app.get("/api/v1/similar", async (c) => {
  const q = (c.req.query("q") || "").trim();
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const limit = Math.min(12, Math.max(1, Number(c.req.query("limit") || 8)));
  const exclude = (c.req.query("exclude") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!q) return c.json({ error: "q_required" }, 400);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const rec = await recommendSimilarProducts(c.env, { query: q, lang, products, excludeSlugs: exclude, limit });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const out = rec.slugs
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .map((p) => {
      const copy = productCopy(p, lang);
      return {
        slug: p.slug,
        sku: displaySku(p),
        smartId: displaySku(p),
        name: copy.name,
        summary: copy.summary,
        image: p.image ? cdnUrl(p.image) : "",
        path: productPath(lang, p.slug),
      };
    });
  return c.json({ q, lang, mode: rec.mode, count: out.length, products: out });
});

/** Ontology facet index for Products smart filter (SpecGroups / properties / values). */
app.get("/api/v1/facets", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const need = (c.req.query("need") || "").trim();
  if (need) {
    const cacheKey = `product.facets:${lang}:${need}`;
    const cachedNeed = await kvJson<any>(c.env.DATA, cacheKey);
    if (cachedNeed?.groups?.length) {
      return c.json({ ...cachedNeed, source: "kv" });
    }
    const all = (await kvJson<any[]>(c.env.DATA, "products")) || [];
    const scoped = all.filter((p) => (p.needSlugs || []).includes(need));
    const facets = buildFacetIndex(scoped, lang);
    try {
      await c.env.DATA.put(cacheKey, JSON.stringify(facets), { expirationTtl: 60 * 60 * 6 });
    } catch {
      /* kv write optional */
    }
    return c.json({ ...facets, source: "computed" });
  }
  const cached = await kvJson<any>(c.env.DATA, `product.facets:${lang}`);
  if (cached?.groups?.length) {
    return c.json({ ...cached, source: "kv" });
  }
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const facets = buildFacetIndex(products, lang);
  try {
    await c.env.DATA.put(`product.facets:${lang}`, JSON.stringify(facets), { expirationTtl: 60 * 60 * 6 });
  } catch {
    /* kv write optional */
  }
  return c.json({ ...facets, source: "computed" });
});

app.get("/api/v1/smartid/:smartId/facts", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("smartId");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json({
    sku: displaySku(p),
    smartId: displaySku(p),
    slug: p.slug,
    lang,
    groups: groupFactsForDisplay(p.facts || [], lang),
    facts: (p.facts || []).map((f: any) => localizeFact(f, lang)),
  });
});

app.get("/api/v1/sku/:sku/facts", async (c) => {
  const lang = normalizeLang(c.req.query("lang") || DEFAULT_LANG);
  const sid = c.req.param("sku");
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => skuMatchesProduct(x, sid));
  if (!p) return c.json({ error: "not_found" }, 404);
  return c.json({
    sku: displaySku(p),
    smartId: displaySku(p),
    slug: p.slug,
    lang,
    groups: groupFactsForDisplay(p.facts || [], lang),
    facts: (p.facts || []).map((f: any) => localizeFact(f, lang)),
  });
});

app.get("/api/v1/locales", (c) =>
  c.json({
    default: DEFAULT_LANG,
    locales: SITE_LOCALES,
    countryToLang: COUNTRY_TO_LANG,
    countryToLangs: COUNTRY_TO_LANGS,
    countries: SELECTOR_COUNTRIES,
  })
);

app.get("/api/v1/sku-pool", async (c) => {
  const pool = (await kvJson<any>(c.env.DATA, "sku_pool")) || {
    format: "Cb-{NNNNNN}",
    counter: 0,
    counts: { assigned: 0, available: 0, products: 0 },
    recent: [],
  };
  return c.json(pool);
});

app.get("/sku-pool", (c) => c.notFound());

type LeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  country?: string;
  city?: string;
  interest?: string;
  message?: string;
  source?: string;
  product?: string;
  sku?: string;
  productName?: string;
  inSector?: string;
  hasCompany?: string;
};

const INTEREST_OPTIONS: { value: string; label: string }[] = [
  { value: "border-control", label: "Border Control" },
  { value: "airport-security", label: "Airport Security" },
  { value: "solar", label: "Solar Energy Management" },
  { value: "carbon", label: "Carbon Live Monitoring" },
  { value: "iot-scada", label: "IoT / SCADA" },
  { value: "catalog", label: "Product Catalog / Quote" },
  { value: "investment", label: "Project Investment / EPC+F" },
  { value: "epc-f", label: "EPC+F Financing" },
  { value: "g2g", label: "G2G Direct Briefing" },
  { value: "g2g-nda", label: "Ministry NDA session" },
  { value: "offset-commodity", label: "Resource / commodity-backed offset" },
  { value: "offset-oil", label: "Oil-backed offset (e.g. Iraq)" },
  { value: "offset-gold", label: "Gold / mineral-backed offset (e.g. Africa)" },
  { value: "authorized-seller", label: "Authorized seller / distributor" },
  { value: "other", label: "Other" },
];

function quoteContactHref(lang: string, p: { slug: string; sku?: string; smartId?: string; model?: string }) {
  const params = new URLSearchParams();
  params.set("interest", "catalog");
  params.set("product", p.slug);
  const sku = displaySku(p);
  if (sku && sku !== "SKU") params.set("sku", sku);
  return `${contactPath(lang)}?${params.toString()}`;
}

function leadId() {
  return `lead_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

async function saveLead(kv: KVNamespace, lead: Record<string, unknown>) {
  const key = `crm:lead:${lead.id}`;
  await kv.put(key, JSON.stringify(lead));
  const index = (await kvJson<string[]>(kv, "crm:leads:index")) || [];
  index.unshift(String(lead.id));
  await kv.put("crm:leads:index", JSON.stringify(index.slice(0, 500)));
}

async function notifyNewLead(env: Env, lead: Record<string, unknown>) {
  if (!env.SES_USER || !env.SES_PASS || !env.SES_HOST) {
    throw new Error("SES is not configured");
  }
  const to = env.SES_NOTIFY_TO || "volkan@volls.us";
  const from = env.SES_FROM || to;
  const text = [
    "New CRM request — Circuitbull®",
    "",
    `Lead ID: ${lead.id}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "—"}`,
    `WhatsApp: ${lead.whatsapp ? `+${lead.whatsapp}` : "—"}`,
    lead.waMe ? `Open WhatsApp: ${lead.waMe}` : "",
    lead.source === "buy-whatsapp" ? `Ping: ${lead.waSent ? "sent to customer" : "queued — tap Open WhatsApp"}` : "",
    `Company: ${lead.company || "—"}`,
    `Country: ${lead.country || "—"}`,
    `City: ${lead.city || "—"}`,
    `Interest: ${lead.interest || "—"}`,
    lead.inSector ? `In sector: ${lead.inSector}` : "",
    lead.hasCompany ? `Has company: ${lead.hasCompany}` : "",
    `Product: ${lead.productName || lead.product || "—"}`,
    `SKU: ${lead.sku || "—"}`,
    `Source: ${lead.source || "contact"}`,
    `Created: ${lead.createdAt}`,
    "",
    "Message:",
    String(lead.message || "—"),
    "",
    "— Circuitbull CRM",
  ].join("\n");

  await sendSmtpMail(
    {
      host: env.SES_HOST,
      port: Number(env.SES_PORT || 465),
      user: env.SES_USER,
      pass: env.SES_PASS,
      from,
    },
    {
      to,
      replyTo: String(lead.email || "").includes("@leads.circuitbull.com") ? from : String(lead.email || ""),
      subject: `[Circuitbull CRM] ${
        lead.source === "buy-whatsapp"
          ? "Buy WhatsApp ping"
          : lead.source === "authorized-seller"
            ? "Authorized seller application"
            : "New request"
      } — ${lead.name || lead.email}`,
      text,
    }
  );
}

app.post("/api/v1/leads", async (c) => {
  let body: LeadInput = {};
  const ct = c.req.header("content-type") || "";
  try {
    if (ct.includes("application/json")) body = await c.req.json();
    else {
      const fd = await c.req.formData();
      body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])) as LeadInput;
    }
  } catch {
    return c.json({ error: "invalid_body" }, 400);
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const inSector = (body.inSector || "").trim();
  const hasCompany = (body.hasCompany || "").trim();
  let message = (body.message || "").trim();
  if (inSector || hasCompany) {
    const qualify = [`inSector: ${inSector || "—"}`, `hasCompany: ${hasCompany || "—"}`].join("\n");
    message = message ? `${qualify}\n\n${message}` : qualify;
  }
  if (!name || !email || !message) {
    return c.json({ error: "name_email_message_required" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "invalid_email" }, 400);
  }

  const lead = {
    id: leadId(),
    type: "lead",
    status: "new",
    name,
    email,
    phone: (body.phone || "").trim(),
    company: (body.company || "").trim(),
    country: (body.country || "").trim(),
    city: (body.city || "").trim(),
    interest: (body.interest || "").trim(),
    product: (body.product || "").trim(),
    sku: (body.sku || "").trim(),
    productName: (body.productName || "").trim(),
    message,
    inSector,
    hasCompany,
    source: (body.source || "contact").trim(),
    createdAt: new Date().toISOString(),
  };

  await saveLead(c.env.DATA, lead);

  let emailed = false;
  let emailError: string | null = null;
  try {
    await notifyNewLead(c.env, lead);
    emailed = true;
  } catch (e: any) {
    emailError = e?.message || String(e);
    console.error("SES notify failed", emailError);
  }

  const wantsHtml = (c.req.header("accept") || "").includes("text/html");
  if (wantsHtml) {
    const back = contactPath(DEFAULT_LANG);
    return c.redirect(emailed || !emailError ? `${back}?sent=1` : `${back}?error=1`, 303);
  }
  return c.json({ ok: true, id: lead.id, emailed, emailError }, emailed ? 201 : 202);
});

async function runWhatsAppPing(
  env: Env,
  executionCtx: ExecutionContext | undefined,
  input: { country: string; whatsapp: string; sku?: string; productName?: string; source?: string }
): Promise<{
  ok: boolean;
  error?: string;
  e164?: string;
  sent?: boolean;
  waMe?: string;
  seller?: string;
  hqFallback?: boolean;
  text?: string;
}> {
  const country = String(input.country || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return { ok: false, error: "country_required" };
  const e164 = normalizeWhatsApp(country, input.whatsapp);
  if (!e164) return { ok: false, error: "invalid_whatsapp" };

  const sku = String(input.sku || "").trim();
  const productName = String(input.productName || "").trim() || sku || "platform";
  const { partners } = await loadPartners(env);
  const channel = buyChannelForCountry(partners, country);
  const composed = await composeBuyWhatsApp(env, {
    country,
    countryName: channel.seller.countryName,
    sku: sku || "SKU",
    productName,
    sellerName: channel.seller.name,
    sellerCity: channel.seller.city,
    hqFallback: channel.hqFallback,
  });
  const waSettings = await loadWhatsAppSettings(env.DATA, env);
  const ping = await sendWhatsAppCloud(waSettings, e164, composed.text);
  const waMe = customerWaMe(e164, composed.text);

  const lead = {
    id: leadId(),
    type: "lead",
    status: ping.sent ? "pinged" : "new",
    name: `WhatsApp +${e164}`,
    email: `wa.${e164}@leads.circuitbull.com`,
    phone: `+${e164}`,
    whatsapp: e164,
    company: "",
    country,
    city: channel.seller.city || "",
    interest: "catalog",
    product: "",
    sku,
    productName,
    message: composed.text,
    source: input.source || "buy-whatsapp",
    seller: channel.seller.name,
    hqFallback: channel.hqFallback,
    waSent: ping.sent,
    waChannel: ping.channel,
    waMe,
    agentSource: composed.source,
    createdAt: new Date().toISOString(),
  };

  await saveLead(env.DATA, lead);
  const notify = notifyNewLead(env, lead).catch((e: any) => {
    console.error("SES buy-whatsapp failed", e?.message || String(e));
  });
  try {
    if (executionCtx) executionCtx.waitUntil(notify);
    else await notify;
  } catch {
    await notify;
  }

  return {
    ok: true,
    e164,
    sent: ping.sent,
    waMe,
    seller: channel.seller.name,
    hqFallback: channel.hqFallback,
    text: composed.text,
  };
}

app.post("/api/v1/buy/whatsapp", async (c) => {
  let body: LeadInput = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_body" }, 400);
  }
  const ping = await runWhatsAppPing(c.env, c.executionCtx, {
    country: String(body.country || ""),
    whatsapp: String(body.whatsapp || body.phone || ""),
    sku: String(body.sku || ""),
    productName: String(body.productName || body.product || ""),
    source: "buy-whatsapp",
  });
  if (!ping.ok) return c.json({ error: ping.error }, 400);
  return c.json(
    {
      ok: true,
      pinged: true,
      e164: ping.e164,
      seller: ping.seller,
      hqFallback: ping.hqFallback,
      waMe: ping.waMe,
      sent: ping.sent,
    },
    ping.sent ? 201 : 202
  );
});

app.get("/api/v1/leads", async (c) => {
  const index = (await kvJson<string[]>(c.env.DATA, "crm:leads:index")) || [];
  const leads = [];
  for (const id of index.slice(0, 50)) {
    const lead = await kvJson(c.env.DATA, `crm:lead:${id}`);
    if (lead) leads.push(lead);
  }
  return c.json({ count: leads.length, leads });
});

async function renderLegal(c: any, lang: string, slug: string) {
  const doc = legalDoc(slug, lang);
  if (!doc) return c.notFound();
  const path = legalPath(lang, slug);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  const switcher = legalNav(lang)
    .map((item) => {
      const current = item.slug === doc.slug ? ` aria-current="page"` : "";
      return `<a href="${item.href}"${current}>${escapeHtml(item.label)}</a>`;
    })
    .join("");
  const sections = doc.sections
    .map(
      (sec) => `<h2>${escapeHtml(sec.heading)}</h2>${sec.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}`
    )
    .join("");
  const body = `
<section class="section section-flush">
  <div class="wrap legal-doc">
    <p class="kicker">${escapeHtml(legalKicker(lang))}</p>
    <h1 class="page-title">${escapeHtml(doc.title)}</h1>
    <p class="legal-updated">${escapeHtml(doc.updated)}</p>
    <p class="page-lead">${escapeHtml(doc.lead)}</p>
    <nav class="legal-switch" aria-label="${escapeHtml(legalKicker(lang))}">${switcher}</nav>
    ${sections}
  </div>
</section>`;
  return c.html(
    layout({
      title: doc.seoTitle,
      description: clipMeta(doc.seoDescription),
      canonical: absoluteUrl(path),
      lang,
      country,
      hreflang: hreflangFor((l) => legalPath(l, slug)),
      localeSwitchPath: `/{lang}/${slug}`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: doc.title,
        description: doc.seoDescription,
        dateModified: "2026-09-22",
        url: absoluteUrl(path),
        isPartOf: { "@type": "WebSite", name: "Circuitbull®", url: "https://circuitbull.com/" },
        publisher: { "@type": "Organization", name: "Circuitbull®", legalName: "Volls Global Inc" },
      },
      body,
    })
  );
}

for (const slug of LEGAL_SLUGS) {
  app.get(`/${slug}`, (c) => renderLegal(c, DEFAULT_LANG, slug));
  app.get(`/:lang/${slug}`, async (c) => {
    const lang = c.req.param("lang");
    if (!isLocaleParam(lang)) return c.notFound();
    return renderLegal(c, normalizeLang(lang), slug);
  });
}

app.get("/contact", async (c) => renderContact(c, DEFAULT_LANG));
app.get("/:lang/contact", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderContact(c, normalizeLang(lang));
});

async function renderContact(c: any, lang: string) {
  const ui = pageCopy(lang).contact;
  const q = c.req.query("sent");
  const err = c.req.query("error");
  const banner = q
    ? `<div class="form-ok">${escapeHtml(ui.sent)}</div>`
    : err
      ? `<div class="form-err">${escapeHtml(ui.sendError)}</div>`
      : "";

  const countryQ = (c.req.query("country") || "").trim().toUpperCase();
  const productQ = (c.req.query("product") || c.req.query("slug") || "").trim();
  const skuQ = (c.req.query("sku") || "").trim();
  let interestQ = (c.req.query("interest") || "").trim();

  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  let selected =
    (productQ && products.find((x) => x.slug === productQ)) ||
    (skuQ && products.find((x) => skuMatchesProduct(x, skuQ))) ||
    null;

  const selectedSku = selected ? displaySku(selected) : skuQ;
  const selectedSlug = selected ? selected.slug : productQ;
  const selectedName = selected ? productCopy(selected, lang).name || selectedSlug : productQ;
  const hasProduct = !!(selectedSku || selectedSlug);

  if (hasProduct && !interestQ) interestQ = "catalog";
  const interestList = pageCopy(lang).interests;
  if (interestQ && !interestList.some((o) => o.value === interestQ)) {
    // allow need-slug interests from solution CTAs
  }

  const interestOptions = interestList.map((o) => {
    const sel = o.value === interestQ ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  const interestExtra =
    interestQ && !interestList.some((o) => o.value === interestQ)
      ? `<option value="${escapeHtml(interestQ)}" selected>${escapeHtml(interestQ)}</option>`
      : "";

  const productBlock = hasProduct
    ? `<div class="quote-product-chip" role="status" aria-live="polite">
        <span class="quote-product-sku">${escapeHtml(selectedSku || "SKU")}</span>
        <span class="quote-product-name">${escapeHtml(selectedName || selectedSlug)}</span>
      </div>
      <input type="hidden" name="product" value="${escapeHtml(selectedSlug)}"/>
      <input type="hidden" name="sku" value="${escapeHtml(selectedSku)}"/>
      <input type="hidden" name="productName" value="${escapeHtml(selectedName || "")}"/>`
    : "";

  const contactHref = contactPath(lang);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  const diplomatic =
    interestQ === "g2g" ||
    interestQ === "epc-f" ||
    interestQ === "investment" ||
    interestQ === "g2g-nda" ||
    interestQ === "offset-commodity" ||
    interestQ === "offset-oil" ||
    interestQ === "offset-gold";

  const mapsQuery = "1207 Delaware Ave #5352, Wilmington, DE 19806";
  const mapsEmbed =
    "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s1207+Delaware+Ave+%235352,+Wilmington,+DE+19806!6i16!3m1!1sen!5m1!1sen";
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  const body = `
<section class="section section-flush">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${diplomatic ? escapeHtml(ui.diplomaticKicker) : escapeHtml(ui.kicker)}</p>
      <h2>${diplomatic ? escapeHtml(ui.diplomaticTitle) : escapeHtml(ui.title)}</h2>
      <p>${escapeHtml(diplomatic ? ui.diplomaticLead : ui.lead)}</p>
    </div>
    ${banner}
    <div class="contact-layout" style="margin-top:1.5rem">
    <form class="form-grid" method="post" action="/api/v1/leads" id="contact-form" data-contact="${escapeHtml(contactHref)}">
      <input type="hidden" name="source" value="${diplomatic ? "invest" : "contact"}"/>
      ${productBlock}
      <div class="row2">
        <label>${escapeHtml(ui.name)}<input name="name" required autocomplete="name" placeholder="${escapeHtml(ui.placeholderName)}"/></label>
        <label>${escapeHtml(ui.email)}<input name="email" type="email" required autocomplete="email" placeholder="${escapeHtml(ui.placeholderEmail)}"/></label>
      </div>
      <div class="row2">
        <label>${escapeHtml(ui.phone)}<input name="phone" autocomplete="tel" placeholder="+1 …"/></label>
        <label>${escapeHtml(ui.company)}<input name="company" autocomplete="organization"/></label>
      </div>
      <div class="row2">
        <label>${escapeHtml(ui.country)}<input name="country" value="${escapeHtml(countryQ)}" autocomplete="country-name" placeholder="US / TR / …"/></label>
        <label>${escapeHtml(ui.interest)}
          <select name="interest" id="contact-interest">
            ${interestExtra}${interestOptions}
          </select>
        </label>
      </div>
      <label>${escapeHtml(ui.message)}<textarea name="message" rows="6" required placeholder="${escapeHtml(
        diplomatic ? ui.placeholderDiplomatic : ui.placeholderMessage
      )}"></textarea></label>
      <div class="cta-row">
        <button class="btn btn-primary" type="submit">${escapeHtml(ui.submit)}</button>
        <a class="btn btn-ghost" href="${CALL_SWITCHBOARD_URL}">${escapeHtml(pageCopy(lang).nav.callNow)}</a>
        <a class="btn btn-ghost" href="${partnersPath(lang)}#find">${escapeHtml(ui.findSeller)}</a>
      </div>
      <p class="form-note">Volls Global Inc · Wilmington, DE · Circuitbull®</p>
    </form>
    <aside class="contact-map-panel" aria-label="Headquarters location">
      <div class="contact-map hud-corners">
        <iframe
          src="${mapsEmbed}"
          title="Map of Volls Global Inc at 1207 Delaware Ave #5352, Wilmington, DE 19806"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      </div>
      <div class="contact-hq">
        <p class="kicker">${escapeHtml(ui.hq)}</p>
        <address>
          Volls Global Inc<br/>
          1207 Delaware Ave #5352<br/>
          Wilmington, DE 19806<br/>
          United States of America
        </address>
        <p>Circuitbull® · Wilmington, DE</p>
        <div class="cta-row">
          <a class="btn btn-ghost" href="${CALL_SWITCHBOARD_URL}">${escapeHtml(pageCopy(lang).nav.callNow)}</a>
          <a class="btn btn-ghost" href="${mapsLink}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui.maps)}</a>
          <a class="btn btn-ghost" href="mailto:info@circuitbull.com">info@circuitbull.com</a>
        </div>
      </div>
    </aside>
    </div>
  </div>
</section>
<script>
(function(){
  var form = document.getElementById('contact-form');
  if(!form) return;
  // Keep URL-driven interest + product fields; do not reset on load.
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    if(btn){ btn.disabled = true; btn.textContent = ${JSON.stringify(ui.sending)}; }
    var base = form.getAttribute('data-contact') || '/contact';
    try {
      var fd = new FormData(form);
      var res = await fetch('/api/v1/leads', { method:'POST', body: fd });
      var data = await res.json();
      if(!res.ok) throw new Error(data.error || 'failed');
      location.href = base + '?sent=1';
    } catch (err) {
      location.href = base + '?error=1';
    }
  });
})();
</script>`;

  return c.html(
    layout({
      title: ui.seoTitle,
      description: clipMeta(ui.seoDescription),
      canonical: absoluteUrl(contactHref),
      lang,
      country,
      localeSwitchPath: `/{lang}/contact`,
      hreflang: hreflangFor(contactPath),
      jsonld: {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact | Circuitbull®",
        url: `https://circuitbull.com${contactHref}`,
        mainEntity: {
          "@type": "Organization",
          name: "Circuitbull",
          legalName: "Volls Global Inc",
          telephone: "+12766002052",
          email: "info@circuitbull.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "1207 Delaware Ave #5352",
            addressLocality: "Wilmington",
            addressRegion: "DE",
            postalCode: "19806",
            addressCountry: "US",
          },
        },
      },
      body,
    })
  );
}

app.get("/", async (c) => {
  const { lang, country } = resolveLocale(c);
  // Soft-suggest locale via cookie without forcing redirect (SSR stays en for /)
  if (!getCookie(c, "cb_lang") && lang !== DEFAULT_LANG) {
    persistLocaleCookies(c, lang, country);
  }
  return renderHome(c, DEFAULT_LANG, country);
});

async function renderHome(c: any, lang: string, country?: string) {
  const company = await kvJson<any>(c.env.DATA, "company");
  const allProducts = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const products = allProducts.slice(0, 8);
  const needs = ((await kvJson<any[]>(c.env.DATA, "needs")) || []).filter((n) => n.catalog !== false && n.slug !== "solar-fleet-ops");
  const tm = company?.brand?.trademark || "Circuitbull®";
  const ui = pageCopy(lang);
  const about = company?.i18n?.[lang]?.about || company?.i18n?.en?.about || ui.home.seoDescription;
  const cat = catalogPath(lang);

  const productCards = products
    .map((p) => {
      const copy = productCopy(p, lang);
      const img = p.image ? cdnUrl(p.image) : "";
      return `<a class="product" href="${productPath(lang, p.slug)}">
      <div class="media">${img ? `<img src="${escapeHtml(img)}" data-full="${escapeHtml(img)}" data-lightbox alt="${escapeHtml(copy.name)}" loading="lazy"/>` : ""}</div>
      <div class="body">
        <div class="model">${escapeHtml(displaySku(p))}</div>
        <h3>${escapeHtml(copy.name)}</h3>
        <p>${escapeHtml((copy.summary || "").slice(0, 110))}</p>
      </div>
    </a>`;
    })
    .join("");

  const solutionCells = needs
    .map((n) => {
      const linked = allProducts.filter((p) => (p.needSlugs || []).includes(n.slug));
      return solutionTileHtml(n, lang, linked.length, solutionHeroImage(n, linked));
    })
    .join("");

  const usaCells = usaSegments(lang).map(
    (s) => `<div class="cell">
      <div class="code">${s.code}</div>
      <h3>${s.title}</h3>
      <p>${s.blurb}</p>
    </div>`
  ).join("");

  const featuredNeed =
    needs.find((n) => n.slug === "border-control" && n.media?.video) ||
    needs.find((n) => n.media?.video) ||
    needs.find((n) => n.slug === "border-control") ||
    needs[0];
  const featuredMedia = featuredNeed?.media || {};
  const featuredTitle =
    featuredNeed?.i18n?.[lang]?.title || featuredNeed?.i18n?.en?.title || featuredNeed?.slug || "Border Control";
  const featuredVideo = `${cdnUrl(featuredMedia.video || "solutions/border-control.mp4").split("?")[0]}?v=20260921c`;
  const featuredPoster = `${cdnUrl(
    featuredMedia.poster || featuredMedia.image || "solutions/border-control.jpg"
  ).split("?")[0]}?v=20260921c`;
  const solutionsMediaBlock = `<section class="section" id="solutions-media">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.home.fieldKicker)}</p>
      <h2>${escapeHtml(featuredTitle)}</h2>
      <p>${escapeHtml(ui.home.fieldLead)}</p>
    </div>
    <div class="solution-media hud-corners">
      <video class="solution-video" controls playsinline preload="metadata" poster="${escapeHtml(featuredPoster)}">
        <source src="${escapeHtml(featuredVideo)}" type="video/mp4"/>
      </video>
    </div>
  </div>
</section>`;

  const body = `
<section class="hero wrap">
  <div class="hero-copy reveal">
    <p class="kicker">${escapeHtml(ui.home.kicker)}</p>
    <h1><span class="tm">${escapeHtml(tm)}</span></h1>
    <p class="lede">${escapeHtml(about)}</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${solutionPath(lang, "border-control")}">${escapeHtml(ui.home.ctaBorder)}</a>
      <a class="btn btn-ghost" href="${cat}">${escapeHtml(ui.home.ctaCatalog)}</a>
    </div>
    <button type="button" class="hero-find" data-open-platform-search>
      <span class="hero-find-icon" aria-hidden="true">⌕</span>
      <span class="hero-find-text">${escapeHtml(ui.home.findPlaceholder)}</span>
      <kbd class="hero-find-kbd" data-ps-kbd>Ctrl K</kbd>
    </button>
  </div>
  <div class="hero-media hud-corners">
    <div class="hero-frame">
      <img class="hero-still" src="${escapeHtml(featuredPoster)}" alt="${escapeHtml(featuredTitle)} — military-grade ISR"/>
      <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="${escapeHtml(featuredPoster)}" aria-label="${escapeHtml(featuredTitle)} cinematic" onerror="this.style.display='none'">
        <source src="${escapeHtml(featuredVideo)}" type="video/mp4"/>
      </video>
      <div class="hero-scan" aria-hidden="true"></div>
      <div class="hero-media-meta">
        <span>EO / IR · UAV TRACK</span>
        <span>${escapeHtml((featuredNeed?.slug || "border-control").replace(/-/g, " "))}</span>
      </div>
    </div>
  </div>
</section>

<div class="wrap">
  <div class="meta-bar">
    <div><strong>HQ</strong> Wilmington, DE</div>
    <div><strong>COMMS</strong> +1 276 600 2052</div>
    <div><strong>STACK</strong> IoT · SCADA · SaaS · Solar · Carbon</div>
    <div><strong>SENSORS</strong> Thermal · EO/IR · Multi-sensor</div>
  </div>
</div>

<section class="section" id="usa">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.home.usaKicker)}</p>
      <h2>${escapeHtml(ui.home.usaTitle)}</h2>
      <p>${escapeHtml(ui.home.usaLead)}</p>
    </div>
    <div class="rail hud-corners">${usaCells}</div>
  </div>
</section>

${solutionsMediaBlock}

<section class="section" id="solutions">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.home.solKicker)}</p>
      <h2>${escapeHtml(ui.home.solTitle)}</h2>
      <p>${escapeHtml(ui.home.solLead)}</p>
    </div>
    <div class="sol-grid">${solutionCells || `<div class="cell"><h3>${escapeHtml(ui.home.catTitle)}</h3><p>${escapeHtml(ui.home.catalogLoading)}</p></div>`}</div>
    <div class="cta-row" style="margin-top:1.5rem">
      <a class="btn btn-ghost" href="${solutionsIndexPath(lang)}">${escapeHtml(ui.home.allSolutions)}</a>
    </div>
  </div>
</section>

<section class="section" id="catalog">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.home.catKicker)}</p>
      <h2>${escapeHtml(ui.home.catTitle)}</h2>
      <p>${escapeHtml(ui.home.catLead)}</p>
    </div>
    <div class="product-grid">${productCards || `<p class="lede">${escapeHtml(ui.home.catalogLoading)} — <a href="${cat}">${escapeHtml(ui.home.fullCatalog)}</a></p>`}</div>
    <div class="cta-row" style="margin-top:1.5rem">
      <a class="btn btn-ghost" href="${cat}">${escapeHtml(ui.home.fullCatalog)}</a>
    </div>
  </div>
</section>

${investManifestoHtml(lang)}
`;

  return c.html(
    layout({
      title: ui.home.seoTitle,
      description: clipMeta(ui.home.seoDescription),
      canonical: absoluteUrl(homePath(lang)),
      lang,
      country,
      hreflang: hreflangFor(homePath),
      localeSwitchPath: "/{lang}",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Circuitbull",
        legalName: "Volls Global Inc",
        slogan: "IoT, SCADA & carbon monitoring — Made in USA",
        telephone: "+12766002052",
        url: "https://circuitbull.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "1207 Delaware Ave #5352",
          addressLocality: "Wilmington",
          addressRegion: "DE",
          postalCode: "19806",
          addressCountry: "US",
        },
        brand: { "@type": "Brand", name: "Circuitbull®" },
      },
      body,
    })
  );
}

app.get("/products", async (c) => renderProductCatalog(c, DEFAULT_LANG));
app.get("/:lang/products", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderProductCatalog(c, normalizeLang(lang));
});

async function renderProductCatalog(c: any, lang: string) {
  const ui = pageCopy(lang);
  const dock = catalogDock(lang);
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const needs = ((await kvJson<any[]>(c.env.DATA, "needs")) || []).filter((n) => n && n.slug);
  const needTitle = new Map<string, string>();
  const needSearch = new Map<string, string>();
  const dockByLang = new Map(SITE_LOCALES.map((loc) => [loc, catalogDock(loc)]));
  for (const n of needs) {
    const slug = String(n.slug);
    needTitle.set(slug, solutionCopy(n, lang).title || slug);
    const titles = SITE_LOCALES.map((loc) => solutionCopy(n, loc).title).filter(Boolean);
    needSearch.set(slug, [...new Set(titles)].join(" "));
  }

  const catLabels = new Map<string, string>();
  const usedNeeds = new Set<string>();
  const cards = products.map((p) => {
    const copy = productCopy(p, lang);
    const imgSrc = p.media?.aiHero || p.image;
    const cats: string[] = [];
    for (const raw of productCategoryLabels(p)) {
      const key = categoryKey(raw);
      if (!key || cats.includes(key)) continue;
      cats.push(key);
      if (!catLabels.has(key)) catLabels.set(key, dock.categories[key] || raw);
    }
    const needSlugs = [
      ...new Set(
        (p.needSlugs || []).map((slug: string) => String(slug || "").trim()).filter(Boolean)
      ),
    ];
    for (const slug of needSlugs) usedNeeds.add(slug);
    const i18n = p.i18n && typeof p.i18n === "object" ? p.i18n : {};
    const localized: string[] = [];
    for (const loc of SITE_LOCALES) {
      const block = i18n[loc] || {};
      localized.push(block.name, block.summary, block.slogan);
      if (block.description) localized.push(String(block.description).slice(0, 280));
      if (Array.isArray(block.applications)) localized.push(...block.applications);
      for (const key of cats) localized.push(dockByLang.get(loc)?.categories[key] || "");
    }
    const q = foldSearch(
      [
        copy.name,
        copy.summary,
        displaySku(p),
        p.slug,
        p.model,
        p.name,
        p.summary,
        ...productCategoryLabels(p),
        ...localized,
        ...needSlugs.map((slug) => needSearch.get(slug) || needTitle.get(slug) || slug),
      ]
        .filter(Boolean)
        .join(" ")
    );
    return {
      slug: p.slug,
      smartId: displaySku(p),
      sku: displaySku(p),
      name: copy.name,
      summary: copy.summary || "",
      image: imgSrc ? cdnUrl(imgSrc) : "",
      path: productPath(lang, p.slug),
      cats: cats.join("|"),
      needs: needSlugs.join("|"),
      apps: (copy.applications || []).slice(0, 8).join("|"),
      areas: needSlugs
        .map((slug) => needTitle.get(slug) || "")
        .filter(Boolean)
        .slice(0, 6)
        .join("|"),
      q,
    };
  });

  const categories = [...catLabels.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, lang));
  const solutions = [...usedNeeds]
    .map((slug) => ({ value: slug, label: needTitle.get(slug) || slug }))
    .sort((a, b) => a.label.localeCompare(b.label, lang));

  const body = `
<section class="section section-flush">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.catalog.kicker)}</p>
      <h2>${escapeHtml(ui.catalog.title)}</h2>
      <p>${escapeHtml(fillCount(ui.catalog.lead, products.length))}</p>
    </div>
    ${flyDockMarkup({ copy: dock, categories, solutions })}
    ${smartFilterMarkup({ lang, factCount: 0, groups: [] }, cards, lang, { lazyFacets: true })}
  </div>
</section>`;

  return c.html(
    layout({
      title: ui.catalog.seoTitle,
      description: clipMeta(ui.catalog.seoDescription),
      canonical: absoluteUrl(catalogPath(lang)),
      lang,
      hreflang: hreflangFor(catalogPath),
      localeSwitchPath: "/{lang}/products",
      body,
    })
  );
}

app.get("/products/:slug", async (c) => renderProductDetail(c, DEFAULT_LANG, c.req.param("slug")));
app.get("/:lang/products/:slug", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderProductDetail(c, normalizeLang(lang), c.req.param("slug"));
});

app.get("/products/:slug/datasheet", async (c) => renderProductDatasheet(c, DEFAULT_LANG, c.req.param("slug")));
app.get("/:lang/products/:slug/datasheet", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderProductDatasheet(c, normalizeLang(lang), c.req.param("slug"));
});

app.get("/products/:slug/datasheet.pdf", async (c) => serveDatasheetPdf(c, DEFAULT_LANG, c.req.param("slug")));
app.get("/:lang/products/:slug/datasheet.pdf", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return serveDatasheetPdf(c, normalizeLang(lang), c.req.param("slug"));
});

async function renderProductDatasheet(c: any, lang: string, slug: string) {
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === slug);
  if (!p) return c.notFound();
  const copy = productCopy(p, lang);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  // Only ?print=1 opens the print dialog. Never treat ?download=1 as print.
  const autoPrint = c.req.query("print") === "1";
  return c.html(
    renderA4Datasheet({
      product: p,
      copy,
      lang,
      autoPrint,
    })
  );
}

async function serveDatasheetPdf(c: any, lang: string, slug: string) {
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === slug);
  if (!p) return c.notFound();
  const copy = productCopy(p, lang);
  const mediaSlug = p.cdn?.slug || p.slug || slug;
  const nameSlug = p.cdn?.datasheetSlugs?.[lang] || p.cdn?.datasheetSlugs?.en || datasheetNameSlug(copy.name);
  // Prefer human product name for download; ASCII fallback for legacy filename=
  const displayName = copy.name || p.model || displaySku(p) || nameSlug;
  const disposition = pdfContentDisposition(displayName, nameSlug);
  const keys = [
    catalogPdfKey(mediaSlug, lang),
    lang !== DEFAULT_LANG ? catalogPdfKey(mediaSlug, DEFAULT_LANG) : "",
  ].filter(Boolean);

  const pdfResponse = (body: BodyInit) =>
    new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });

  for (const key of keys) {
    try {
      const obj = await c.env.MEDIA.get(key);
      if (!obj) continue;
      const buf = await obj.arrayBuffer();
      if (!looksLikePdf(buf)) continue;
      return pdfResponse(buf);
    } catch {
      /* try next key */
    }
  }

  // Public CDN fallback (same R2 objects) — never redirect to print UI / never serve HTML/txt
  const cdnBase = String(c.env.CDN_BASE || "https://cdn.circuitbull.com").replace(/\/$/, "");
  for (const key of keys) {
    try {
      const res = await fetch(`${cdnBase}/${key}`);
      if (!res.ok) continue;
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct && !ct.includes("pdf") && !ct.includes("octet-stream")) continue;
      const buf = await res.arrayBuffer();
      if (!looksLikePdf(buf)) continue;
      return pdfResponse(buf);
    } catch {
      /* try next key */
    }
  }

  // Never return text/plain — browsers rename mismatched .pdf downloads to datasheet.txt
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF not available</title></head><body><h1>Datasheet PDF not available yet</h1><p>Please open the HTML datasheet or try again shortly.</p><p><a href="${escapeHtml(
      datasheetPath(lang, slug)
    )}">Open datasheet</a></p></body></html>`,
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

async function renderProductDetail(c: any, lang: string, slug: string) {
  const products = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const p = products.find((x) => x.slug === slug);
  if (!p) {
    const rel = similarCopy(lang);
    const rec = await recommendSimilarProducts(c.env, {
      query: missionQuery({ slug, extra: slug.replace(/-/g, " ") }),
      lang,
      products,
      excludeSlugs: [slug],
      limit: 8,
    });
    const bySlug = new Map(products.map((x) => [x.slug, x]));
    const similarCards = rec.slugs.map((s) => bySlug.get(s)).filter(Boolean).map((x) => productCardHtml(x, lang)).join("");
    const body = `
<section class="section section-flush">
  <div class="wrap">
    <p class="kicker">${escapeHtml(rel.kicker)}</p>
    <h1 class="page-title">${escapeHtml(rel.missingTitle)}</h1>
    <p class="page-lead">${escapeHtml(rel.missingLead)}</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${catalogPath(lang)}">${escapeHtml(pageCopy(lang).product.browse)}</a>
      <a class="btn btn-ghost" href="${contactPath(lang)}">${escapeHtml(pageCopy(lang).product.quote)}</a>
    </div>
    ${similarCards ? `<div class="product-grid" style="margin-top:1.75rem">${similarCards}</div>` : ""}
  </div>
</section>`;
    return c.html(
      layout({
        title: `${rel.missingTitle} | Circuitbull®`,
        description: clipMeta(rel.missingLead),
        canonical: absoluteUrl(productPath(lang, slug)),
        lang,
        hreflang: hreflangFor((l) => productPath(l, slug)),
        localeSwitchPath: `/{lang}/products/${slug}`,
        body,
      }),
      404
    );
  }
  const copy = productCopy(p, lang);
  const need = (p.needSlugs || [])[0];
  const specs = copy.specs || {};
  const benefits = copy.benefits || [];
  const overview = copy.overview || [];
  const applications = copy.applications || [];
  const factGroups = groupFactsForDisplay(p.facts || [], lang);
  const hero = cdnUrl(p.image);
  const gallery = [...new Set((p.images || []).map((src: string) => cdnUrl(src)).filter(Boolean))].slice(0, 8);
  const datasheetHref = datasheetPath(lang, p.slug);
  const datasheetPdfHref = datasheetPdfPath(lang, p.slug);
  const pdfDlName = pdfDownloadBasename(
    copy.name || p.model || p.cdn?.datasheetSlugs?.[lang] || p.cdn?.datasheetSlugs?.en || p.slug,
    datasheetNameSlug(copy.name || p.slug)
  ).ascii;
  const descriptionHtml = sanitizeCatalogHtml(p.descriptionHtml || p.datasheet?.html || "");
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  const { partners } = await loadPartners(c.env);
  const quoteHref = quoteContactHref(lang, p);
  const chrome = pageCopy(lang).product;

  // Prefer ontology facts; fall back to flat specs for unparsed products
  const factSections = factGroups
    .map((g) => {
      const rows = g.items
        .map(
          (it) =>
            `<tr><th scope="row">${escapeHtml(it.label)}</th><td>${escapeHtml(it.value)}</td></tr>`
        )
        .join("");
      return `<div class="spec-group" style="margin-bottom:2rem">
        <h3 class="spec-group-title">${escapeHtml(g.label)}</h3>
        <table class="spec"><tbody>${rows}</tbody></table>
      </div>`;
    })
    .join("");

  const specRows = !factGroups.length
    ? Object.entries(specs)
        .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`)
        .join("")
    : "";
  const bullets = (arr: string[]) => arr.map((x) => `<li>${escapeHtml(x)}</li>`).join("");
  const thumbs = gallery
    .map(
      (src: string) =>
        `<img src="${escapeHtml(src)}" data-full="${escapeHtml(src)}" data-lightbox alt="${escapeHtml(copy.name)}" loading="lazy"/>`
    )
    .join("");

  const body = `
<section class="section section-flush">
  <div class="wrap split-hero">
    <div>
      <div class="hud-corners" style="padding:1px;border:1px solid var(--line);background:var(--bg-elev)">
        ${hero ? `<img class="product-hero" src="${escapeHtml(hero)}" data-full="${escapeHtml(hero)}" data-lightbox alt="${escapeHtml(copy.name)}" style="width:100%;aspect-ratio:4/3;object-fit:cover"/>` : ""}
      </div>
      ${thumbs ? `<div class="thumb-grid">${thumbs}</div>` : ""}
    </div>
    <div>
      <p class="kicker">${escapeHtml(displaySku(p))}</p>
      <h1 class="page-title">${escapeHtml(copy.name)}</h1>
      ${p.model ? `<p style="font-family:var(--font-mono);font-size:.9rem;color:var(--accent);margin:0 0 .75rem">Model ${escapeHtml(p.model)}</p>` : ""}
      <p class="page-lead">${escapeHtml(copy.slogan || copy.summary || copy.description || "")}</p>
      <div class="cta-row">
        <button type="button" class="btn btn-primary" data-open-buy data-sku="${escapeHtml(displaySku(p))}" data-product-name="${escapeHtml(copy.name)}" data-product-path="${escapeHtml(productPath(lang, p.slug))}" data-product-image="${escapeHtml(hero || "")}">${escapeHtml(chrome.buy)}</button>
        <a class="btn btn-ghost" href="${escapeHtml(quoteHref)}">${escapeHtml(chrome.quote)}</a>
        <a class="btn btn-ghost" href="${escapeHtml(datasheetHref)}">${escapeHtml(chrome.datasheet)}</a>
        <a class="btn btn-ghost" href="${escapeHtml(datasheetPdfHref)}" download="${escapeHtml(pdfDlName)}.pdf">${escapeHtml(chrome.pdf)}</a>
        ${need ? `<a class="btn btn-ghost" href="${solutionPath(lang, canonicalizeSolutionSlug(need) || need)}">${escapeHtml(chrome.related)}</a>` : ""}
      </div>
      <p style="margin-top:1.5rem;color:var(--muted);font-size:.85rem">SKU ${escapeHtml(displaySku(p))} · Quoted &amp; supported by Circuitbull® (Volls Global Inc)</p>
    </div>
  </div>
</section>

${benefits.length || overview.length || applications.length ? `
<section class="section">
  <div class="wrap split-cards">
    ${benefits.length ? `<div><h2 style="font-family:var(--font-display);text-transform:uppercase">${escapeHtml(chrome.benefits)}</h2><ul style="color:var(--muted);padding-left:1.1rem">${bullets(benefits)}</ul></div>` : ""}
    ${overview.length ? `<div><h2 style="font-family:var(--font-display);text-transform:uppercase">${escapeHtml(chrome.overview)}</h2><ul style="color:var(--muted);padding-left:1.1rem">${bullets(overview)}</ul></div>` : ""}
    ${applications.length ? `<div><h2 style="font-family:var(--font-display);text-transform:uppercase"><a href="${solutionsIndexPath(lang)}" style="color:inherit;text-decoration:none">${escapeHtml(chrome.solutions)}</a></h2>${applicationChipsHtml(applications, lang)}</div>` : ""}
  </div>
</section>` : ""}

${copy.description && !descriptionHtml ? `
<section class="section">
  <div class="wrap">
    <div class="section-head"><p class="kicker">${escapeHtml(chrome.detailKicker)}</p><h2>${escapeHtml(chrome.description)}</h2></div>
    <p class="page-lead" style="max-width:920px">${escapeHtml(copy.description)}</p>
  </div>
</section>` : ""}

${factSections ? `
<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(chrome.specsKicker)}</p>
      <h2>${escapeHtml(chrome.specsTitle)}</h2>
      <p>${escapeHtml(chrome.specsLead)}</p>
    </div>
    <div class="spec-block">${factSections}</div>
    <div class="cta-row" style="margin-top:1.25rem">
      <a class="btn btn-ghost" href="${escapeHtml(datasheetHref)}">View datasheet</a>
      <a class="btn btn-ghost" href="${escapeHtml(datasheetPdfHref)}" download="${escapeHtml(pdfDlName)}.pdf">Download PDF</a>
    </div>
  </div>
</section>` : ""}

${specRows ? `
<section class="section">
  <div class="wrap">
    <div class="section-head"><p class="kicker">Datasheet</p><h2>Technical specification</h2></div>
    <div class="spec-block">
    <table class="spec">
      <tbody>
        ${specRows}
      </tbody>
    </table>
    </div>
    <div class="cta-row" style="margin-top:1.25rem">
      <a class="btn btn-ghost" href="${escapeHtml(datasheetHref)}">View datasheet</a>
      <a class="btn btn-ghost" href="${escapeHtml(datasheetPdfHref)}" download="${escapeHtml(pdfDlName)}.pdf">Download PDF</a>
    </div>
  </div>
</section>` : ""}
${buyCtaMarkup({
  partners,
  countryHint: country,
  quoteHref,
  sku: displaySku(p),
  productName: copy.name,
  path: productPath(lang, p.slug),
  image: hero || "",
})}
`;

  const seo = productSeo(p, copy, lang);
  return c.html(
    layout({
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      lang,
      country,
      hreflang: seo.hreflang,
      localeSwitchPath: `/{lang}/products/${p.slug}`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: copy.name,
        sku: displaySku(p),
        image: hero || undefined,
        description: copy.seoDescription || copy.summary || copy.description,
        brand: { "@type": "Brand", name: "Circuitbull®" },
        additionalProperty: (p.facts || [])
          .filter((f: any) => {
            const loc = localizeFact(f, lang);
            return loc.value && !isGarbageGroup(f.groupKey) && !isGarbageProperty(f.propertyKey) && !isGarbageProperty(loc.label);
          })
          .slice(0, 40)
          .map((f: any) => {
            const loc = localizeFact(f, lang);
            return {
              "@type": "PropertyValue",
              propertyID: loc.propertyId,
              name: loc.label,
              value: loc.value,
            };
          }),
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Circuitbull®", legalName: "Volls Global Inc" },
        },
      },
      body,
    })
  );
}

async function renderPartners(c: any, lang: string) {
  const { partners } = await loadPartners(c.env);
  const sent = Boolean(c.req.query("sent"));
  const err = Boolean(c.req.query("error"));
  const ui = pageCopy(lang).partners;
  const path = partnersPath(lang);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  const html = layout({
    title: ui.seoTitle,
    description: clipMeta(ui.seoDescription),
    canonical: absoluteUrl(path),
    lang,
    country,
    hreflang: hreflangFor(partnersPath),
    localeSwitchPath: "/{lang}/partners",
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: ui.title,
      url: absoluteUrl(path),
    },
    body: partnersPageBody({ partners, sent, err, lang }),
  });
  return c.html(html, {
    headers: { "Cache-Control": sent || err ? "no-store" : "public, max-age=60, stale-while-revalidate=300" },
  });
}

app.get("/partners", async (c) => renderPartners(c, DEFAULT_LANG));
app.get("/:lang/partners", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderPartners(c, normalizeLang(lang));
});

async function renderInvest(c: any, lang: string) {
  const t = investCopy(lang);
  const seo = pageCopy(lang).investSeo;
  const path = investPath(lang);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  return c.html(
    layout({
      title: seo.pageTitle || t.pageTitle,
      description: clipMeta(seo.pageDescription || t.pageDescription),
      canonical: absoluteUrl(path),
      lang,
      country,
      hreflang: hreflangFor(investPath),
      localeSwitchPath: "/{lang}/invest",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Circuitbull EPC+F Border Security",
        description: t.pageDescription,
        provider: { "@type": "Organization", name: "Circuitbull", legalName: "Volls Global Inc" },
        areaServed: "Global",
        serviceType: "EPC+F border security, MWIR, UAV, C4ISR",
      },
      body: investManifestoHtml(lang, { page: true }),
    })
  );
}

app.get("/invest", (c) => renderInvest(c, DEFAULT_LANG));
app.get("/:lang/invest", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderInvest(c, normalizeLang(lang));
});

async function renderSolutionsIndex(c: any, lang: string) {
  const allProducts = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const needs = ((await kvJson<any[]>(c.env.DATA, "needs")) || []).filter(
    (n) => n.catalog !== false && n.slug !== "solar-fleet-ops"
  );
  const tiles = needs
    .map((n) => {
      const linked = allProducts.filter((p) => (p.needSlugs || []).includes(n.slug));
      return solutionTileHtml(n, lang, linked.length, solutionHeroImage(n, linked));
    })
    .join("");
  const ui = pageCopy(lang).solutions;
  const path = solutionsIndexPath(lang);
  const body = `
<section class="section section-flush">
  <div class="wrap">
    <p class="kicker">${escapeHtml(ui.kicker)}</p>
    <h1 class="page-title">${escapeHtml(ui.title)}</h1>
    <p class="page-lead">${escapeHtml(ui.lead)}</p>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="sol-grid">${tiles || `<p class="lede">${escapeHtml(pageCopy(lang).home.catalogLoading)} — <a href="${catalogPath(lang)}">${escapeHtml(pageCopy(lang).product.browse)}</a>.</p>`}</div>
  </div>
</section>`;
  return c.html(
    layout({
      title: ui.seoTitle,
      description: clipMeta(ui.seoDescription),
      canonical: absoluteUrl(path),
      lang,
      hreflang: hreflangFor(solutionsIndexPath),
      localeSwitchPath: "/{lang}/solutions",
      body,
    })
  );
}

app.get("/solutions", (c) => renderSolutionsIndex(c, DEFAULT_LANG));
app.get("/solutions/*", async (c) => {
  const rest = String(c.req.path || "").replace(/^\/solutions\/?/i, "");
  const parts = rest.split("/").filter(Boolean);
  if (!parts.length) return renderSolutionsIndex(c, DEFAULT_LANG);
  const aliased = canonicalizeSolutionSlug(parts[0]);
  const needSlug = aliased || parts[0];
  if (parts[1]) return c.redirect(capabilityPath(DEFAULT_LANG, needSlug, parts[1]), 301);
  return c.redirect(solutionPath(DEFAULT_LANG, needSlug), 301);
});
app.get("/:lang/solutions", async (c) => {
  const lang = c.req.param("lang");
  if (!isLocaleParam(lang)) return c.notFound();
  return renderSolutionsIndex(c, normalizeLang(lang));
});

async function renderSolutionNeed(c: any, lang: string, rawSlug: string) {
  const aliased = canonicalizeSolutionSlug(rawSlug);
  if (aliased && aliased !== rawSlug) {
    return c.redirect(solutionPath(lang, aliased), 301);
  }
  const needSlug = aliased || rawSlug;
  const need = (await kvJson<any>(c.env.DATA, `need:${needSlug}`)) ||
    ((await kvJson<any[]>(c.env.DATA, "needs")) || []).find((n) => n.slug === needSlug);
  if (!need) return c.notFound();

  const copy = solutionCopy(need, lang);
  const title = copy.title;
  const problem = copy.problem;
  const allProducts = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const products = allProducts.filter((p) => (p.needSlugs || []).includes(needSlug));
  const investments = ((await kvJson<any[]>(c.env.DATA, "investments")) || []).filter((i) =>
    (i.needSlugs || []).includes(needSlug)
  );
  const ownStack = [...new Set(investments.flatMap((i) => i.ownStack || []))];
  const path = solutionPath(lang, needSlug);

  const productCards = products.map((p) => productCardHtml(p, lang)).join("");
  let filterCopy = copy.filter || {};
  if (c.env.REDIS_URL) {
    try {
      const raw = await redisGet(c.env.REDIS_URL, solutionFilterKey(needSlug, lang));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.title) filterCopy = parsed;
      }
    } catch {
      /* KV need.i18n.filter is enough */
    }
  }
  const filterBlock = products.length
    ? smartFilterMarkup({ lang, factCount: 0, groups: [] }, catalogCards(products, lang), lang, {
        lazyNeed: needSlug,
        copy: filterCopy,
      })
    : "";

  let similarBlock = "";
  if (!productCards) {
    const rel = similarCopy(lang);
    const rec = await recommendSimilarProducts(c.env, {
      query: missionQuery({ title, problem, slug: needSlug }),
      lang,
      products: allProducts,
      excludeSlugs: products.map((p) => p.slug),
      limit: 8,
    });
    const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
    const similarCards = rec.slugs.map((slug) => bySlug.get(slug)).filter(Boolean).map((p) => productCardHtml(p, lang)).join("");
    if (similarCards) {
      similarBlock = `<div class="section-head">
      <p class="kicker">${escapeHtml(rel.kicker)}</p>
      <h2>${escapeHtml(rel.title)}</h2>
      <p>${escapeHtml(rel.lead)}</p>
    </div>
    <div class="product-grid">${similarCards}</div>
    <p class="rd-note">${escapeHtml(rel.note)}</p>`;
    }
  }

  const scene = solutionScene(needSlug);
  const sceneAlt = scene ? (lang === "tr" ? scene.altTr : scene.alt) : title;
  const solMedia = need.media || {};
  const solVideo = scene ? "" : solMedia.video ? cdnUrl(solMedia.video) : "";
  const solPoster = solutionHeroImage(need, products);
  const mediaBlock =
    scene || solVideo || solPoster
      ? `<div class="solution-media hud-corners">
      ${
        solVideo
          ? `<video class="solution-video" controls playsinline preload="metadata"${
              solPoster ? ` poster="${escapeHtml(solPoster)}"` : ""
            }>
        <source src="${escapeHtml(solVideo)}" type="video/mp4"/>
      </video>`
          : `<img class="solution-video" src="${escapeHtml(solPoster)}" alt="${escapeHtml(sceneAlt)}"/>`
      }
    </div>`
      : "";

  const solUi = pageCopy(lang).solution;
  const capUi = pageCopy(lang).cap;
  const capDefs = listCapabilities(needSlug);
  const caps = (capDefs.length
    ? capDefs.map((def) => {
        const t = capabilityCopy(def, lang);
        return `<a class="sol-cap" href="${capabilityPath(lang, needSlug, def.slug)}">
        <p>${escapeHtml(t.title)}</p>
        <span class="sol-cap-more">${escapeHtml(capUi.more)} →</span>
      </a>`;
      })
    : copy.capabilities.map((cap: string) => `<div class="sol-cap"><p>${escapeHtml(cap)}</p></div>`)
  ).join("");

  const empty = EMPTY_PLATFORM[lang] || EMPTY_PLATFORM.en;
  const platformsBlock = filterBlock
    ? `<div class="section-head">
      <p class="kicker">${products.length} platforms</p>
      <h2>${escapeHtml(solUi.sensorsTitle)}</h2>
      <p>${escapeHtml(filterCopy.sub || fillTitle(solUi.sensorsLead, title.toLowerCase()))}</p>
    </div>
    ${filterBlock}`
    : similarBlock || `<div class="rd-stage hud-corners">
      <p class="kicker">${escapeHtml(empty.kicker)}</p>
      <h3>${escapeHtml(empty.title)}</h3>
      <p>${escapeHtml(empty.body)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${contactPath(lang)}?interest=${encodeURIComponent(needSlug)}">${escapeHtml(empty.brief)}</a>
        <a class="btn btn-ghost" href="${catalogPath(lang)}">${escapeHtml(empty.catalog)}</a>
      </div>
    </div>`;

  const relatedNeeds = ((await kvJson<any[]>(c.env.DATA, "needs")) || [])
    .filter((n) => n.slug !== needSlug && n.catalog !== false && n.slug !== "solar-fleet-ops")
    .slice(0, 4);
  const related = relatedNeeds
    .map((n) => {
      const linked = allProducts.filter((p) => (p.needSlugs || []).includes(n.slug));
      return solutionTileHtml(n, lang, linked.length, solutionHeroImage(n, linked));
    })
    .join("");

  const heroCopy = `
      <p class="kicker">${escapeHtml(solUi.kicker)} · ${escapeHtml(copy.code)}</p>
      <h1 class="page-title" style="font-size:clamp(2.2rem,8vw,4rem)">${escapeHtml(title)}</h1>
      <p class="page-lead">${escapeHtml(copy.lead || problem)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${contactPath(lang)}?interest=${encodeURIComponent(needSlug)}">${escapeHtml(solUi.quote)}</a>
        <a class="btn btn-ghost" href="${catalogPath(lang)}?need=${escapeHtml(needSlug)}">${escapeHtml(solUi.browse)}</a>
      </div>`;

  const heroSection = scene
    ? `
<section class="sol-scene">
  <img class="sol-scene-photo" src="${escapeHtml(solPoster)}" alt="${escapeHtml(sceneAlt)}" fetchpriority="high"${
    scene.objectPosition ? ` style="object-position:${escapeHtml(scene.objectPosition)}"` : ""
  }/>
  <div class="sol-scene-veil" aria-hidden="true"></div>
  <div class="wrap sol-scene-copy">${heroCopy}</div>
  ${solutionSceneCreditHtml(needSlug, lang)}
</section>`
    : `
<section class="section section-flush">
  <div class="wrap sol-hero">
    <div>
      ${heroCopy}
    </div>
    ${mediaBlock}
  </div>
</section>`;

  const body = `
${heroSection}

${caps ? `<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(solUi.whatWeField)}</p>
      <h2>${escapeHtml(solUi.onMission)}</h2>
    </div>
    <div class="sol-caps">${caps}</div>
  </div>
</section>` : ""}

<section class="section">
  <div class="wrap">
    ${platformsBlock}
  </div>
</section>

${related ? `<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(solUi.moreMissions)}</p>
      <h2>${escapeHtml(solUi.related)}</h2>
    </div>
    <div class="sol-grid">${related}</div>
  </div>
</section>` : ""}

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(solUi.stackKicker)}</p>
      <h2>${escapeHtml(solUi.stackTitle)}</h2>
    </div>
    <div class="rail">
      ${(ownStack.length ? ownStack : ["iot", "scada", "saas"])
        .map((s) => {
          const seg = usaSegments(lang).find((x) => x.slug === s);
          return `<div class="cell"><div class="code">${escapeHtml((seg?.code || s).toUpperCase())}</div><h3>${escapeHtml(seg?.title || s)}</h3><p>${escapeHtml(seg?.blurb || "")}</p></div>`;
        })
        .join("")}
    </div>
  </div>
</section>`;

  const seo = solutionSeo({ slug: needSlug }, copy, lang);
  return c.html(
    layout({
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      lang,
      hreflang: seo.hreflang,
      localeSwitchPath: `/{lang}/solutions/${needSlug}`,
      jsonld: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: title,
          description: problem,
          provider: { "@type": "Organization", name: "Circuitbull®", legalName: "Volls Global Inc" },
          areaServed: "US",
          url: `https://circuitbull.com${path}`,
          ...(solPoster ? { image: solPoster } : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://circuitbull.com/" },
            { "@type": "ListItem", position: 2, name: "Solutions", item: `https://circuitbull.com${solutionsIndexPath(lang)}` },
            { "@type": "ListItem", position: 3, name: title, item: `https://circuitbull.com${path}` },
          ],
        },
      ],
      body,
    })
  );
}

app.get("/:lang/solutions/:need", async (c) => {
  const langParam = c.req.param("lang");
  if (!isLocaleParam(langParam)) return c.notFound();
  return renderSolutionNeed(c, normalizeLang(langParam), c.req.param("need"));
});

async function renderCapabilityPage(c: any, lang: string, needSlug: string, capSlug: string) {
  const def = findCapability(needSlug, capSlug);
  if (!def) return c.redirect(solutionPath(lang, needSlug), 302);
  const need =
    (await kvJson<any>(c.env.DATA, `need:${needSlug}`)) ||
    ((await kvJson<any[]>(c.env.DATA, "needs")) || []).find((n) => n.slug === needSlug);
  if (!need) return c.notFound();

  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  const mission = solutionCopy(need, lang);
  const base = capabilityCopy(def, lang);
  const overlay = (mission.caps && mission.caps[def.slug]) || {};
  const t = {
    ...base,
    title: overlay.title || base.title,
    lead: overlay.lead || base.lead,
    seoTitle: overlay.seoTitle || "",
    seoDescription: overlay.seoDescription || "",
  };
  const ui = pageCopy(lang).cap;
  const path = capabilityPath(lang, needSlug, def.slug);
  const allProducts = (await kvJson<any[]>(c.env.DATA, "products")) || [];
  const missionProducts = allProducts.filter((p) => (p.needSlugs || []).includes(needSlug));
  const ranked = rankProductsForCapability(missionProducts, def, lang);
  const primaryCards = ranked.primary.map((p) => productCardHtml(p, lang)).join("");
  const restCards = ranked.rest.slice(0, 8).map((p) => productCardHtml(p, lang)).join("");

  let similarBlock = "";
  if (!primaryCards) {
    const rel = similarCopy(lang);
    const rec = await recommendSimilarProducts(c.env, {
      query: missionQuery({ title: t.title, problem: t.lead, slug: needSlug, extra: def.keywords.join(" ") }),
      lang,
      products: allProducts,
      excludeSlugs: missionProducts.map((p) => p.slug),
      limit: 8,
    });
    const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
    const similarCards = rec.slugs.map((slug) => bySlug.get(slug)).filter(Boolean).map((p) => productCardHtml(p, lang)).join("");
    if (similarCards) {
      similarBlock = `<div class="section-head">
      <p class="kicker">${escapeHtml(rel.kicker)}</p>
      <h2>${escapeHtml(rel.title)}</h2>
      <p>${escapeHtml(rel.lead)}</p>
    </div>
    <div class="product-grid">${similarCards}</div>`;
    }
  }

  const otherCaps = listCapabilities(needSlug)
    .filter((x) => x.slug !== def.slug)
    .map((x) => {
      const ct = capabilityCopy(x, lang);
      return `<a class="sol-cap" href="${capabilityPath(lang, needSlug, x.slug)}">
        <p>${escapeHtml(ct.title)}</p>
        <span class="sol-cap-more">${escapeHtml(ui.more)} →</span>
      </a>`;
    })
    .join("");

  const empty = EMPTY_PLATFORM[lang] || EMPTY_PLATFORM.en;
  const platforms =
    primaryCards
      ? `<div class="section-head">
      <p class="kicker">${escapeHtml(ui.platformsKicker)} · ${ranked.primary.length}</p>
      <h2>${escapeHtml(ui.platformsTitle)}</h2>
      <p>${escapeHtml(ui.platformsLead)}</p>
    </div>
    <div class="product-grid">${primaryCards}</div>`
      : similarBlock || `<div class="rd-stage hud-corners">
      <p class="kicker">${escapeHtml(empty.kicker)}</p>
      <h3>${escapeHtml(empty.title)}</h3>
      <p>${escapeHtml(empty.body)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${contactPath(lang)}?interest=${encodeURIComponent(needSlug)}">${escapeHtml(empty.brief)}</a>
        <a class="btn btn-ghost" href="${catalogPath(lang)}">${escapeHtml(empty.catalog)}</a>
      </div>
    </div>`;

  const solPoster = solutionHeroImage(need, ranked.primary.length ? ranked.primary : missionProducts);
  const mediaBlock = solPoster
    ? `<div class="solution-media hud-corners">
      <img class="solution-video" src="${escapeHtml(solPoster)}" alt="${escapeHtml(t.title)}"/>
    </div>`
    : "";

  const body = `
<section class="section section-flush">
  <div class="wrap sol-hero">
    <div>
      <nav class="sol-crumb" aria-label="Breadcrumb">
        <a href="${solutionsIndexPath(lang)}">${escapeHtml(ui.crumbSolutions)}</a>
        <span aria-hidden="true">/</span>
        <a href="${solutionPath(lang, needSlug)}">${escapeHtml(mission.title)}</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(t.title)}</span>
      </nav>
      <p class="kicker">${escapeHtml(ui.kicker)} · ${escapeHtml(mission.code)}</p>
      <h1 class="page-title" style="font-size:clamp(2rem,7vw,3.4rem)">${escapeHtml(t.title)}</h1>
      <p class="page-lead">${escapeHtml(t.lead)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${contactPath(lang)}?interest=${encodeURIComponent(needSlug)}">${escapeHtml(ui.quote)}</a>
        <a class="btn btn-ghost" href="${solutionPath(lang, needSlug)}">${escapeHtml(ui.mission)}</a>
      </div>
    </div>
    ${mediaBlock}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="cap-body">${t.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div>
    <div class="cap-field hud-corners">
      <p class="kicker">${escapeHtml(ui.fieldNote)}</p>
      <p>${escapeHtml(t.field)}</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${platforms}
    ${
      restCards
        ? `<div class="section-head" style="margin-top:2.2rem">
      <p class="kicker">${escapeHtml(ui.alsoKicker)}</p>
      <h2>${escapeHtml(ui.alsoTitle)}</h2>
    </div>
    <div class="product-grid">${restCards}</div>`
        : ""
    }
  </div>
</section>

${
  otherCaps
    ? `<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(ui.otherKicker)}</p>
      <h2>${escapeHtml(ui.otherTitle)}</h2>
    </div>
    <div class="sol-caps">${otherCaps}</div>
  </div>
</section>`
    : ""
}`;

  const seo = capabilitySeo(needSlug, def.slug, t, mission.title, lang);
  return c.html(
    layout({
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      lang,
      country,
      hreflang: seo.hreflang,
      localeSwitchPath: `/{lang}/solutions/${needSlug}/${def.slug}`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Service",
        name: t.title,
        description: t.lead,
        provider: { "@type": "Organization", name: "Circuitbull", legalName: "Volls Global Inc" },
        areaServed: "Global",
        isRelatedTo: mission.title,
      },
      body,
    })
  );
}

app.get("/:lang/solutions/:need/:cap", async (c) => {
  const langParam = c.req.param("lang");
  if (!isLocaleParam(langParam)) return c.notFound();
  const lang = normalizeLang(langParam);
  const rawSlug = c.req.param("need");
  const aliased = canonicalizeSolutionSlug(rawSlug);
  if (aliased && aliased !== rawSlug) {
    return c.redirect(capabilityPath(lang, aliased, c.req.param("cap")), 301);
  }
  const needSlug = aliased || rawSlug;
  return renderCapabilityPage(c, lang, needSlug, c.req.param("cap"));
});

app.get("/api/v1/social/facebook/status", async (c) => {
  const settings = await loadFacebookSettings(c.env);
  const state = await loadFacebookState(c.env.DATA);
  return c.json(facebookPublicStatus(settings, state));
});

app.post("/api/v1/social/facebook/run", async (c) => {
  const secret = c.env.A2A_SHARED_SECRET || c.env.FACEBOOK_CRON_SECRET;
  const hdr = c.req.header("X-A2A-Secret") || c.req.header("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || hdr !== secret) return c.json({ error: "unauthorized" }, 401);
  const q = c.req.query();
  const kindRaw = String(q.kind || "");
  const kind = kindRaw === "solution" || kindRaw === "product" ? kindRaw : undefined;
  const result = await runFacebookSlot(c.env, {
    source: "manual",
    lang: q.lang,
    kind,
    slug: q.slug,
    dry: q.dry === "1" || q.dry === "true",
    force: q.force === "1" || q.force === "true",
  });
  return c.json(result, result.ok ? 200 : 500);
});

app.get("/api/v1/solutions/:need", (c) => {
  const lang = c.req.query("lang") || "en";
  return c.redirect(solutionPath(lang, c.req.param("need")), 302);
});

/** Localized home — registered last so it cannot shadow /products, /contact, etc. */
app.get("/:lang", async (c) => {
  const langParam = c.req.param("lang");
  if (!isLocaleParam(langParam)) return c.notFound();
  const lang = normalizeLang(langParam);
  const { country } = resolveLocale(c, lang);
  persistLocaleCookies(c, lang, country);
  return renderHome(c, lang, country);
});

app.onError((err, c) => {
  console.error(err);
  const path = new URL(c.req.url).pathname;
  if (path === "/sitemap.xml" || path === "/sitemap.xml/") {
    return xmlResponse(sitemapIndexXml(), c.req.method);
  }
  if (path.startsWith("/sitemap-") && path.endsWith(".xml")) {
    return xmlResponse(urlsetXml([]), c.req.method);
  }
  return c.text("Internal Error", 500);
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    const key = indexNowKey(env);
    if ((request.method === "GET" || request.method === "HEAD") && indexNowPathMatch(pathname, key)) {
      return indexNowResponse(key);
    }
    return app.fetch(request, env, ctx);
  },
  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      runFacebookSlot(env, { source: "cron", at: controller.scheduledTime }).then((r) => {
        console.log(
          "facebook_cron",
          JSON.stringify({
            ok: r.ok,
            skipped: "skipped" in r ? r.skipped : undefined,
            lang: r.lang,
            slug: "slug" in r ? r.slug : undefined,
            postId: "postId" in r ? r.postId : undefined,
            error: "error" in r ? r.error : undefined,
          })
        );
      })
    );
  },
};
