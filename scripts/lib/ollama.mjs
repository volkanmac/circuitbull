/**
 * Local Ollama chat (http://127.0.0.1:11434).
 */
const BASE = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma2:27b";

export function getOllamaConfig() {
  return { host: BASE, model: DEFAULT_MODEL };
}

function extractText(json) {
  if (typeof json?.message?.content === "string") return json.message.content;
  if (typeof json?.response === "string") return json.response;
  if (Array.isArray(json?.message?.content)) {
    return json.message.content.map((p) => p.text || p.content || "").join("");
  }
  return "";
}

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

export async function ollamaChat(messages, { model = DEFAULT_MODEL, temperature = 0.15, format = "json", timeoutMs = 180000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format,
        options: { temperature },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || `Ollama HTTP ${res.status}`);
    const text = extractText(json);
    if (!text) throw new Error(`empty Ollama response: ${JSON.stringify(json).slice(0, 300)}`);
    return text;
  } finally {
    clearTimeout(t);
  }
}

export async function ollamaJson(messages, opts = {}) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const text = await ollamaChat(messages, opts);
      return { text, json: parseJsonLoose(text) };
    } catch (err) {
      last = err;
      const msg = String(err?.message || err);
      if (!/abort|timeout|ECONNRESET|fetch failed/i.test(msg) || attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw last;
}
