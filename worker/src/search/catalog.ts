/** Compact platform search index — Redis-first, KV fallback. */

import { displaySku, isGarbageGroup, isGarbageProperty, localizeFact } from "../i18n/facts";
import { DEFAULT_LANG, normalizeLang, productPath } from "../i18n/locales";
import { cdnUrl } from "../ui/shell";
import { redisGet } from "./redis";

export const PLATFORM_INDEX_VERSION = 1;
export const platformIndexKey = (lang: string) => `catalog:search:${normalizeLang(lang)}`;

export type PlatformCard = {
  slug: string;
  sku: string;
  name: string;
  summary: string;
  image: string;
  path: string;
  model?: string;
  hay: string;
};

export type PlatformIndex = {
  v: number;
  lang: string;
  builtAt: string;
  count: number;
  items: PlatformCard[];
};

type IndexEnv = { DATA: KVNamespace; REDIS_URL?: string };

const mem = new Map<string, { at: number; index: PlatformIndex; source: string }>();
const MEM_TTL_MS = 45_000;

function copyField(p: any, lang: string, key: "name" | "summary"): string {
  const l = normalizeLang(lang);
  return String(p?.i18n?.[l]?.[key] || p?.i18n?.en?.[key] || p?.[key] || "");
}

function hayFor(p: any, lang: string, sku: string, name: string, summary: string): string {
  const parts: string[] = [
    sku,
    p.smartId || "",
    p.sku || "",
    p.model || "",
    p.slug || "",
    name,
    summary,
  ];
  for (const f of (p.facts || []).slice(0, 40)) {
    if (isGarbageGroup(f.groupKey) || isGarbageProperty(f.propertyKey)) continue;
    const loc = localizeFact(f, lang);
    if (loc.label) parts.push(loc.label);
    if (loc.value) parts.push(String(loc.value));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 1800);
}

export function buildPlatformIndex(products: any[], lang: string): PlatformIndex {
  const l = normalizeLang(lang);
  const items: PlatformCard[] = [];
  for (const p of products || []) {
    if (!p?.slug) continue;
    const sku = displaySku(p);
    const name = copyField(p, l, "name");
    const summary = copyField(p, l, "summary");
    items.push({
      slug: p.slug,
      sku,
      name,
      summary,
      image: p.image ? cdnUrl(p.image) : "",
      path: productPath(l, p.slug),
      model: p.model || "",
      hay: hayFor(p, l, sku, name, summary),
    });
  }
  return {
    v: PLATFORM_INDEX_VERSION,
    lang: l,
    builtAt: new Date().toISOString(),
    count: items.length,
    items,
  };
}

function parseIndex(raw: unknown): PlatformIndex | null {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data || !Array.isArray(data.items)) return null;
    return data as PlatformIndex;
  } catch {
    return null;
  }
}

async function kvGetJson(kv: KVNamespace, key: string): Promise<any | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadPlatformIndex(
  env: IndexEnv,
  lang: string
): Promise<{ index: PlatformIndex; source: "memory" | "redis" | "kv-index" | "kv-products" }> {
  const l = normalizeLang(lang || DEFAULT_LANG);
  const hit = mem.get(l);
  if (hit && Date.now() - hit.at < MEM_TTL_MS) {
    return { index: hit.index, source: "memory" };
  }

  const key = platformIndexKey(l);

  if (env.REDIS_URL) {
    const raw = await redisGet(env.REDIS_URL, key);
    const fromRedis = parseIndex(raw);
    if (fromRedis?.items?.length) {
      mem.set(l, { at: Date.now(), index: fromRedis, source: "redis" });
      return { index: fromRedis, source: "redis" };
    }
  }

  const fromKv = parseIndex(await kvGetJson(env.DATA, key));
  if (fromKv?.items?.length) {
    mem.set(l, { at: Date.now(), index: fromKv, source: "kv-index" });
    return { index: fromKv, source: "kv-index" };
  }

  const products = (await kvGetJson(env.DATA, "products")) || [];
  const built = buildPlatformIndex(products, l);
  if (built.count) mem.set(l, { at: Date.now(), index: built, source: "kv-products" });
  return { index: built, source: "kv-products" };
}

function scorePlatform(p: PlatformCard, needle: string, words: string[]): number {
  const sku = (p.sku || "").toLowerCase();
  const skuCompact = sku.replace(/[^a-z0-9]/g, "");
  const needleCompact = needle.replace(/[^a-z0-9]/g, "");
  const name = (p.name || "").toLowerCase();
  const hay = (p.hay || `${sku} ${name} ${p.summary || ""} ${p.slug || ""} ${p.model || ""}`).toLowerCase();

  if (sku === needle || (needleCompact && skuCompact === needleCompact)) return 100;
  if (sku.startsWith(needle) || (needleCompact && skuCompact.startsWith(needleCompact))) return 92;
  if (sku.includes(needle)) return 88;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 68;
  if (hay.includes(needle)) return 52;
  if (words.length > 1 && words.every((w) => hay.includes(w))) return 40;
  return 0;
}

export function filterPlatforms(items: PlatformCard[], q: string, limit = 24): PlatformCard[] {
  const needle = String(q || "").trim().toLowerCase();
  const cap = Math.min(60, Math.max(1, limit));
  if (!needle) return items.slice(0, Math.min(cap, 12));
  const words = needle.split(/\s+/).filter(Boolean);
  const scored: { s: number; p: PlatformCard }[] = [];
  for (const p of items) {
    const s = scorePlatform(p, needle, words);
    if (s > 0) scored.push({ s, p });
  }
  scored.sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, cap).map((x) => x.p);
}

export function publicPlatformCard(p: PlatformCard) {
  return {
    slug: p.slug,
    sku: p.sku,
    smartId: p.sku,
    name: p.name,
    summary: p.summary,
    image: p.image,
    path: p.path,
    model: p.model || "",
  };
}
