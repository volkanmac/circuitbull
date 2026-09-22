/** Circuitbull locale + country → language mapping (Worker). */

export const DEFAULT_LANG = "en";

export const SITE_LOCALES = ["en", "tr", "ar", "es", "de", "fr", "ru", "zh-Hant", "it", "ko"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  ru: "Русский",
  "zh-Hant": "繁體中文",
  it: "Italiano",
  ko: "한국어",
};

/**
 * Country ISO → available site locales (order = UI preference).
 * English-speaking markets share a single `en` catalog — no en-US / en-GB trees.
 */
export const COUNTRY_TO_LANGS: Record<string, readonly string[]> = {
  // English (shared `en`)
  US: ["en"],
  GB: ["en"],
  AU: ["en"],
  NZ: ["en"],
  IE: ["en"],
  // Multi-language
  CA: ["en", "fr"],
  CH: ["de", "fr", "it"],
  BE: ["fr", "de"],
  // Turkish
  TR: ["tr"],
  // Arabic / GCC
  SA: ["ar"],
  AE: ["ar"],
  EG: ["ar"],
  QA: ["ar"],
  KW: ["ar"],
  BH: ["ar"],
  OM: ["ar"],
  JO: ["ar"],
  MA: ["ar"],
  IQ: ["ar"],
  // German
  DE: ["de"],
  AT: ["de"],
  // French
  FR: ["fr"],
  // Spanish
  ES: ["es"],
  MX: ["es"],
  AR: ["es"],
  CO: ["es"],
  CL: ["es"],
  PE: ["es"],
  // Russian
  RU: ["ru"],
  BY: ["ru"],
  KZ: ["ru"],
  // Chinese (Traditional catalog)
  TW: ["zh-Hant"],
  HK: ["zh-Hant"],
  MO: ["zh-Hant"],
  CN: ["zh-Hant"],
  // Italian / Korean
  IT: ["it"],
  KR: ["ko"],
};

/** Primary language for geo / Accept-Language fallback (first in COUNTRY_TO_LANGS). */
export const COUNTRY_TO_LANG: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_TO_LANGS).map(([cc, langs]) => [cc, langs[0] || DEFAULT_LANG])
);

/** Countries shown in the public selector (curated Circuitbull markets). */
export const SELECTOR_COUNTRIES: { code: string; label: string; langs: readonly string[] }[] = [
  { code: "US", label: "United States", langs: COUNTRY_TO_LANGS.US },
  { code: "GB", label: "United Kingdom", langs: COUNTRY_TO_LANGS.GB },
  { code: "CA", label: "Canada", langs: COUNTRY_TO_LANGS.CA },
  { code: "AU", label: "Australia", langs: COUNTRY_TO_LANGS.AU },
  { code: "NZ", label: "New Zealand", langs: COUNTRY_TO_LANGS.NZ },
  { code: "IE", label: "Ireland", langs: COUNTRY_TO_LANGS.IE },
  { code: "TR", label: "Türkiye", langs: COUNTRY_TO_LANGS.TR },
  { code: "DE", label: "Germany", langs: COUNTRY_TO_LANGS.DE },
  { code: "AT", label: "Austria", langs: COUNTRY_TO_LANGS.AT },
  { code: "CH", label: "Switzerland", langs: COUNTRY_TO_LANGS.CH },
  { code: "FR", label: "France", langs: COUNTRY_TO_LANGS.FR },
  { code: "BE", label: "Belgium", langs: COUNTRY_TO_LANGS.BE },
  { code: "ES", label: "Spain", langs: COUNTRY_TO_LANGS.ES },
  { code: "IT", label: "Italy", langs: COUNTRY_TO_LANGS.IT },
  { code: "MX", label: "Mexico", langs: COUNTRY_TO_LANGS.MX },
  { code: "SA", label: "Saudi Arabia", langs: COUNTRY_TO_LANGS.SA },
  { code: "AE", label: "United Arab Emirates", langs: COUNTRY_TO_LANGS.AE },
  { code: "EG", label: "Egypt", langs: COUNTRY_TO_LANGS.EG },
  { code: "QA", label: "Qatar", langs: COUNTRY_TO_LANGS.QA },
  { code: "KW", label: "Kuwait", langs: COUNTRY_TO_LANGS.KW },
  { code: "IQ", label: "Iraq", langs: COUNTRY_TO_LANGS.IQ },
  { code: "RU", label: "Russia", langs: COUNTRY_TO_LANGS.RU },
  { code: "TW", label: "Taiwan", langs: COUNTRY_TO_LANGS.TW },
  { code: "CN", label: "China", langs: COUNTRY_TO_LANGS.CN },
  { code: "HK", label: "Hong Kong", langs: COUNTRY_TO_LANGS.HK },
  { code: "KR", label: "South Korea", langs: COUNTRY_TO_LANGS.KR },
];

export function langsForCountry(country: string | undefined | null): readonly string[] {
  if (!country) return [DEFAULT_LANG];
  const cc = String(country).trim().toUpperCase();
  return COUNTRY_TO_LANGS[cc] || [DEFAULT_LANG];
}

export function normalizeLang(lang: string | undefined | null): string {
  if (!lang) return DEFAULT_LANG;
  const raw = String(lang).trim();
  if ((SITE_LOCALES as readonly string[]).includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === "zh" || lower === "zh-cn" || lower === "zh-tw" || lower === "zh-hk" || lower === "zh-hant" || lower === "zh-hans") {
    return "zh-Hant";
  }
  const found = SITE_LOCALES.find((l) => l.toLowerCase() === lower);
  return found || DEFAULT_LANG;
}

export function isLocaleParam(lang: string) {
  return (
    (SITE_LOCALES as readonly string[]).includes(lang) ||
    ["zh", "zh-tw", "zh-hk", "zh-cn"].includes(lang.toLowerCase())
  );
}

export function langFromCountry(country: string | undefined | null): string {
  if (!country) return DEFAULT_LANG;
  const cc = String(country).trim().toUpperCase();
  return COUNTRY_TO_LANG[cc] || DEFAULT_LANG;
}

/** Parse Accept-Language header → best site locale. */
export function langFromAcceptLanguage(header: string | undefined | null): string {
  if (!header) return DEFAULT_LANG;
  const parts = header.split(",").map((p) => {
    const [tag, ...params] = p.trim().split(";");
    const q = params.find((x) => x.trim().startsWith("q="));
    return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    if (tag.startsWith("zh")) return "zh-Hant";
    const primary = tag.split("-")[0];
    const mapped = normalizeLang(primary);
    if (mapped !== DEFAULT_LANG || primary === "en") return mapped;
  }
  return DEFAULT_LANG;
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

export function homePath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/" : `/${l}`;
}

export function catalogPath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/products" : `/${l}/products`;
}

export function productPath(lang: string, slug: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? `/products/${slug}` : `/${l}/products/${slug}`;
}

export function datasheetPath(lang: string, slug: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? `/products/${slug}/datasheet` : `/${l}/products/${slug}/datasheet`;
}

export function solutionsIndexPath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/solutions" : `/${l}/solutions`;
}

export function solutionPath(lang: string, need: string) {
  return `/${normalizeLang(lang)}/solutions/${need}`;
}

export function capabilityPath(lang: string, need: string, cap: string) {
  return `/${normalizeLang(lang)}/solutions/${need}/${cap}`;
}

export function partnersPath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/partners" : `/${l}/partners`;
}

export const SITE_ORIGIN = "https://circuitbull.com";
/** Web-to-call switchboard — rings Volls Global IP phone. */
export const CALL_SWITCHBOARD_URL = "https://call.volls.us";
export const HQ_PHONE_DISPLAY = "+1 276 600 2052";

export function absoluteUrl(path: string) {
  const p = String(path || "/");
  if (/^https?:\/\//i.test(p)) return p;
  return `${SITE_ORIGIN}${p.startsWith("/") ? p : `/${p}`}`;
}

export function hreflangFor(pathForLang: (lang: string) => string) {
  return SITE_LOCALES.map((l) => ({ lang: l, href: absoluteUrl(pathForLang(l)) }));
}

export function investPath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/invest" : `/${l}/invest`;
}

export function contactPath(lang: string) {
  const l = normalizeLang(lang);
  return l === DEFAULT_LANG ? "/contact" : `/${l}/contact`;
}

export const LEGAL_SLUGS = ["terms", "gdpr", "data-policy", "code-of-conduct"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug);
}

export function legalPath(lang: string, slug: string) {
  const l = normalizeLang(lang);
  const s = String(slug || "").toLowerCase();
  return l === DEFAULT_LANG ? `/${s}` : `/${l}/${s}`;
}

/** Rewrite a path for a target locale (best-effort). */
export function rewritePathForLang(pathname: string, lang: string): string {
  const l = normalizeLang(lang);
  const path = pathname || "/";

  const ds = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?products\/([^/]+)\/datasheet(?:\.pdf)?\/?$/i);
  if (ds) {
    return datasheetPath(l, ds[2]);
  }
  const prod = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?products(?:\/([^/]+))?\/?$/i);
  if (prod) {
    const slug = prod[2];
    return slug ? productPath(l, slug) : catalogPath(l);
  }
  const solCap =
    path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?solutions\/([^/]+)\/([^/]+)\/?$/i);
  if (solCap && solCap[2] && solCap[3] && solCap[2] !== "solutions") {
    return capabilityPath(l, solCap[2], solCap[3]);
  }
  const solOne = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?solutions\/([^/]+)\/?$/i);
  if (solOne && solOne[2]) return solutionPath(l, solOne[2]);
  const solIdx = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?solutions\/?$/i);
  if (solIdx) return solutionsIndexPath(l);

  const inv = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?invest\/?$/i);
  if (inv) return investPath(l);

  const contact = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?contact\/?$/i);
  if (contact) return contactPath(l);

  const partners = path.match(/^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?partners\/?$/i);
  if (partners) return partnersPath(l);

  const legal = path.match(
    /^\/(?:([a-z]{2}(?:-[a-z]+)?|zh-Hant)\/)?(terms|gdpr|data-policy|code-of-conduct)\/?$/i
  );
  if (legal?.[2]) return legalPath(l, legal[2].toLowerCase());

  if (path === "/" || /^\/([a-z]{2}|zh-Hant)\/?$/i.test(path)) return homePath(l);

  return path;
}
