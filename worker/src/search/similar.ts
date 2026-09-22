/** Semantic (Qdrant + embeddings) + lexical + optional LLM rerank for similar platforms. */

import { displaySku } from "../i18n/facts";
import { normalizeLang } from "../i18n/locales";

export type SimilarEnv = {
  QDRANT_URL?: string;
  QDRANT_API_KEY?: string;
  CF_AI_API_TOKEN?: string;
  CF_AI_ACCOUNT_ID?: string;
  CF_AI_EMBED_MODEL?: string;
  CF_AI_MODEL?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
};

export type FactHit = {
  score: number;
  smartId?: string;
  slug?: string;
  productName?: string;
  fact?: Record<string, unknown>;
};

export type SimilarResult = {
  slugs: string[];
  mode: string;
  query: string;
};

const NEED_HINTS: Record<string, string> = {
  "anti-uav": "counter-UAV C-UAS drone detection radar laser EO/IR thermal PTZ tracker jammer",
  "solar-fleet-ops": "solar farm photovoltaic plant perimeter thermal camera monitoring PTZ",
  "border-control": "border surveillance long-range thermal camera PTZ radar coastal defense",
  "airport-security": "airport runway perimeter thermal PTZ multi-sensor camera",
  "forest-fire": "wildfire forest fire detection thermal camera early warning",
  "aquaculture": "fish farm coastal marine thermal camera surveillance",
  "coastal-surveillance": "coastal maritime radar thermal EO camera",
  "vehicle-mounted": "vehicle-mounted mobile PTZ thermal camera",
};

function aiAccount(env: SimilarEnv) {
  return env.CF_AI_ACCOUNT_ID || env.CF_ACCOUNT_ID || "";
}

function aiToken(env: SimilarEnv) {
  return env.CF_AI_API_TOKEN || env.CF_API_TOKEN || "";
}

function tokens(s: string): string[] {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function missionQuery(opts: { title?: string; problem?: string; slug?: string; extra?: string }) {
  const slug = String(opts.slug || "");
  const hinted = NEED_HINTS[slug] || "";
  return [opts.title, opts.problem, slug.replace(/-/g, " "), hinted, opts.extra, "thermal EO/IR camera sensor PTZ"]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function embedQuery(env: SimilarEnv, text: string): Promise<number[] | null> {
  const account = aiAccount(env);
  const token = aiToken(env);
  if (!account || !token || !text.trim()) return null;
  const model = env.CF_AI_EMBED_MODEL || "@cf/baai/bge-base-en-v1.5";
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text.slice(0, 1200)] }),
    });
    const json = (await res.json()) as any;
    if (!res.ok || json.success === false) return null;
    const data = json.result?.data || json.result;
    if (Array.isArray(data?.[0])) return data[0];
    if (Array.isArray(data) && typeof data[0] === "number") return data;
    return null;
  } catch {
    return null;
  }
}

async function qdrantSearch(
  env: SimilarEnv,
  collection: string,
  vector: number[],
  limit: number
): Promise<{ slug: string; score: number }[]> {
  const url = (env.QDRANT_URL || "").replace(/\/$/, "");
  const key = env.QDRANT_API_KEY;
  if (!url || !key) return [];
  try {
    const searchRes = await fetch(`${url}/collections/${collection}/points/search`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ vector, limit: Math.min(40, Math.max(limit, 12)), with_payload: true }),
    });
    if (!searchRes.ok) return [];
    const searchJson = (await searchRes.json()) as any;
    const out: { slug: string; score: number }[] = [];
    for (const r of searchJson.result || []) {
      const slug = r.payload?.slug;
      if (!slug) continue;
      out.push({ slug, score: Number(r.score || 0) });
    }
    return out;
  } catch {
    return [];
  }
}

export async function searchFactHits(env: SimilarEnv, q: string, lang: string, limit: number): Promise<FactHit[]> {
  const vector = await embedQuery(env, q);
  if (!vector) return [];
  const catalog = await qdrantSearch(env, "catalog_products", vector, limit);
  if (catalog.length) {
    return catalog.map((r) => ({ score: r.score, slug: r.slug }));
  }
  const url = (env.QDRANT_URL || "").replace(/\/$/, "");
  const key = env.QDRANT_API_KEY;
  if (!url || !key || !q.trim()) return [];
  try {
    const searchRes = await fetch(`${url}/collections/product_facts/points/search`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        vector,
        limit: Math.min(80, Math.max(limit, 24)),
        with_payload: true,
      }),
    });
    const searchJson = (await searchRes.json()) as any;
    const results = searchJson.result || [];
    const prefer = normalizeLang(lang || "en");
    return results.map((r: any) => ({
      score: Number(r.score || 0) + (r.payload?.lang === prefer ? 0.02 : 0),
      smartId: r.payload?.smartId,
      slug: r.payload?.slug,
      productName: r.payload?.text?.split("|").pop()?.trim(),
      fact: {
        id: r.payload?.factId,
        groupKey: r.payload?.groupKey,
        propertyId: r.payload?.propertyId,
        propertyKey: r.payload?.propertyKey,
        groupLabel: r.payload?.groupLabel,
        label: r.payload?.label,
        value: r.payload?.value,
        lang: r.payload?.lang,
      },
    }));
  } catch {
    return [];
  }
}

function hayFor(p: any, lang: string): string {
  const l = normalizeLang(lang);
  const copy = p?.i18n?.[l] || p?.i18n?.en || {};
  return [
    p.slug,
    p.model,
    p.sku,
    p.smartId,
    p.name,
    copy.name,
    p.summary,
    copy.summary,
    (p.needSlugs || []).join(" "),
    (copy.applications || p.applications || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function lexicalScores(products: any[], query: string, lang: string, exclude: Set<string>) {
  const words = tokens(query);
  const scored: { slug: string; score: number }[] = [];
  if (!words.length) return scored;
  for (const p of products) {
    if (!p?.slug || exclude.has(p.slug)) continue;
    const hay = hayFor(p, lang);
    const name = String(p?.i18n?.[normalizeLang(lang)]?.name || p.name || "").toLowerCase();
    const slug = String(p.slug).toLowerCase();
    let score = 0;
    for (const w of words) {
      if (slug.includes(w)) score += 3;
      else if (name.includes(w)) score += 2;
      else if (hay.includes(w)) score += 1;
    }
    if (score > 0) scored.push({ slug: p.slug, score: score / words.length });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function mergeScores(semantic: { slug: string; score: number }[], lexical: { slug: string; score: number }[]) {
  const map = new Map<string, number>();
  for (const s of semantic) map.set(s.slug, (map.get(s.slug) || 0) + s.score * 2);
  for (const s of lexical) map.set(s.slug, (map.get(s.slug) || 0) + s.score);
  return [...map.entries()]
    .map(([slug, score]) => ({ slug, score }))
    .sort((a, b) => b.score - a.score);
}

function parseSlugList(text: string, allowed: Set<string>): string[] {
  const match = String(text || "").match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const item of arr) {
      const slug = typeof item === "string" ? item : item?.slug;
      if (slug && allowed.has(slug) && !out.includes(slug)) out.push(slug);
    }
    return out;
  } catch {
    return [];
  }
}

async function llmRerank(
  env: SimilarEnv,
  query: string,
  candidates: { slug: string; sku: string; name: string; summary: string }[],
  limit: number
): Promise<string[] | null> {
  const account = aiAccount(env);
  const token = aiToken(env);
  if (!account || !token || candidates.length < 3) return null;
  const model = env.CF_AI_MODEL || "@cf/moonshotai/kimi-k2.7-code";
  const compact = candidates.slice(0, 16).map((c) => ({
    slug: c.slug,
    sku: c.sku,
    name: c.name,
    summary: String(c.summary || "").slice(0, 140),
  }));
  const body = {
    messages: [
      {
        role: "system",
        content:
          "You match military sensor catalog platforms to an operational need. Reply with JSON only: an array of slugs from the candidates, most relevant first.",
      },
      {
        role: "user",
        content: `Need: ${query.slice(0, 600)}\nCandidates: ${JSON.stringify(compact)}\nReturn at most ${limit} slugs.`,
      },
    ],
    max_tokens: 400,
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2200);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as any;
    const text = json.result?.response || json.result?.output_text || json.result?.message?.content || "";
    const slugs = parseSlugList(String(text), new Set(candidates.map((c) => c.slug)));
    return slugs.length ? slugs.slice(0, limit) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function recommendSimilarProducts(
  env: SimilarEnv,
  opts: {
    query: string;
    lang: string;
    products: any[];
    excludeSlugs?: string[];
    limit?: number;
  }
): Promise<SimilarResult> {
  const query = String(opts.query || "").replace(/\s+/g, " ").trim();
  const lang = normalizeLang(opts.lang || "en");
  const limit = Math.min(12, Math.max(1, opts.limit || 8));
  const exclude = new Set((opts.excludeSlugs || []).filter(Boolean));
  const products = opts.products || [];
  if (!query || !products.length) return { slugs: [], mode: "empty", query };

  const factHits = await searchFactHits(env, query, lang, 48);
  const semanticMap = new Map<string, number>();
  for (const h of factHits) {
    if (!h.slug || exclude.has(h.slug)) continue;
    semanticMap.set(h.slug, Math.max(semanticMap.get(h.slug) || 0, Number(h.score || 0)));
  }
  const semantic = [...semanticMap.entries()].map(([slug, score]) => ({ slug, score }));
  const lexical = lexicalScores(products, query, lang, exclude);
  const merged = mergeScores(semantic, lexical).filter((x) => products.some((p) => p.slug === x.slug));
  let slugs = merged.slice(0, limit).map((x) => x.slug);
  let mode = semantic.length ? (lexical.length ? "hybrid" : "semantic") : lexical.length ? "lexical" : "none";

  const pool = merged.slice(0, 16);
  if (pool.length >= 3) {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const candidates = pool
      .map((x) => {
        const p = bySlug.get(x.slug);
        if (!p) return null;
        const copy = p.i18n?.[lang] || p.i18n?.en || {};
        return {
          slug: p.slug,
          sku: displaySku(p),
          name: copy.name || p.name || p.slug,
          summary: copy.summary || p.summary || "",
        };
      })
      .filter(Boolean) as { slug: string; sku: string; name: string; summary: string }[];
    const ranked = await llmRerank(env, query, candidates, limit);
    if (ranked?.length) {
      const rest = slugs.filter((s) => !ranked.includes(s));
      slugs = [...ranked, ...rest].slice(0, limit);
      mode = `${mode}+llm`;
    }
  }

  return { slugs, mode, query };
}
