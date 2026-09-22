/**
 * R2 helpers for circuitbull-media.
 * Prefers Cloudflare Objects API (global key / account token),
 * then S3-compatible SigV4 when R2_* keys exist, else wrangler CLI.
 */
import { createHmac, createHash } from "crypto";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

const BUCKET = () => process.env.R2_BUCKET || "circuitbull-media";
const ACCOUNT = () => process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key, data) {
  return createHmac("sha256", key).update(data).digest();
}

function amzDate() {
  const iso = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso.slice(0, 16), day: iso.slice(0, 8) };
}

function cfAuthHeaders(extra = {}) {
  const email = process.env.CF_AUTH_EMAIL || process.env.CLOUDFLARE_EMAIL;
  const globalKey = process.env.CF_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY;
  if (email && globalKey) {
    return { "X-Auth-Email": email, "X-Auth-Key": globalKey, ...extra };
  }
  const token =
    process.env.CF_API_TOKEN_FULL ||
    process.env.CF_API_TOKEN ||
    process.env.CLOUDFLARE_API_TOKEN;
  if (token) return { Authorization: `Bearer ${token}`, ...extra };
  return null;
}

function objectsApiUrl(key = "") {
  const account = ACCOUNT();
  const bucket = BUCKET();
  const enc = key
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects${enc ? `/${enc}` : ""}`;
}

export async function r2List(prefix = "", { limit = 1000 } = {}) {
  const headers = cfAuthHeaders();
  if (!headers || !ACCOUNT()) throw new Error("CF credentials missing for R2 list");
  const out = [];
  let cursor = null;
  for (;;) {
    const qs = new URLSearchParams({ prefix, per_page: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch(`${objectsApiUrl()}?${qs}`, { headers });
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.errors || json));
    for (const o of json.result || []) out.push(o.key || o);
    cursor = json.result_info?.cursor;
    if (!cursor || !(json.result || []).length) break;
  }
  return out;
}

export async function r2Get(key) {
  const headers = cfAuthHeaders();
  if (headers && ACCOUNT()) {
    const res = await fetch(objectsApiUrl(key), { headers });
    if (!res.ok) throw new Error(`R2 get ${res.status} ${key}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return r2GetWrangler(key);
}

export async function r2Delete(key) {
  const headers = cfAuthHeaders();
  if (headers && ACCOUNT()) {
    const res = await fetch(objectsApiUrl(key), { method: "DELETE", headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(`R2 delete failed ${res.status} ${key}: ${JSON.stringify(json.errors || json)}`);
    }
    return;
  }
  return r2DeleteWrangler(key);
}

export async function r2Put(key, body, contentType = "application/octet-stream") {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), "utf8");
  const headers = cfAuthHeaders({ "Content-Type": contentType });
  if (headers && ACCOUNT()) {
    const res = await fetch(objectsApiUrl(key), {
      method: "PUT",
      headers,
      body: buf,
      signal: AbortSignal.timeout(60000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(`R2 put failed ${res.status} ${key}: ${JSON.stringify(json.errors || json).slice(0, 200)}`);
    }
    return;
  }

  const account = ACCOUNT();
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = BUCKET();
  const endpoint =
    process.env.R2_ENDPOINT || (account ? `https://${account}.r2.cloudflarestorage.com` : "");

  if (accessKey && secretKey && endpoint) {
    return r2PutS3(key, buf, contentType, { accessKey, secretKey, endpoint, bucket });
  }
  return r2PutWrangler(key, buf, contentType, bucket);
}

/** Copy object within bucket (or from public CDN URL) to a new key. */
export async function r2Copy(fromKey, toKey, contentType) {
  if (fromKey === toKey) return;
  const buf = await r2Get(fromKey);
  const ct = contentType || guessContentType(toKey) || "application/octet-stream";
  await r2Put(toKey, buf, ct);
}

export async function r2PutFile(key, filePath, contentType) {
  return r2Put(key, readFileSync(filePath), contentType);
}

function guessContentType(key) {
  const ext = String(key).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      html: "text/html; charset=utf-8",
      mp4: "video/mp4",
      webm: "video/webm",
      ico: "image/x-icon",
      txt: "text/plain",
    }[ext] || null
  );
}

async function r2PutS3(key, buf, contentType, { accessKey, secretKey, endpoint, bucket }) {
  const { amz, day } = amzDate();
  const region = "auto";
  const service = "s3";
  const host = endpoint.replace(/^https?:\/\//, "");
  const canonicalUri = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const payloadHash = sha256Hex(buf);
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amz}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${day}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${secretKey}`, day);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`${endpoint}${canonicalUri}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      Host: host,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amz,
      Authorization: authorization,
    },
    body: buf,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 put failed ${res.status} ${key}: ${text.slice(0, 200)}`);
  }
}

function wranglerEnv() {
  const env = {
    ...process.env,
    CLOUDFLARE_EMAIL: process.env.CF_AUTH_EMAIL || process.env.CLOUDFLARE_EMAIL,
    CLOUDFLARE_API_KEY: process.env.CF_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY,
    CLOUDFLARE_ACCOUNT_ID: process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID,
  };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CF_API_TOKEN;
  return env;
}

function r2PutWrangler(key, buf, contentType, bucket) {
  const local = join(tmpdir(), `r2-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  writeFileSync(local, buf);
  const r = spawnSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucket}/${key}`,
      `--file=${local}`,
      `--content-type=${contentType}`,
      "--remote",
    ],
    { env: wranglerEnv(), encoding: "utf8" }
  );
  try {
    unlinkSync(local);
  } catch {
    /* ignore */
  }
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || `upload failed ${key}`);
}

function r2GetWrangler(key) {
  const local = join(tmpdir(), `r2get-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const bucket = BUCKET();
  const r = spawnSync(
    "npx",
    ["wrangler", "r2", "object", "get", `${bucket}/${key}`, `--file=${local}`, "--remote"],
    { env: wranglerEnv(), encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || `get failed ${key}`);
  const buf = readFileSync(local);
  try {
    unlinkSync(local);
  } catch {
    /* ignore */
  }
  return buf;
}

function r2DeleteWrangler(key) {
  const bucket = BUCKET();
  const r = spawnSync(
    "npx",
    ["wrangler", "r2", "object", "delete", `${bucket}/${key}`, "--remote"],
    { env: wranglerEnv(), encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || `delete failed ${key}`);
}
