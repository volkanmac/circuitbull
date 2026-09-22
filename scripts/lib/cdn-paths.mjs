/**
 * Slug-based CDN object keys for circuitbull-media.
 * Primary image: products/{slug}.jpg
 * Extras:        products/{slug}-2.jpg
 * AI hero:       products/{slug}-ai-hero.jpg
 * Cleaned still: products/{slug}-cleaned.jpg
 * Source backup: products/{slug}-source.jpg
 * Datasheet HTML: products/{slug}.html , products/{slug}-{lang}.html
 * Catalog PDF:    products/{slug}.pdf , products/{slug}-{lang}.pdf
 * Solutions:     solutions/{needSlug}.jpg / .mp4
 */

const CDN_BASE = process.env.CDN_BASE || "https://cdn.circuitbull.com";

export function sanitizeMediaSlug(input) {
  const s = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
  return s || "item";
}

function shortSmartSuffix(smartId) {
  const m = String(smartId || "").match(/(\d{4,})$/);
  if (m) return m[1];
  const cleaned = sanitizeMediaSlug(smartId).replace(/^smartid-/, "").replace(/^cb-/, "");
  return cleaned.slice(-8) || "x";
}

/**
 * Allocate a unique media slug for a product (uses product.slug when present).
 * @param {object} p
 * @param {Set<string>} used
 */
export function allocateProductMediaSlug(p, used = new Set()) {
  let base = sanitizeMediaSlug(p.slug || p.name || p.sourceId || p._id);
  if (!base || used.has(base)) {
    const suf = shortSmartSuffix(p.smartId) || sanitizeMediaSlug(p.sourceId || p._id).slice(-8);
    base = sanitizeMediaSlug(`${base || "product"}-${suf}`);
    let n = 2;
    while (used.has(base)) {
      base = sanitizeMediaSlug(`${p.slug || "product"}-${suf}-${n++}`);
    }
  }
  used.add(base);
  return base;
}

export function allocateNeedMediaSlug(need, used = new Set()) {
  let base = sanitizeMediaSlug(need.slug || need.solutionSlug || need._id);
  if (used.has(base)) {
    base = sanitizeMediaSlug(`${base}-${String(need._id).slice(-6)}`);
    let n = 2;
    while (used.has(base)) base = sanitizeMediaSlug(`${need.slug}-${n++}`);
  }
  used.add(base);
  return base;
}

/** @param {number} index 0-based */
export function productImageKey(mediaSlug, index, ext = ".jpg") {
  const e = normalizeExt(ext);
  if (index <= 0) return `products/${mediaSlug}${e}`;
  return `products/${mediaSlug}-${index + 1}${e}`;
}

/** Legacy datasheet keys keyed by model/media slug (kept for old objects). */
export function productDatasheetKey(mediaSlug, lang = null) {
  if (lang) return `products/${mediaSlug}-${lang}.html`;
  return `products/${mediaSlug}.html`;
}

/**
 * Filename slug from the product's display name in the selected language.
 * Keeps letters from any script (Arabic, CJK, Cyrillic, Turkish). Spaces → dashes.
 */
export function datasheetNameSlug(input, { max = 160 } = {}) {
  const normalized = String(input || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = [...normalized].slice(0, max).join("").replace(/-+$/g, "");
  return cut || "product";
}

export function productNameForLang(p, lang = "en") {
  const l = String(lang || "en");
  return (
    p?.i18n?.[l]?.name ||
    p?.datasheet?.i18n?.[l]?.name ||
    (l === "en" ? p?.name : "") ||
    p?.i18n?.en?.name ||
    p?.name ||
    p?.model ||
    p?.slug ||
    "product"
  );
}

/**
 * Unique name slug. Reuse is allowed when the caller already owns `base`
 * (same product, same localized title). Collisions with other products get a model/id suffix.
 */
export function allocateDatasheetNameSlug(name, used, uniqueHint = "") {
  const base = datasheetNameSlug(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const hint = datasheetNameSlug(uniqueHint || "x");
  let candidate = `${base}-${hint}`.replace(/-{2,}/g, "-").replace(/-+$/g, "");
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${hint}-${n++}`.replace(/-{2,}/g, "-");
  }
  used.add(candidate);
  return candidate;
}

/** Map locale → unique name slug for one product. Same title shares one file. */
export function datasheetNameSlugsForProduct(p, usedGlobal, langs = ["en"]) {
  const hint = p.model || p.slug || p.sourceId || "";
  const byLang = {};
  const owned = new Set();
  for (const lang of langs) {
    const name = productNameForLang(p, lang);
    const base = datasheetNameSlug(name);
    if (owned.has(base) || Object.values(byLang).includes(base)) {
      byLang[lang] = Object.values(byLang).find((s) => s === base) || base;
      continue;
    }
    const slug = usedGlobal.has(base) ? allocateDatasheetNameSlug(name, usedGlobal, hint) : base;
    if (!usedGlobal.has(slug)) usedGlobal.add(slug);
    owned.add(slug);
    byLang[lang] = slug;
  }
  return byLang;
}

export function productNameDatasheetKey(nameSlug) {
  return `products/${nameSlug}.html`;
}

export function encodeCdnKey(key) {
  return String(key || "")
    .replace(/^\//, "")
    .split("/")
    .map((seg) => {
      try {
        if (decodeURIComponent(seg) !== seg) return seg;
      } catch {
        /* keep */
      }
      return encodeURIComponent(seg);
    })
    .join("/");
}

/** Catalog A4 PDF (generated), distinct from scraped source PDFs. */
export function productCatalogPdfKey(mediaSlug, lang = null) {
  if (lang && lang !== "en") return `products/${mediaSlug}-${lang}.pdf`;
  return `products/${mediaSlug}.pdf`;
}

export function productPdfKey(mediaSlug, index = 0) {
  return `products/${mediaSlug}-datasheet-${index}.pdf`;
}

/** AI-generated product still (distinct from catalog primary image). */
export function productAiHeroKey(mediaSlug, ext = ".jpg") {
  return `products/${sanitizeMediaSlug(mediaSlug)}-ai-hero${normalizeExt(ext)}`;
}

/** Logo-cleaned + military-background product still (new default candidate). */
export function productCleanedKey(mediaSlug, ext = ".jpg") {
  return `products/${sanitizeMediaSlug(mediaSlug)}-cleaned${normalizeExt(ext)}`;
}

/** Frozen original scraped catalog still, kept after promotion. */
export function productSourceKey(mediaSlug, ext = ".jpg") {
  return `products/${sanitizeMediaSlug(mediaSlug)}-source${normalizeExt(ext)}`;
}

export function solutionImageKey(needSlug, ext = ".jpg") {
  return `solutions/${sanitizeMediaSlug(needSlug)}${normalizeExt(ext)}`;
}

export function solutionVideoKey(needSlug, ext = ".mp4") {
  return `solutions/${sanitizeMediaSlug(needSlug)}${normalizeExt(ext)}`;
}

export function toCdnUrl(keyOrPath) {
  const s = String(keyOrPath || "");
  if (!s) return s;
  const prefix = `${CDN_BASE}/`;
  if (s.startsWith(prefix) || s.startsWith("https://cdn.circuitbull.com/")) {
    const rest = s.replace(/^https:\/\/cdn\.circuitbull\.com\//, "").replace(prefix, "");
    return `${CDN_BASE}/${encodeCdnKey(rest)}`;
  }
  if (s.startsWith("/cdn/")) return `${CDN_BASE}/${encodeCdnKey(s.slice(5))}`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `${CDN_BASE}/${encodeCdnKey(s)}`;
}

export function cdnKeyFromUrl(url) {
  const s = String(url || "");
  const bases = [CDN_BASE, "https://cdn.circuitbull.com", "https://circuitbull.com/cdn", "http://circuitbull.com/cdn"];
  let rest = null;
  for (const b of bases) {
    if (s.startsWith(`${b}/`)) {
      rest = s.slice(b.length + 1);
      break;
    }
  }
  if (rest == null && s.startsWith("/cdn/")) rest = s.slice(5);
  if (rest == null) return null;
  return rest
    .split("/")
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .join("/");
}

/** True if key looks like legacy ID folder: products/40838041/... */
export function isLegacyIdProductKey(key) {
  return /^products\/\d+\//.test(String(key || ""));
}

export function legacyProductIdFromKey(key) {
  const m = String(key || "").match(/^products\/(\d+)\//);
  return m ? m[1] : null;
}

export function normalizeExt(ext, fallback = ".jpg") {
  let e = String(ext || fallback).toLowerCase();
  if (!e.startsWith(".")) e = `.${e}`;
  if (e === ".jpeg") e = ".jpg";
  return e;
}

export function extFromUrlOrKey(url, fallback = ".jpg") {
  const m = String(url || "")
    .toLowerCase()
    .match(/\.(jpg|jpeg|png|webp|gif|pdf|svg|html|mp4|webm)(?:\?|$)/);
  if (!m) return normalizeExt(fallback);
  return normalizeExt(m[1]);
}

export { CDN_BASE };
