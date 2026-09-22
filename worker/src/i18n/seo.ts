/** Canonical URLs, hreflang, and locale-native meta helpers. */

import {
  DEFAULT_LANG,
  SITE_LOCALES,
  SITE_ORIGIN,
  absoluteUrl,
  catalogPath,
  capabilityPath,
  contactPath,
  datasheetPath,
  homePath,
  hreflangFor,
  investPath,
  partnersPath,
  productPath,
  solutionPath,
  solutionsIndexPath,
} from "./locales";

export { SITE_ORIGIN, absoluteUrl, hreflangFor };

export function clipMeta(text: string, max = 160) {
  const s = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 90 ? cut.slice(0, sp) : cut).trim()}…`;
}

export function xmlEscape(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function productSeo(
  p: { slug: string; name?: string },
  copy: { name?: string; summary?: string; description?: string; seoTitle?: string; seoDescription?: string },
  lang: string
) {
  const name = copy.name || p.name || p.slug;
  return {
    title: String(copy.seoTitle || `${name} | Circuitbull®`).trim(),
    description: clipMeta(copy.seoDescription || copy.summary || copy.description || name),
    canonical: absoluteUrl(productPath(lang, p.slug)),
    hreflang: hreflangFor((l) => productPath(l, p.slug)),
  };
}

export function datasheetSeo(
  p: { slug: string; name?: string },
  copy: { name?: string; summary?: string; slogan?: string; seoDescription?: string },
  lang: string
) {
  const name = copy.name || p.name || p.slug;
  return {
    title: `${name} · Datasheet | Circuitbull®`,
    description: clipMeta(copy.seoDescription || copy.slogan || copy.summary || name),
    canonical: absoluteUrl(datasheetPath(lang, p.slug)),
    hreflang: hreflangFor((l) => datasheetPath(l, p.slug)),
  };
}

export function solutionSeo(
  need: { slug: string },
  copy: { title?: string; lead?: string; problem?: string; seoTitle?: string; seoDescription?: string },
  lang: string
) {
  const title = copy.title || need.slug;
  return {
    title: String(copy.seoTitle || `${title} | Circuitbull®`).trim(),
    description: clipMeta(copy.seoDescription || copy.lead || copy.problem || title),
    canonical: absoluteUrl(solutionPath(lang, need.slug)),
    hreflang: hreflangFor((l) => solutionPath(l, need.slug)),
  };
}

export function capabilitySeo(
  needSlug: string,
  capSlug: string,
  copy: { title?: string; lead?: string; seoTitle?: string; seoDescription?: string },
  missionTitle: string,
  lang: string
) {
  const title = copy.title || capSlug;
  return {
    title: String(copy.seoTitle || `${title} | ${missionTitle} | Circuitbull®`).trim(),
    description: clipMeta(copy.seoDescription || copy.lead || title),
    canonical: absoluteUrl(capabilityPath(lang, needSlug, capSlug)),
    hreflang: hreflangFor((l) => capabilityPath(l, needSlug, capSlug)),
  };
}

export function xhtmlLinks(pathForLang: (lang: string) => string) {
  const lines = SITE_LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(absoluteUrl(pathForLang(l)))}"/>`
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absoluteUrl(pathForLang(DEFAULT_LANG)))}"/>`
  );
  return lines.join("\n");
}

export function sitemapUrl(
  loc: string,
  priority: string,
  pathForLang?: (lang: string) => string,
  lastmod?: string
) {
  const extra = pathForLang ? `\n${xhtmlLinks(pathForLang)}` : "";
  const lm = lastmod ? `\n    <lastmod>${xmlEscape(String(lastmod).slice(0, 10))}</lastmod>` : "";
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lm}\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>${extra}\n  </url>`;
}

export function staticPathFns() {
  return {
    home: homePath,
    catalog: catalogPath,
    solutions: solutionsIndexPath,
    contact: contactPath,
    partners: partnersPath,
    invest: investPath,
  };
}
