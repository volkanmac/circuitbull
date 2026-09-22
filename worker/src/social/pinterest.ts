/** Circuitbull® Pinterest publisher. One product pin every 4 hours.
 * Language matrix: slot index % 10 locales, so the same language cannot
 * repeat until all 10 have posted (40 hours). Product index advances once
 * per full language cycle, and a lang:slug pair is not reused until the
 * catalog for that language wraps.
 */

import { displaySku } from "../i18n/facts";
import { DEFAULT_LANG, SITE_LOCALES, normalizeLang, productPath, SITE_ORIGIN } from "../i18n/locales";
import { cdnUrl } from "../ui/shell";

export const PINTEREST_STATE_KEY = "social:pinterest:state";
export const PINTEREST_TOKEN_KEY = "config:pinterest";
export const PINTEREST_INTERVAL_MS = 4 * 60 * 60 * 1000;
export const PINTEREST_BOARD_FALLBACK = "1152288323350914714";

export type PinterestEnv = {
  DATA: KVNamespace;
  PINTEREST_ACCESS_TOKEN?: string;
  PINTEREST_REFRESH_TOKEN?: string;
  PINTEREST_APP_ID?: string;
  PINTEREST_APP_SECRET?: string;
  PINTEREST_BOARD_ID?: string;
  PINTEREST_DRY_RUN?: string;
  CF_AI_API_TOKEN?: string;
  CF_AI_ACCOUNT_ID?: string;
  CF_AI_MODEL?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
};

export type PinterestSlot = {
  index: number;
  lang: string;
  productTurn: number;
  at: number;
};

export type PinterestDraft = {
  lang: string;
  slug: string;
  sku: string;
  name: string;
  imageUrl: string;
  pageUrl: string;
  title: string;
  description: string;
  copySource: "agent" | "template";
};

export type PinterestState = {
  lastSlot?: number;
  lastAt?: string;
  lastLang?: string;
  lastSlug?: string;
  lastPinId?: string;
  lastError?: string;
  postedPairs?: string[];
  recent?: Array<{
    slot: number;
    lang: string;
    slug: string;
    pinId?: string;
    at: string;
    dry?: boolean;
  }>;
};

type TokenBag = {
  accessToken: string;
  refreshToken: string;
  appId: string;
  appSecret: string;
  boardId: string;
  dryRun: boolean;
  expiresAt?: number;
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

const FALLBACK: Record<string, { title: string; line: string }> = {
  en: { title: "Field it before the gap closes", line: "The sensor is on the catalog. The brief is one click." },
  tr: { title: "Boşluğu kapatmadan sahaya al", line: "Sensör katalogda. Brifing bir tık." },
  ar: { title: "انشره قبل أن تتسع الفجوة", line: "المستشعر في الكتالوج. الموجز بنقرة." },
  es: { title: "Despliégalo antes de que crezca el hueco", line: "El sensor está en el catálogo. El briefing es un clic." },
  de: { title: "Ins Feld, bevor die Lücke wächst", line: "Der Sensor steht im Katalog. Das Briefing ist ein Klick." },
  fr: { title: "Déployez avant que l’écart se creuse", line: "Le capteur est au catalogue. Le brief est un clic." },
  ru: { title: "На рубеж, пока разрыв не вырос", line: "Сенсор в каталоге. Брифинг — один переход." },
  "zh-Hant": { title: "趁缺口擴大前部署", line: "感測器已在型錄。簡報只要一步。" },
  it: { title: "Schieralo prima che il varco si allarghi", line: "Il sensore è in catalogo. Il brief è un clic." },
  ko: { title: "공백이 커지기 전에 배치하라", line: "센서는 카탈로그에 있다. 브리핑은 한 번의 클릭." },
};

function trim(s: unknown) {
  return String(s || "").trim();
}

function truthy(s: unknown) {
  return /^(1|true|yes|on)$/i.test(trim(s));
}

function clip(s: string, n: number) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trim()}…`;
}

export function pinterestSlot(at = Date.now()): PinterestSlot {
  const index = Math.floor(at / PINTEREST_INTERVAL_MS);
  const lang = SITE_LOCALES[index % SITE_LOCALES.length] || DEFAULT_LANG;
  const productTurn = Math.floor(index / SITE_LOCALES.length);
  return { index, lang, productTurn, at };
}

export function nextPinterestSlot(at = Date.now()) {
  const slot = pinterestSlot(at);
  const nextAt = (slot.index + 1) * PINTEREST_INTERVAL_MS;
  return { ...pinterestSlot(nextAt), at: nextAt };
}

/** Next N slots. Consecutive languages are always distinct. */
export function pinterestMatrix(at = Date.now(), count = SITE_LOCALES.length) {
  const start = pinterestSlot(at);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const atI = (start.index + i) * PINTEREST_INTERVAL_MS;
    const slot = pinterestSlot(atI);
    rows.push({ slot: slot.index, lang: slot.lang, at: new Date(atI).toISOString() });
  }
  return rows;
}

function productImageKey(p: any) {
  return trim(p?.media?.aiHero || p?.image || (Array.isArray(p?.images) ? p.images[0] : "") || "");
}

function publicImageUrl(key: string) {
  const url = cdnUrl(key);
  if (!url) return "";
  if (url.includes("?")) return url;
  return `${url}?v=20260922pin`;
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

function catalogPool(products: any[]) {
  return products
    .filter((p) => p?.slug && p.catalog !== false && productImageKey(p))
    .slice()
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

function pickProduct(products: any[], lang: string, productTurn: number, used: Set<string>) {
  const pool = catalogPool(products);
  if (!pool.length) return null;
  const start = productTurn % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[(start + i) % pool.length];
    if (!used.has(`${lang}:${p.slug}`)) return p;
  }
  return pool[start];
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

function parsePinCopy(raw: string, pageUrl: string, name: string, lang: string): { title: string; description: string } | null {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  let title = "";
  let description = "";
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(cleaned.slice(start, end + 1));
      title = trim(obj.title);
      description = trim(obj.description);
    } catch {
      title = "";
    }
  }
  if (!title || !description) return null;
  if (!description.includes("circuitbull.com")) description = `${description}\n${pageUrl}`;
  const fb = FALLBACK[lang] || FALLBACK.en;
  return {
    title: clip(title || name || fb.title, 100),
    description: clip(description, 800),
  };
}

function templateCopy(lang: string, name: string, sku: string, pageUrl: string) {
  const fb = FALLBACK[lang] || FALLBACK.en;
  const title = clip(name ? `${name}` : fb.title, 100);
  const description = clip(`${fb.line} ${sku ? sku + ". " : ""}${name}.\n${pageUrl}`, 800);
  return { title, description };
}

async function composeWithAi(
  env: PinterestEnv,
  input: { lang: string; name: string; sku: string; summary: string; imageUrl: string; pageUrl: string }
): Promise<{ title: string; description: string } | null> {
  const account = env.CF_AI_ACCOUNT_ID || env.CF_ACCOUNT_ID || "";
  const token = env.CF_AI_API_TOKEN || env.CF_API_TOKEN || "";
  if (!account || !token) return null;
  const model = env.CF_AI_MODEL || "@cf/moonshotai/kimi-k2.7-code";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You write one Pinterest Pin for Circuitbull® (Volls Global Inc). Guerrilla marketing: concrete, urgent, field-level. Not a brochure. Do NOT claim thermal or EO/IR cameras are Made in USA. The attached image URL is the product photo that will be the Pin image — write as if that photo is on the pin. Write only in the requested language. Return JSON only: {\"title\":\"max 90 characters\",\"description\":\"max 450 characters, last line is the product URL\"}. No markdown.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction: "We have this product. We have this image. Write guerrilla marketing for Pinterest.",
              language: LOCALE_NAME[input.lang] || input.lang,
              locale: input.lang,
              product: input.name,
              sku: input.sku,
              summary: clip(input.summary, 500),
              image: input.imageUrl,
              url: input.pageUrl,
            }),
          },
        ],
        max_tokens: 500,
      }),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as any;
    return parsePinCopy(extractAiText(json), input.pageUrl, input.name, input.lang);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readKvToken(kv: KVNamespace): Promise<Partial<TokenBag> | null> {
  try {
    const raw = await kv.get(PINTEREST_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<TokenBag>;
  } catch {
    return null;
  }
}

export async function loadPinterestAuth(env: PinterestEnv): Promise<TokenBag> {
  const kv = await readKvToken(env.DATA);
  return {
    accessToken: trim(kv?.accessToken) || trim(env.PINTEREST_ACCESS_TOKEN),
    refreshToken: trim(kv?.refreshToken) || trim(env.PINTEREST_REFRESH_TOKEN),
    appId: trim(env.PINTEREST_APP_ID) || "1614500",
    appSecret: trim(env.PINTEREST_APP_SECRET),
    boardId: trim(env.PINTEREST_BOARD_ID) || PINTEREST_BOARD_FALLBACK,
    dryRun: truthy(env.PINTEREST_DRY_RUN),
    expiresAt: typeof kv?.expiresAt === "number" ? kv.expiresAt : undefined,
  };
}

async function saveToken(kv: KVNamespace, bag: TokenBag, expiresInSec: number) {
  const expiresAt = Date.now() + Math.max(60, expiresInSec) * 1000;
  await kv.put(
    PINTEREST_TOKEN_KEY,
    JSON.stringify({
      accessToken: bag.accessToken,
      refreshToken: bag.refreshToken,
      expiresAt,
    })
  );
  bag.expiresAt = expiresAt;
}

async function refreshAccessToken(env: PinterestEnv, bag: TokenBag): Promise<boolean> {
  if (!bag.refreshToken || !bag.appId || !bag.appSecret) return false;
  const basic = btoa(`${bag.appId}:${bag.appSecret}`);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: bag.refreshToken,
  });
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !json.access_token) return false;
  bag.accessToken = String(json.access_token);
  if (json.refresh_token) bag.refreshToken = String(json.refresh_token);
  await saveToken(env.DATA, bag, Number(json.expires_in) || 2592000);
  return true;
}

async function pinterestFetch(env: PinterestEnv, bag: TokenBag, path: string, init: RequestInit) {
  const call = (token: string) =>
    fetch(`https://api.pinterest.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });
  let res = await call(bag.accessToken);
  if (res.status === 401 && (await refreshAccessToken(env, bag))) {
    res = await call(bag.accessToken);
  }
  return res;
}

export async function loadPinterestState(kv: KVNamespace): Promise<PinterestState> {
  try {
    const raw = await kv.get(PINTEREST_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PinterestState;
  } catch {
    return {};
  }
}

async function saveState(kv: KVNamespace, state: PinterestState) {
  await kv.put(PINTEREST_STATE_KEY, JSON.stringify(state));
}

export async function buildPinterestDraft(
  env: PinterestEnv,
  opts: { at?: number; lang?: string; slug?: string; products: any[]; usedPairs?: string[] }
): Promise<PinterestDraft | { error: string }> {
  const slot = pinterestSlot(opts.at || Date.now());
  const lang = normalizeLang(opts.lang || slot.lang);
  const used = new Set(opts.usedPairs || []);
  const wanted = opts.slug ? opts.products.find((p) => p.slug === opts.slug) : null;
  const product = wanted || pickProduct(opts.products, lang, slot.productTurn, used);
  if (!product) return { error: "no_product" };
  const imageKey = productImageKey(product);
  if (!imageKey) return { error: "no_image" };
  const copy = productCopy(product, lang);
  const imageUrl = publicImageUrl(imageKey);
  const pageUrl = `${SITE_ORIGIN}${productPath(lang, product.slug)}`;
  const sku = displaySku(product);
  const ai = await composeWithAi(env, {
    lang,
    name: copy.name,
    sku,
    summary: copy.summary || copy.description,
    imageUrl,
    pageUrl,
  });
  const text = ai || templateCopy(lang, copy.name, sku, pageUrl);
  return {
    lang,
    slug: String(product.slug),
    sku,
    name: copy.name,
    imageUrl,
    pageUrl,
    title: text.title,
    description: text.description,
    copySource: ai ? "agent" : "template",
  };
}

export async function publishPinterestDraft(env: PinterestEnv, bag: TokenBag, draft: PinterestDraft) {
  if (!bag.accessToken || !bag.boardId) return { published: false, error: "not_configured" };
  const res = await pinterestFetch(env, bag, "/v5/pins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: bag.boardId,
      title: draft.title,
      description: draft.description,
      link: draft.pageUrl,
      alt_text: clip(draft.name, 500),
      media_source: { source_type: "image_url", url: draft.imageUrl },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    return { published: false, error: json?.message || `http_${res.status}` };
  }
  return { published: true, pinId: String(json.id || "") };
}

export function pinterestPublicStatus(bag: TokenBag, state: PinterestState, at = Date.now()) {
  const now = pinterestSlot(at);
  const next = nextPinterestSlot(at);
  return {
    configured: Boolean(bag.accessToken && bag.boardId),
    dryRun: bag.dryRun,
    boardId: bag.boardId,
    intervalHours: 4,
    locales: [...SITE_LOCALES],
    matrix: pinterestMatrix(at, SITE_LOCALES.length),
    now: { slot: now.index, lang: now.lang, productTurn: now.productTurn },
    next: { slot: next.index, lang: next.lang, at: new Date(next.at).toISOString() },
    last: state.lastAt
      ? {
          at: state.lastAt,
          lang: state.lastLang,
          slug: state.lastSlug,
          pinId: state.lastPinId || "",
          error: state.lastError || "",
        }
      : null,
  };
}

export async function runPinterestSlot(
  env: PinterestEnv,
  opts: { source: "cron" | "manual"; at?: number; lang?: string; slug?: string; dry?: boolean; force?: boolean }
) {
  const bag = await loadPinterestAuth(env);
  const state = await loadPinterestState(env.DATA);
  const at = opts.at || Date.now();
  const slot = pinterestSlot(at);
  if (opts.source === "cron" && !opts.force && state.lastSlot === slot.index) {
    return { ok: true, skipped: "same_slot", slot: slot.index, lang: slot.lang };
  }
  if (opts.source === "cron" && !bag.accessToken && !opts.dry && !bag.dryRun) {
    return { ok: true, skipped: "not_configured", slot: slot.index, lang: slot.lang };
  }
  const products = (JSON.parse((await env.DATA.get("products")) || "[]") as any[]) || [];
  const draft = await buildPinterestDraft(env, {
    at,
    lang: opts.lang,
    slug: opts.slug,
    products,
    usedPairs: state.postedPairs || [],
  });
  if ("error" in draft) {
    state.lastError = draft.error;
    state.lastAt = new Date(at).toISOString();
    await saveState(env.DATA, state);
    return { ok: false, error: draft.error, slot: slot.index, lang: slot.lang };
  }
  const dry = Boolean(opts.dry) || bag.dryRun;
  let pinId = "";
  if (!dry) {
    const pub = await publishPinterestDraft(env, bag, draft);
    if (!pub.published) {
      state.lastError = pub.error || "publish_failed";
      state.lastAt = new Date(at).toISOString();
      await saveState(env.DATA, state);
      return { ok: false, error: pub.error, slot: slot.index, lang: draft.lang, slug: draft.slug };
    }
    pinId = pub.pinId || "";
  }
  const pair = `${draft.lang}:${draft.slug}`;
  const postedPairs = [...(state.postedPairs || []).filter((s) => s !== pair), pair].slice(-400);
  const recent = [
    { slot: slot.index, lang: draft.lang, slug: draft.slug, pinId, at: new Date(at).toISOString(), dry },
    ...(state.recent || []),
  ].slice(0, 24);
  await saveState(env.DATA, {
    lastSlot: slot.index,
    lastAt: new Date(at).toISOString(),
    lastLang: draft.lang,
    lastSlug: draft.slug,
    lastPinId: pinId,
    lastError: "",
    postedPairs,
    recent,
  });
  return {
    ok: true,
    dry,
    slot: slot.index,
    lang: draft.lang,
    slug: draft.slug,
    sku: draft.sku,
    pinId,
    copySource: draft.copySource,
    title: draft.title,
    pageUrl: draft.pageUrl,
    imageUrl: draft.imageUrl,
  };
}
