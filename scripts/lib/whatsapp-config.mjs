/** Merge Meta WhatsApp Cloud API settings from .env into KV `config:whatsapp`. Never logs secrets. */

export const WHATSAPP_KV_KEY = "config:whatsapp";

export function whatsappConfigFromEnv(env = process.env) {
  const token = String(env.WHATSAPP_TOKEN || "").trim();
  const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  return {
    provider: "meta-cloud",
    enabled: Boolean(token && phoneNumberId),
    token,
    phoneNumberId,
    wabaId: String(env.WHATSAPP_WABA_ID || "").trim(),
    template: String(env.WHATSAPP_TEMPLATE || "").trim(),
    templateLang: String(env.WHATSAPP_TEMPLATE_LANG || "en").trim() || "en",
    graphVersion: String(env.WHATSAPP_GRAPH_VERSION || "v21.0").trim() || "v21.0",
  };
}

export function mergeWhatsAppKv(fromEnv, existing) {
  const prev = existing && typeof existing === "object" ? existing : {};
  const next = whatsappConfigFromEnv(fromEnv);
  const token = next.token || String(prev.token || "").trim();
  const phoneNumberId = next.phoneNumberId || String(prev.phoneNumberId || "").trim();
  return {
    provider: "meta-cloud",
    enabled: Boolean(token && phoneNumberId),
    token,
    phoneNumberId,
    wabaId: next.wabaId || String(prev.wabaId || "").trim(),
    template: next.template || String(prev.template || "").trim(),
    templateLang: next.templateLang || String(prev.templateLang || "en").trim() || "en",
    graphVersion: next.graphVersion || String(prev.graphVersion || "v21.0").trim() || "v21.0",
    updatedAt: new Date().toISOString(),
  };
}

export function whatsappPublicStatus(cfg) {
  return {
    key: WHATSAPP_KV_KEY,
    enabled: Boolean(cfg?.enabled),
    hasToken: Boolean(cfg?.token),
    hasPhoneNumberId: Boolean(cfg?.phoneNumberId),
    hasWabaId: Boolean(cfg?.wabaId),
    template: cfg?.template || "",
    graphVersion: cfg?.graphVersion || "v21.0",
  };
}
