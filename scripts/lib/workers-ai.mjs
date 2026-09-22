/**
 * Cloudflare Workers AI chat client (Workers AI REST API).
 * Endpoint type: Cloudflare Workers AI `/ai/run/{model}` with messages payload.
 */
import "dotenv/config";

const ACCOUNT = process.env.CF_AI_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_AI_API_TOKEN || process.env.CF_API_TOKEN;
const MODEL = process.env.CF_AI_MODEL || "@cf/moonshotai/kimi-k2.7-code";
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getAiConfig() {
  return { accountId: ACCOUNT, model: MODEL, configured: Boolean(ACCOUNT && TOKEN) };
}

/**
 * Run a chat completion. Returns assistant text.
 */
export async function runChat(messages, { model = MODEL, maxRetries = 4, temperature } = {}) {
  if (!ACCOUNT || !TOKEN) throw new Error("CF_AI_ACCOUNT_ID / CF_AI_API_TOKEN missing");

  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const body = { messages };
      if (temperature != null) body.temperature = temperature;

      const ac = new AbortController();
      const hardTimeoutMs = Number(process.env.CF_AI_TIMEOUT_MS || 90000);
      const timer = setTimeout(() => ac.abort(new Error(`AI timeout ${hardTimeoutMs}ms`)), hardTimeoutMs);
      let res;
      try {
        res = await fetch(`${BASE}${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        const errMsg =
          json?.errors?.[0]?.message ||
          json?.error ||
          `HTTP ${res.status}`;
        // rate limit / capacity
        if (res.status === 429 || res.status === 503 || /rate|capacity|overload/i.test(String(errMsg))) {
          const wait = Math.min(30000, 1500 * 2 ** attempt);
          await sleep(wait);
          lastErr = new Error(errMsg);
          continue;
        }
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      const text = extractText(json);
      if (!text) throw new Error(`empty AI response: ${JSON.stringify(json).slice(0, 400)}`);
      return text;
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const timedOut = /timeout|aborted|AbortError/i.test(msg);
      if (timedOut && attempt >= 1) throw e;
      if (attempt < maxRetries) await sleep(timedOut ? 1500 : 1000 * (attempt + 1));
    }
  }
  throw lastErr || new Error("Workers AI failed");
}

function extractText(json) {
  const r = json?.result;
  if (!r) return "";
  if (typeof r.response === "string") return r.response;
  if (typeof r === "string") return r;
  if (typeof r.text === "string") return r.text;
  if (Array.isArray(r.choices) && r.choices[0]?.message?.content) {
    return r.choices[0].message.content;
  }
  if (typeof r.message === "string") return r.message;
  if (r.message?.content) return r.message.content;
  return "";
}

/** Extract first JSON object/array from model output. */
export function parseJsonLoose(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  try {
    return JSON.parse(candidate);
  } catch {
    /* continue */
  }
  const start = candidate.search(/[\{\[]/);
  if (start < 0) throw new Error("no JSON in model output");
  const slice = candidate.slice(start);
  // brace match
  let depth = 0;
  let end = -1;
  const open = slice[0];
  const close = open === "[" ? "]" : "}";
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error("unterminated JSON in model output");
  return JSON.parse(slice.slice(0, end));
}

export async function runJsonChat(messages, opts = {}) {
  const text = await runChat(messages, opts);
  return { text, json: parseJsonLoose(text) };
}
