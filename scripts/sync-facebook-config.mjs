/**
 * Push Facebook Page Graph settings from .env → KV `config:facebook`.
 * Empty keys keep any token already in KV. Does not print secrets.
 *
 * Required env: FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN
 * Optional: FACEBOOK_GRAPH_VERSION=v21.0, FACEBOOK_DRY_RUN=1
 */
import "dotenv/config";
import { pathToFileURL } from "node:url";
import { mergeFacebookKv, FACEBOOK_KV_KEY, facebookPublicStatus } from "./lib/facebook-config.mjs";

const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const EMAIL = process.env.CF_AUTH_EMAIL;
const GLOBAL_KEY = process.env.CF_GLOBAL_API_KEY;
const NS_TITLE = "circuitbull-data";
const NS_ID = "581b3398eed0414f8b49b7c79b83c4e5";

function authHeaders() {
  if (EMAIL && GLOBAL_KEY) {
    return {
      "X-Auth-Email": EMAIL,
      "X-Auth-Key": GLOBAL_KEY,
      "Content-Type": "application/json",
    };
  }
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function cf(path, opts = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors || json));
  return json.result;
}

async function resolveNsId() {
  try {
    const list = await cf(`/accounts/${ACCOUNT}/storage/kv/namespaces?per_page=100`);
    const found = (list || []).find((n) => n.title === NS_TITLE);
    if (found?.id) return found.id;
  } catch {
    // fall through to wrangler.toml id
  }
  return NS_ID;
}

async function getJson(nsId, key) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function putKey(nsId, key, value) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(value),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
}

export async function syncFacebookConfig({ putKey: put, getJson: get, nsId } = {}) {
  const namespace = nsId || (await resolveNsId());
  const getter = get || ((id, key) => getJson(id, key));
  const setter = put || ((id, key, value) => putKey(id, key, value));
  const existing = await getter(namespace, FACEBOOK_KV_KEY);
  const merged = mergeFacebookKv(process.env, existing);
  await setter(namespace, FACEBOOK_KV_KEY, merged);
  return { nsId: namespace, facebook: facebookPublicStatus(merged) };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const out = await syncFacebookConfig();
  console.log(JSON.stringify(out, null, 2));
}
