/** Supported Circuitbull site locales (ISO 639-1 + script where needed). */

export const DEFAULT_LOCALE = "en";

/** Practical set used on product / solution routes */
export const SUPPORTED_LOCALES = (
  process.env.SUPPORTED_LOCALES ||
  "en,tr,ar,es,de,fr,ru,zh-Hant,it,ko"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const LOCALE_META = {
  en: { name: "English", dir: "ltr" },
  tr: { name: "Türkçe", dir: "ltr" },
  ar: { name: "العربية", dir: "rtl" },
  es: { name: "Español", dir: "ltr" },
  de: { name: "Deutsch", dir: "ltr" },
  fr: { name: "Français", dir: "ltr" },
  ru: { name: "Русский", dir: "ltr" },
  "zh-Hant": { name: "繁體中文", dir: "ltr" },
  it: { name: "Italiano", dir: "ltr" },
  ko: { name: "한국어", dir: "ltr" },
  pt: { name: "Português", dir: "ltr" },
  ja: { name: "日本語", dir: "ltr" },
  nl: { name: "Nederlands", dir: "ltr" },
  pl: { name: "Polski", dir: "ltr" },
  uk: { name: "Українська", dir: "ltr" },
  sv: { name: "Svenska", dir: "ltr" },
  id: { name: "Bahasa Indonesia", dir: "ltr" },
  vi: { name: "Tiếng Việt", dir: "ltr" },
  th: { name: "ไทย", dir: "ltr" },
  hi: { name: "हिन्दी", dir: "ltr" },
};

export function isSupportedLocale(lang) {
  return SUPPORTED_LOCALES.includes(lang);
}

export function normalizeLocale(lang) {
  if (!lang) return DEFAULT_LOCALE;
  const raw = String(lang).trim();
  if (isSupportedLocale(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === "zh" || lower === "zh-tw" || lower === "zh-hk" || lower === "zh-hant") return "zh-Hant";
  if (lower === "zh-cn" || lower === "zh-hans") return "zh-Hant"; // site uses Traditional for zh
  const found = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === lower);
  return found || DEFAULT_LOCALE;
}

/** Pick product/need copy for a locale with English fallback. */
export function pickI18n(doc, lang, fallback = DEFAULT_LOCALE) {
  const i18n = doc?.i18n || {};
  const l = normalizeLocale(lang);
  return i18n[l] || i18n[fallback] || i18n.en || {};
}

export function emptyLocaleBlock(partial = {}) {
  return {
    name: "",
    summary: "",
    description: "",
    benefits: [],
    overview: [],
    applications: [],
    translated: false,
    ...partial,
  };
}
