/** Circuitbull® Facebook Page publisher: 3h cron, rotating site locale, product photo + mission copy. */

import { displaySku } from "../i18n/facts";
import {
  DEFAULT_LANG,
  SITE_LOCALES,
  normalizeLang,
  productPath,
  solutionPath,
  SITE_ORIGIN,
} from "../i18n/locales";
import {
  SOLUTION_SLUGS,
  matchSolutionSlug,
  solutionCopy,
  solutionScene,
} from "../solutions";
import { cdnUrl } from "../ui/shell";

export const FACEBOOK_KV_KEY = "config:facebook";
export const FACEBOOK_STATE_KEY = "social:facebook:state";
export const FACEBOOK_INTERVAL_MS = 3 * 60 * 60 * 1000;

export type FacebookEnv = {
  DATA: KVNamespace;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_TOKEN?: string;
  FACEBOOK_GRAPH_VERSION?: string;
  FACEBOOK_DRY_RUN?: string;
  CF_AI_API_TOKEN?: string;
  CF_AI_ACCOUNT_ID?: string;
  CF_AI_MODEL?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
};

export type FacebookSettings = {
  pageId: string;
  token: string;
  graphVersion: string;
  dryRun: boolean;
};

export type FacebookSlot = {
  index: number;
  lang: string;
  kind: "product" | "solution";
  at: number;
};

export type FacebookDraft = {
  lang: string;
  kind: "product" | "solution";
  slug: string;
  sku?: string;
  name: string;
  solutionSlug: string;
  solutionTitle: string;
  imageUrl: string;
  pageUrl: string;
  caption: string;
  captionSource: "agent" | "template";
};

export type FacebookState = {
  lastSlot?: number;
  lastAt?: string;
  lastLang?: string;
  lastKind?: string;
  lastSlug?: string;
  lastPostId?: string;
  lastError?: string;
  recent?: Array<{
    slot: number;
    lang: string;
    kind: string;
    slug: string;
    postId?: string;
    at: string;
    dry?: boolean;
  }>;
  postedSlugs?: string[];
};

type NeedRow = {
  slug?: string;
  code?: string;
  i18n?: Record<string, { title?: string; lead?: string; problem?: string }>;
};

const LOCALE_NAME: Record<string, string> = {
  en: "English",
  tr: "Turkish",
  ar: "Arabic",
  es: "Spanish",
  de: "German",
  fr: "French",
  ru: "Russian",
  "zh-Hant": "Traditional Chinese",
  it: "Italian",
  ko: "Korean",
};

const HASHTAGS: Record<string, string> = {
  en: "#Circuitbull #ThermalImaging #MissionSensors",
  tr: "#Circuitbull #TermalGörüntüleme #GörevSensörleri",
  ar: "#Circuitbull #التصوير_الحراري",
  es: "#Circuitbull #ImagenTérmica #Sensores",
  de: "#Circuitbull #Wärmebild #Einsatzsensoren",
  fr: "#Circuitbull #ImagerieThermique #Capteurs",
  ru: "#Circuitbull #Тепловизор",
  "zh-Hant": "#Circuitbull #熱成像",
  it: "#Circuitbull #Termico #Sensori",
  ko: "#Circuitbull #열화상",
};

const COPY: Record<
  string,
  { kicker: string; fielded: string; see: string; mission: string }
> = {
  en: {
    kicker: "Circuitbull® mission catalog",
    fielded: "Specified for",
    see: "Open the platform",
    mission: "Open the mission",
  },
  tr: {
    kicker: "Circuitbull® görev kataloğu",
    fielded: "Görev",
    see: "Platformu aç",
    mission: "Görevi aç",
  },
  ar: {
    kicker: "كتالوج Circuitbull® للمهام",
    fielded: "محدد لـ",
    see: "افتح المنصة",
    mission: "افتح المهمة",
  },
  es: {
    kicker: "Catálogo de misión Circuitbull®",
    fielded: "Especificado para",
    see: "Abrir la plataforma",
    mission: "Abrir la misión",
  },
  de: {
    kicker: "Circuitbull® Einsatzkatalog",
    fielded: "Spezifiziert für",
    see: "Plattform öffnen",
    mission: "Einsatz öffnen",
  },
  fr: {
    kicker: "Catalogue de mission Circuitbull®",
    fielded: "Spécifié pour",
    see: "Ouvrir la plateforme",
    mission: "Ouvrir la mission",
  },
  ru: {
    kicker: "Каталог миссий Circuitbull®",
    fielded: "Для задачи",
    see: "Открыть платформу",
    mission: "Открыть миссию",
  },
  "zh-Hant": {
    kicker: "Circuitbull® 任務型錄",
    fielded: "適用於",
    see: "開啟平台",
    mission: "開啟任務",
  },
  it: {
    kicker: "Catalogo missione Circuitbull®",
    fielded: "Specificato per",
    see: "Apri la piattaforma",
    mission: "Apri la missione",
  },
  ko: {
    kicker: "Circuitbull® 미션 카탈로그",
    fielded: "적용 임무",
    see: "플랫폼 열기",
    mission: "미션 열기",
  },
};

function trim(s: unknown) {
  return String(s || "").trim();
}

function truthy(s: unknown) {
  return /^(1|true|yes|on)$/i.test(trim(s));
}

export function mergeFacebookSettings(env: FacebookEnv, kv?: Record<string, unknown> | null): FacebookSettings {
  const row = kv && typeof kv === "object" ? kv : {};
  return {
    pageId: trim(env.FACEBOOK_PAGE_ID) || trim(row.pageId),
    token: trim(env.FACEBOOK_PAGE_TOKEN) || trim(row.token),
    graphVersion: trim(env.FACEBOOK_GRAPH_VERSION) || trim(row.graphVersion) || "v21.0",
    dryRun: truthy(env.FACEBOOK_DRY_RUN) || truthy(row.dryRun),
  };
}

export async function loadFacebookSettings(env: FacebookEnv): Promise<FacebookSettings> {
  let row: Record<string, unknown> | null = null;
  try {
    const raw = await env.DATA.get(FACEBOOK_KV_KEY);
    if (raw) row = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    row = null;
  }
  return mergeFacebookSettings(env, row);
}

export function facebookReady(s: FacebookSettings) {
  return Boolean(s.pageId && s.token);
}

export function facebookSlot(at = Date.now()): FacebookSlot {
  const index = Math.floor(at / FACEBOOK_INTERVAL_MS);
  const lang = SITE_LOCALES[index % SITE_LOCALES.length] || DEFAULT_LANG;
  const kind: FacebookSlot["kind"] = Math.floor(index / SITE_LOCALES.length) % 2 === 0 ? "product" : "solution";
  return { index, lang, kind, at };
}

export function nextFacebookSlot(at = Date.now()) {
  const slot = facebookSlot(at);
  const nextAt = (slot.index + 1) * FACEBOOK_INTERVAL_MS;
  return { ...facebookSlot(nextAt), at: nextAt };
}

function productCopy(p: any, lang: string) {
  const l = normalizeLang(lang);
  const block = p?.i18n?.[l] || p?.i18n?.en || {};
  return {
    name: block.name || p?.name || "",
    summary: block.summary || p?.summary || "",
    description: block.description || p?.description || "",
    applications: block.applications?.length ? block.applications : p?.applications || [],
  };
}

function productImageKey(p: any) {
  return trim(p?.media?.aiHero || p?.image || (Array.isArray(p?.images) ? p.images[0] : "") || "");
}

function publicImageUrl(key: string) {
  const url = cdnUrl(key);
  if (!url) return "";
  if (url.includes("?")) return url;
  return `${url}?v=20260922fb`;
}

function solutionImageUrl(slug: string) {
  const scene = solutionScene(slug);
  if (!scene) return "";
  return publicImageUrl(scene.key);
}

function linkedSolutionSlug(p: any): string {
  const fromNeeds = (p?.needSlugs || []).map((s: string) => String(s || "").trim()).filter(Boolean);
  for (const s of fromNeeds) {
    if ((SOLUTION_SLUGS as readonly string[]).includes(s)) return s;
  }
  for (const label of p?.applications || []) {
    const slug = matchSolutionSlug(String(label));
    if (slug) return slug;
  }
  return SOLUTION_SLUGS[0];
}

function clip(s: string, n: number) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trim()}…`;
}

function templateCaption(draft: Omit<FacebookDraft, "caption" | "captionSource">): string {
  const ui = COPY[draft.lang] || COPY.en;
  const tags = HASHTAGS[draft.lang] || HASHTAGS.en;
  const lead = clip(draft.kind === "product" ? `${draft.name}. ${draft.sku || ""}`.trim() : draft.solutionTitle, 180);
  const body =
    draft.kind === "product"
      ? `${ui.kicker}\n${lead}\n${ui.fielded}: ${draft.solutionTitle}.\n${ui.see}\n${draft.pageUrl}\n\n${tags}`
      : `${ui.kicker}\n${draft.solutionTitle}\n${ui.fielded}: ${draft.name}${draft.sku ? ` · ${draft.sku}` : ""}.\n${ui.mission}\n${draft.pageUrl}\n\n${tags}`;
  return body.trim();
}

function extractAiText(json: any) {
  const r = json?.result ?? json;
  if (!r) return "";
  if (typeof r.response === "string") return r.response;
  if (typeof r === "string") return r;
  if (typeof r.output_text === "string") return r.output_text;
  if (Array.isArray(r.choices) && r.choices[0]?.message?.content) return r.choices[0].message.content;
  if (r.message?.content) return String(r.message.content);
  return "";
}

function cleanCaption(s: string) {
  return String(s || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1800);
}

async function composeWithAi(env: FacebookEnv, draft: Omit<FacebookDraft, "caption" | "captionSource">): Promise<string | null> {
  const account = env.CF_AI_ACCOUNT_ID || env.CF_ACCOUNT_ID || "";
  const token = env.CF_AI_API_TOKEN || env.CF_API_TOKEN || "";
  if (!account || !token) return null;
  const model = env.CF_AI_MODEL || "@cf/moonshotai/kimi-k2.7-code";
  const locale = LOCALE_NAME[draft.lang] || draft.lang;
  const tags = HASHTAGS[draft.lang] || HASHTAGS.en;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You write Circuitbull® Facebook Page posts for Volls Global Inc (Wilmington DE). G2G / EPC+F thermal, EO-IR, and IoT sensing. Do NOT claim cameras are Made in USA. IoT/SCADA/carbon may be USA-made; thermal/EO-IR are catalog sensors. Write only in the requested locale. 70–120 words. No markdown. No emoji spam. End with the URL on its own line, then the hashtags I give you. Caption only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              locale: draft.lang,
              language: locale,
              kind: draft.kind,
              sku: draft.sku || "",
              product: draft.name,
              solution: draft.solutionTitle,
              url: draft.pageUrl,
              hashtags: tags,
            }),
          },
        ],
        max_tokens: 420,
      }),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as any;
    const text = cleanCaption(extractAiText(json));
    if (text.length < 60) return null;
    if (!text.includes("circuitbull.com")) return `${text}\n${draft.pageUrl}\n\n${tags}`;
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickProduct(products: any[], used: Set<string>, preferNeed?: string) {
  const pool = products.filter((p) => p?.slug && p.catalog !== false && productImageKey(p));
  const fresh = pool.filter((p) => !used.has(p.slug));
  const ranked = (fresh.length ? fresh : pool).slice();
  if (preferNeed) {
    ranked.sort((a, b) => {
      const as = (a.needSlugs || []).includes(preferNeed) ? 0 : 1;
      const bs = (b.needSlugs || []).includes(preferNeed) ? 0 : 1;
      return as - bs;
    });
  }
  return ranked[0] || null;
}

export async function buildFacebookDraft(
  env: FacebookEnv,
  opts: {
    lang?: string;
    kind?: "product" | "solution";
    slug?: string;
    at?: number;
    products: any[];
    needs: NeedRow[];
    usedSlugs?: string[];
  }
): Promise<FacebookDraft | { error: string }> {
  const slot = facebookSlot(opts.at || Date.now());
  const lang = normalizeLang(opts.lang || slot.lang);
  const kind = opts.kind || slot.kind;
  const used = new Set(opts.usedSlugs || []);
  const needs = opts.needs || [];

  if (kind === "solution") {
    const needSlug =
      opts.slug && (SOLUTION_SLUGS as readonly string[]).includes(opts.slug)
        ? opts.slug
        : SOLUTION_SLUGS[slot.index % SOLUTION_SLUGS.length];
    const need = needs.find((n) => n.slug === needSlug) || { slug: needSlug };
    const copy = solutionCopy(need, lang);
    const product = pickProduct(opts.products, used, needSlug);
    const pCopy = product ? productCopy(product, lang) : { name: "", summary: "", description: "", applications: [] };
    const imageUrl = solutionImageUrl(needSlug) || (product ? publicImageUrl(productImageKey(product)) : "");
    if (!imageUrl) return { error: "no_image" };
    const pageUrl = `${SITE_ORIGIN}${solutionPath(lang, needSlug)}`;
    const base = {
      lang,
      kind: "solution" as const,
      slug: needSlug,
      sku: product ? displaySku(product) : "",
      name: pCopy.name || copy.title,
      solutionSlug: needSlug,
      solutionTitle: copy.title,
      imageUrl,
      pageUrl,
    };
    const ai = await composeWithAi(env, base);
    return { ...base, caption: ai || templateCaption(base), captionSource: ai ? "agent" : "template" };
  }

  const wanted = opts.slug ? opts.products.find((p) => p.slug === opts.slug) : null;
  const product = wanted || pickProduct(opts.products, used);
  if (!product) return { error: "no_product" };
  const imageKey = productImageKey(product);
  if (!imageKey) return { error: "no_image" };
  const pCopy = productCopy(product, lang);
  const solutionSlug = linkedSolutionSlug(product);
  const need = needs.find((n) => n.slug === solutionSlug) || { slug: solutionSlug };
  const sol = solutionCopy(need, lang);
  const base = {
    lang,
    kind: "product" as const,
    slug: String(product.slug),
    sku: displaySku(product),
    name: pCopy.name,
    solutionSlug,
    solutionTitle: sol.title,
    imageUrl: publicImageUrl(imageKey),
    pageUrl: `${SITE_ORIGIN}${productPath(lang, product.slug)}`,
  };
  const ai = await composeWithAi(env, base);
  return { ...base, caption: ai || templateCaption(base), captionSource: ai ? "agent" : "template" };
}

async function graphPost(settings: FacebookSettings, path: string, body: Record<string, unknown>) {
  const version = settings.graphVersion.replace(/[^\w.]/g, "") || "v21.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${settings.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  return { ok: res.ok, status: res.status, json };
}

export async function publishFacebookDraft(settings: FacebookSettings, draft: FacebookDraft) {
  if (!facebookReady(settings)) return { published: false, error: "not_configured" };
  const photo = await graphPost(settings, `${encodeURIComponent(settings.pageId)}/photos`, {
    url: draft.imageUrl,
    caption: draft.caption,
    published: true,
  });
  if (photo.ok) {
    return {
      published: true,
      postId: String(photo.json.post_id || photo.json.id || ""),
      channel: "photos",
    };
  }
  const feed = await graphPost(settings, `${encodeURIComponent(settings.pageId)}/feed`, {
    message: draft.caption,
    link: draft.pageUrl,
  });
  if (feed.ok) {
    return {
      published: true,
      postId: String(feed.json.id || ""),
      channel: "feed",
      photoError: photo.json?.error?.message,
    };
  }
  return {
    published: false,
    error: feed.json?.error?.message || photo.json?.error?.message || `http_${feed.status}`,
  };
}

export async function loadState(kv: KVNamespace): Promise<FacebookState> {
  try {
    const raw = await kv.get(FACEBOOK_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FacebookState;
  } catch {
    return {};
  }
}

async function saveState(kv: KVNamespace, state: FacebookState) {
  await kv.put(FACEBOOK_STATE_KEY, JSON.stringify(state));
}

export function facebookPublicStatus(settings: FacebookSettings, state: FacebookState, at = Date.now()) {
  const now = facebookSlot(at);
  const next = nextFacebookSlot(at);
  return {
    configured: facebookReady(settings),
    dryRun: settings.dryRun,
    pageId: settings.pageId || "",
    graphVersion: settings.graphVersion,
    intervalHours: 3,
    locales: [...SITE_LOCALES],
    now: {
      slot: now.index,
      lang: now.lang,
      kind: now.kind,
    },
    next: {
      slot: next.index,
      lang: next.lang,
      kind: next.kind,
      at: new Date(next.at).toISOString(),
    },
    last: state.lastAt
      ? {
          at: state.lastAt,
          lang: state.lastLang,
          kind: state.lastKind,
          slug: state.lastSlug,
          postId: state.lastPostId || "",
          error: state.lastError || "",
        }
      : null,
  };
}

export async function runFacebookSlot(
  env: FacebookEnv,
  opts: {
    source: "cron" | "manual";
    at?: number;
    lang?: string;
    kind?: "product" | "solution";
    slug?: string;
    dry?: boolean;
    force?: boolean;
  }
) {
  const settings = await loadFacebookSettings(env);
  const state = await loadState(env.DATA);
  const at = opts.at || Date.now();
  const slot = facebookSlot(at);
  if (opts.source === "cron" && !opts.force && state.lastSlot === slot.index) {
    return { ok: true, skipped: "same_slot", slot: slot.index, lang: slot.lang };
  }
  if (opts.source === "cron" && !facebookReady(settings) && !opts.dry && !settings.dryRun) {
    return { ok: true, skipped: "not_configured", slot: slot.index, lang: slot.lang, kind: slot.kind };
  }
  const products = (JSON.parse((await env.DATA.get("products")) || "[]") as any[]) || [];
  const needs = (JSON.parse((await env.DATA.get("needs")) || "[]") as NeedRow[]) || [];
  const draft = await buildFacebookDraft(env, {
    lang: opts.lang,
    kind: opts.kind,
    slug: opts.slug,
    at,
    products,
    needs,
    usedSlugs: state.postedSlugs || [],
  });
  if ("error" in draft) {
    state.lastError = draft.error;
    state.lastAt = new Date(at).toISOString();
    await saveState(env.DATA, state);
    return { ok: false, error: draft.error, slot: slot.index };
  }
  const dry = Boolean(opts.dry) || settings.dryRun;
  let postId = "";
  let channel = "dry";
  let publishError = "";
  if (!dry) {
    const pub = await publishFacebookDraft(settings, draft);
    if (!pub.published) {
      state.lastError = pub.error || "publish_failed";
      state.lastAt = new Date(at).toISOString();
      await saveState(env.DATA, state);
      return { ok: false, error: pub.error, draft, slot: slot.index };
    }
    postId = pub.postId || "";
    channel = pub.channel || "photos";
  }
  const posted = [...(state.postedSlugs || []).filter((s) => s !== draft.slug), draft.slug].slice(-48);
  const recent = [
    {
      slot: slot.index,
      lang: draft.lang,
      kind: draft.kind,
      slug: draft.slug,
      postId,
      at: new Date(at).toISOString(),
      dry,
    },
    ...(state.recent || []),
  ].slice(0, 24);
  await saveState(env.DATA, {
    lastSlot: slot.index,
    lastAt: new Date(at).toISOString(),
    lastLang: draft.lang,
    lastKind: draft.kind,
    lastSlug: draft.slug,
    lastPostId: postId,
    lastError: publishError,
    recent,
    postedSlugs: posted,
  });
  return {
    ok: true,
    dry,
    slot: slot.index,
    lang: draft.lang,
    kind: draft.kind,
    slug: draft.slug,
    postId,
    channel,
    captionSource: draft.captionSource,
    pageUrl: draft.pageUrl,
    imageUrl: draft.imageUrl,
    caption: draft.caption,
  };
}
