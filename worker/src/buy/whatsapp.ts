/** Buy-flow WhatsApp: E.164 normalize, agent copy, optional Cloud API send. */

import { COUNTRY_TO_LANG, DEFAULT_LANG, normalizeLang } from "../i18n/locales";

export const COUNTRY_DIAL: Record<string, string> = {
  US: "1",
  CA: "1",
  GB: "44",
  AU: "61",
  NZ: "64",
  IE: "353",
  TR: "90",
  DE: "49",
  AT: "43",
  CH: "41",
  FR: "33",
  BE: "32",
  ES: "34",
  IT: "39",
  MX: "52",
  SA: "966",
  AE: "971",
  EG: "20",
  QA: "974",
  KW: "965",
  IQ: "964",
  BH: "973",
  OM: "968",
  JO: "962",
  MA: "212",
  RU: "7",
  BY: "375",
  KZ: "7",
  TW: "886",
  CN: "86",
  HK: "852",
  KR: "82",
  AR: "54",
  CO: "57",
  CL: "56",
  PE: "51",
};

export const WHATSAPP_KV_KEY = "config:whatsapp";

type WaEnv = {
  CF_AI_API_TOKEN?: string;
  CF_API_TOKEN?: string;
  CF_AI_ACCOUNT_ID?: string;
  CF_ACCOUNT_ID?: string;
  CF_AI_MODEL?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_WABA_ID?: string;
  WHATSAPP_TEMPLATE?: string;
  WHATSAPP_TEMPLATE_LANG?: string;
  WHATSAPP_GRAPH_VERSION?: string;
};

export type WhatsAppSettings = {
  token: string;
  phoneNumberId: string;
  wabaId: string;
  template: string;
  templateLang: string;
  graphVersion: string;
};

function trim(s: unknown) {
  return String(s || "").trim();
}

/** Env (.dev.vars / wrangler secret) wins; KV `config:whatsapp` fills the rest. */
export function mergeWhatsAppSettings(env: WaEnv, kv?: Record<string, unknown> | null): WhatsAppSettings {
  const row = kv && typeof kv === "object" ? kv : {};
  return {
    token: trim(env.WHATSAPP_TOKEN) || trim(row.token),
    phoneNumberId: trim(env.WHATSAPP_PHONE_NUMBER_ID) || trim(row.phoneNumberId),
    wabaId: trim(env.WHATSAPP_WABA_ID) || trim(row.wabaId),
    template: trim(env.WHATSAPP_TEMPLATE) || trim(row.template),
    templateLang: trim(env.WHATSAPP_TEMPLATE_LANG) || trim(row.templateLang) || "en",
    graphVersion: trim(env.WHATSAPP_GRAPH_VERSION) || trim(row.graphVersion) || "v21.0",
  };
}

export async function loadWhatsAppSettings(
  kv: { get: (key: string) => Promise<string | null> },
  env: WaEnv
): Promise<WhatsAppSettings> {
  let row: Record<string, unknown> | null = null;
  try {
    const raw = await kv.get(WHATSAPP_KV_KEY);
    if (raw) row = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    row = null;
  }
  return mergeWhatsAppSettings(env, row);
}

export function whatsappCloudReady(s: WhatsAppSettings) {
  return Boolean(s.token && s.phoneNumberId);
}

export type BuyPingCtx = {
  country: string;
  countryName?: string;
  sku: string;
  productName: string;
  sellerName: string;
  sellerCity?: string;
  hqFallback: boolean;
};

export function dialCode(country: string) {
  return COUNTRY_DIAL[String(country || "").toUpperCase()] || "";
}

export function normalizeWhatsApp(country: string, raw: string): string | null {
  let s = String(raw || "").trim();
  if (!s) return null;
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  const dial = dialCode(country);
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
  }
  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  if (dial && digits.startsWith(dial) && digits.length > dial.length + 6) {
    // already includes country code
  } else if (dial) {
    digits = digits.replace(/^0+/, "");
    digits = dial + digits;
  }
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function templateBuyMessage(ctx: BuyPingCtx, lang: string) {
  const sku = ctx.sku || "SKU";
  const name = ctx.productName || "platform";
  const seller = ctx.sellerName || "Volls Global Inc";
  const city = ctx.sellerCity ? ` · ${ctx.sellerCity}` : "";
  const channel = ctx.hqFallback
    ? `${seller} (Circuitbull® HQ, Wilmington, DE)`
    : `${seller}${city}`;
  const l = normalizeLang(lang);
  if (l === "tr") {
    return `Circuitbull® — ${name} (${sku})\n\n${ctx.country} için yetkili kanal: ${channel}.\n\nAdet ve teslim noktasını bu sohbetten yazın, teklifi çıkaralım.\nVolls Global Inc · +1 276 600 2052`;
  }
  if (l === "ar") {
    return `Circuitbull® — ${name} (${sku})\n\nقناة ${ctx.country}: ${channel}.\n\nأرسل الكمية وموقع التسليم هنا لنصدر عرض السعر.\nVolls Global Inc · +1 276 600 2052`;
  }
  return `Circuitbull® — ${name} (${sku})\n\nYour ${ctx.country} channel: ${channel}.\n\nReply here with quantity and site. We will issue the quote on this chat.\nVolls Global Inc · Wilmington, DE · +1 276 600 2052`;
}

function extractAiText(json: any): string {
  const r = json?.result;
  if (!r) return "";
  if (typeof r.response === "string") return r.response;
  if (typeof r === "string") return r;
  if (typeof r.text === "string") return r.text;
  if (Array.isArray(r.choices) && r.choices[0]?.message?.content) return r.choices[0].message.content;
  if (typeof r.message === "string") return r.message;
  if (r.message?.content) return String(r.message.content);
  return "";
}

function cleanMessage(s: string) {
  return String(s || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 900);
}

async function composeWithAi(env: WaEnv, ctx: BuyPingCtx, lang: string): Promise<string | null> {
  const account = env.CF_AI_ACCOUNT_ID || env.CF_ACCOUNT_ID || "";
  const token = env.CF_AI_API_TOKEN || env.CF_API_TOKEN || "";
  if (!account || !token) return null;
  const model = env.CF_AI_MODEL || "@cf/moonshotai/kimi-k2.7-code";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1100);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are the Circuitbull® sales agent (Volls Global Inc, Wilmington DE). Write ONE short WhatsApp text (max 80 words). No markdown, no quotes wrapper. Include product + SKU, appointed seller or HQ fallback, and ask quantity. Language must match the locale.",
          },
          {
            role: "user",
            content: JSON.stringify({
              locale: lang,
              country: ctx.country,
              sku: ctx.sku,
              product: ctx.productName,
              seller: ctx.sellerName,
              city: ctx.sellerCity || "",
              hqFallback: ctx.hqFallback,
            }),
          },
        ],
        max_tokens: 220,
      }),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as any;
    const text = cleanMessage(extractAiText(json));
    return text.length > 40 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function composeBuyWhatsApp(env: WaEnv, ctx: BuyPingCtx): Promise<{ text: string; source: "agent" | "template" }> {
  const lang = COUNTRY_TO_LANG[ctx.country] || DEFAULT_LANG;
  const fallback = templateBuyMessage(ctx, lang);
  const ai = await composeWithAi(env, ctx, lang);
  return ai ? { text: ai, source: "agent" } : { text: fallback, source: "template" };
}

export async function sendWhatsAppCloud(
  settings: WhatsAppSettings,
  toE164: string,
  text: string
): Promise<{ sent: boolean; channel: string; error?: string }> {
  if (!whatsappCloudReady(settings)) return { sent: false, channel: "none" };
  const version = settings.graphVersion.replace(/[^\w.]/g, "") || "v21.0";
  try {
    const payload: Record<string, unknown> = settings.template
      ? {
          messaging_product: "whatsapp",
          to: toE164,
          type: "template",
          template: {
            name: settings.template,
            language: { code: settings.templateLang || "en" },
          },
        }
      : {
          messaging_product: "whatsapp",
          to: toE164,
          type: "text",
          text: { body: text, preview_url: false },
        };
    const res = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(settings.phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return { sent: false, channel: "cloud", error: json?.error?.message || `http_${res.status}` };
    }
    return { sent: true, channel: "cloud" };
  } catch (e: any) {
    return { sent: false, channel: "cloud", error: e?.message || "send_failed" };
  }
}

export function customerWaMe(e164: string, text: string) {
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}
