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
  benefits: string[];
  overview: string[];
  applications: string[];
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

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => trim(item)).filter(Boolean);
}

function productCopy(p: any, lang: string) {
  const l = normalizeLang(lang);
  const block = p?.i18n?.[l] || p?.i18n?.en || {};
  const ds = p?.datasheet?.i18n?.[l] || p?.datasheet?.i18n?.en || {};
  return {
    name: block.name || p?.name || "",
    summary: block.summary || p?.summary || "",
    description: block.description || p?.description || "",
    benefits: asLines(block.benefits?.length ? block.benefits : ds.benefits?.length ? ds.benefits : p?.benefits || p?.datasheet?.benefits),
    overview: asLines(block.overview?.length ? block.overview : ds.overview?.length ? ds.overview : p?.overview || p?.datasheet?.overview),
    applications: asLines(
      block.applications?.length
        ? block.applications
        : ds.applications?.length
          ? ds.applications
          : p?.applications || p?.datasheet?.applications
    ),
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

const USED: Record<string, string> = {
  en: "Used for",
  tr: "Kullanıldığı yer",
  ar: "يُستخدم في",
  es: "Se usa para",
  de: "Im Einsatz für",
  fr: "Utilisé pour",
  ru: "Где работает",
  "zh-Hant": "用於",
  it: "Si usa per",
  ko: "쓰이는 곳",
};

function hookLine(lang: string, benefit: string): string {
  const b = benefit.replace(/\s+/g, " ").replace(/[.。]+$/g, "").trim();
  const lower = b ? b.charAt(0).toLowerCase() + b.slice(1) : b;
  switch (normalizeLang(lang)) {
    case "tr":
      return `${b} yapan canavarla tanışın.`;
    case "de":
      return `Lernen Sie das Gerät kennen, das ${lower} leistet.`;
    case "fr":
      return `Voici l’appareil qui assure ${lower}.`;
    case "es":
      return `Conozca el equipo que logra ${lower}.`;
    case "ar":
      return `تعرّف على الجهاز الذي يقدّم ${b}.`;
    case "ru":
      return `Познакомьтесь с машиной, которая даёт ${lower}.`;
    case "it":
      return `Ecco la macchina che offre ${lower}.`;
    case "ko":
      return `${b}를 해내는 장비를 만나보세요.`;
    case "zh-Hant":
      return `認識這台能做到${b}的設備。`;
    default:
      return `Meet the beast that delivers ${lower}.`;
  }
}

function sentence(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return /[.!?。！？]$/.test(t) ? t : `${t}.`;
}

function templateCaption(draft: Omit<FacebookDraft, "caption" | "captionSource">): string {
  const tags = HASHTAGS[draft.lang] || HASHTAGS.en;
  const benefit = draft.benefits?.[0] || draft.name;
  const hook = hookLine(draft.lang, benefit);
  const plain = (draft.overview?.length ? draft.overview : (draft.benefits || []).slice(1)).slice(0, 3).map(sentence).filter(Boolean);
  const uses = (draft.applications || []).slice(0, 4);
  const used = uses.length ? `${USED[draft.lang] || USED.en}: ${uses.join(", ")}.` : "";
  return [hook, ...plain, used, "", draft.pageUrl, "", tags].filter((line) => line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
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
  const timer = setTimeout(() => ctrl.abort(), 14000);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You write one Circuitbull® Facebook caption. Use ONLY the key benefits, overview, and solutions I give you. Do not invent ranges, resolutions, or ratings. Do NOT claim thermal or EO-IR cameras are Made in USA. Write only in the requested language. No markdown, no bullet list, no emoji.\n\nShape:\n1. One opening sentence in that language, built from the FIRST key benefit. Everyday speech, confident, not a spec sheet. Turkish shape to copy only when the language is Turkish: \"Ultra uzun menzilli sürekli zoom ve 16.4 km araç tespiti yapan canavarla tanışın.\" For every other language, the same move: meet the beast / the machine that does that first benefit.\n2. Two or three short sentences that turn the remaining benefits and the overview into words a harbor guard, farmer, or security officer understands. Keep the real numbers (km, resolution, NETD, IP rating, degrees) and say what they mean in the field.\n3. One short sentence on where it is used, taken from the solutions list.\n4. A blank line, then the URL alone on its line, then the hashtags exactly as given.\n\nCaption only. About 70–130 words before the URL.",
          },
          {
            role: "user",
            content: JSON.stringify({
              locale: draft.lang,
              language: locale,
              kind: draft.kind,
              product: draft.name,
              sku: draft.sku || "",
              keyBenefits: (draft.benefits || []).slice(0, 8),
              overview: (draft.overview || []).slice(0, 6),
              solutions: (draft.applications || []).slice(0, 6),
              url: draft.pageUrl,
              hashtags: tags,
            }),
          },
        ],
        max_tokens: 520,
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
    const pCopy = product
      ? productCopy(product, lang)
      : { name: "", summary: "", description: "", benefits: [] as string[], overview: [] as string[], applications: [] as string[] };
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
      benefits: pCopy.benefits,
      overview: pCopy.overview.length ? pCopy.overview : copy.lead ? [copy.lead] : [],
      applications: pCopy.applications.length ? pCopy.applications : copy.title ? [copy.title] : [],
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
    benefits: pCopy.benefits,
    overview: pCopy.overview,
    applications: pCopy.applications.length ? pCopy.applications : sol.title ? [sol.title] : [],
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
