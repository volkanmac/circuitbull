/** Compact Find-platforms index for Redis + KV. */

import { createClient } from "redis";
import { toCdnUrl } from "./cdn-paths.mjs";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, pickI18n } from "./locales.mjs";

export const platformIndexKey = (lang) => `catalog:search:${lang || DEFAULT_LOCALE}`;

export function displaySku(p) {
  const raw = String(p?.sku || p?.smartId || "").trim();
  if (!raw) return p?.model || "SKU";
  if (/^SMARTID-/i.test(raw)) {
    const m = raw.match(/(\d{6})$/);
    if (m) return `Cb-${m[1]}`;
  }
  return raw;
}

function productPath(lang, slug) {
  return lang === DEFAULT_LOCALE ? `/products/${slug}` : `/${lang}/products/${slug}`;
}

function hayFor(p, lang, sku, name, summary) {
  const parts = [sku, p.smartId || "", p.sku || "", p.model || "", p.slug || "", name, summary];
  for (const f of (p.facts || []).slice(0, 40)) {
    const gk = String(f.groupKey || "");
    const pk = String(f.propertyKey || "");
    if (/^(items?|data|value|values|specs?|null|untitled|unknown)$/i.test(gk)) continue;
    if (/^(item[_\s-]?\d*|items?|value|values)$/i.test(pk)) continue;
    const block = f.i18n?.[lang] || f.i18n?.en || {};
    if (block.label) parts.push(block.label);
    if (block.value) parts.push(String(block.value));
    else if (f.value) parts.push(String(f.value));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 1800);
}

export function buildPlatformIndex(products, lang) {
  const l = lang || DEFAULT_LOCALE;
  const items = [];
  for (const p of products || []) {
    if (!p?.slug) continue;
    const copy = pickI18n(p, l);
    const sku = displaySku(p);
    const name = copy.name || p.name || "";
    const summary = copy.summary || p.summary || "";
    items.push({
      slug: p.slug,
      sku,
      name,
      summary,
      image: p.image ? toCdnUrl(p.image) : "",
      path: productPath(l, p.slug),
      model: p.model || "",
      hay: hayFor(p, l, sku, name, summary),
    });
  }
  return {
    v: 1,
    lang: l,
    builtAt: new Date().toISOString(),
    count: items.length,
    items,
  };
}

export async function syncPlatformSearchIndex({ products, putKey, nsId }) {
  const langs = SUPPORTED_LOCALES.length ? SUPPORTED_LOCALES : [DEFAULT_LOCALE];
  const indexes = langs.map((lang) => buildPlatformIndex(products, lang));

  let redisOk = false;
  if (process.env.REDIS_URL) {
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (e) => console.warn("redis", e.message));
    await redis.connect();
    for (const index of indexes) {
      await redis.set(platformIndexKey(index.lang), JSON.stringify(index));
    }
    await redis.quit();
    redisOk = true;
  }

  if (putKey && nsId) {
    for (const index of indexes) {
      await putKey(nsId, platformIndexKey(index.lang), index);
    }
  }

  return {
    redis: redisOk,
    langs: indexes.map((i) => ({ lang: i.lang, count: i.count })),
  };
}
