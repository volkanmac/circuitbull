/** Merge Meta Page settings from .env into KV `config:facebook`. Never logs secrets. */

export const FACEBOOK_KV_KEY = "config:facebook";

export function facebookConfigFromEnv(env = process.env) {
  const token = String(env.FACEBOOK_PAGE_TOKEN || "").trim();
  const pageId = String(env.FACEBOOK_PAGE_ID || "").trim();
  return {
    provider: "facebook-page",
    enabled: Boolean(token && pageId),
    token,
    pageId,
    graphVersion: String(env.FACEBOOK_GRAPH_VERSION || "v21.0").trim() || "v21.0",
    dryRun: /^(1|true|yes|on)$/i.test(String(env.FACEBOOK_DRY_RUN || "").trim()),
  };
}

export function mergeFacebookKv(fromEnv, existing) {
  const prev = existing && typeof existing === "object" ? existing : {};
  const next = facebookConfigFromEnv(fromEnv);
  const token = next.token || String(prev.token || "").trim();
  const pageId = next.pageId || String(prev.pageId || "").trim();
  return {
    provider: "facebook-page",
    enabled: Boolean(token && pageId),
    token,
    pageId,
    graphVersion: next.graphVersion || String(prev.graphVersion || "v21.0").trim() || "v21.0",
    dryRun: next.dryRun || Boolean(prev.dryRun),
    updatedAt: new Date().toISOString(),
  };
}

export function facebookPublicStatus(cfg) {
  return {
    key: FACEBOOK_KV_KEY,
    enabled: Boolean(cfg?.enabled),
    hasToken: Boolean(cfg?.token),
    hasPageId: Boolean(cfg?.pageId),
    pageId: cfg?.pageId || "",
    graphVersion: cfg?.graphVersion || "v21.0",
    dryRun: Boolean(cfg?.dryRun),
  };
}
