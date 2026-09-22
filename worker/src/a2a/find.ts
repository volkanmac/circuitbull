/** Product finding + conversational replies for ChatGPT / A2A engines. */

import { SITE_ORIGIN, solutionPath } from "../i18n/locales";
import { commercialAdvice, commercialReplyLines, detectIntents } from "./advise";
import { filterPlatforms, loadPlatformIndex, publicPlatformCard } from "../search/catalog";
import { solutionCopy } from "../solutions";

export type FindEnv = { DATA: KVNamespace; REDIS_URL?: string };

function scoreNeed(n: any, copy: { title?: string; lead?: string; problem?: string }, needle: string) {
  const hay = `${n.slug} ${copy.title || ""} ${copy.lead || ""} ${copy.problem || ""}`.toLowerCase();
  if (!needle) return 1;
  if (hay.includes(needle)) return 80;
  const words = needle.split(/\s+/).filter((w) => w.length > 2);
  if (words.length && words.every((w) => hay.includes(w))) return 50;
  if (words.some((w) => hay.includes(w))) return 20;
  return 0;
}

export async function findCatalog(env: FindEnv, q: string, lang: string, limit = 8) {
  const needle = String(q || "").trim().toLowerCase();
  const { index, source } = await loadPlatformIndex(env, lang);
  const productHits = filterPlatforms(index.items, needle, limit).map(publicPlatformCard);
  const rawNeeds = await env.DATA.get("needs");
  const needs = (rawNeeds ? JSON.parse(rawNeeds) : []).filter((n: any) => n.catalog !== false);
  const solutions = needs
    .map((n) => {
      const copy = solutionCopy(n, lang);
      return { n, copy, s: scoreNeed(n, copy, needle) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map(({ n, copy }) => ({
      slug: n.slug,
      title: copy.title,
      lead: copy.lead || copy.problem || "",
      url: `${SITE_ORIGIN}${solutionPath(lang, n.slug)}`,
    }));
  return { q: q || "", lang, source, products: productHits, solutions };
}

export function chatReply(
  q: string,
  lang: string,
  found: { products: ReturnType<typeof publicPlatformCard>[]; solutions: { title: string; url: string; lead: string }[] },
  extraLines: string[] = []
) {
  const lines: string[] = [];
  const commercialOnly = extraLines.length > 0 && !found.products.length && !found.solutions.length;
  if (!q.trim()) {
    lines.push(
      "Ask for a mission (border, airport, fire), a SKU like Cb-000040, nearest office (country), an order/quote, or project funding."
    );
  } else if (!found.products.length && !found.solutions.length && !commercialOnly) {
    lines.push(
      `No exact catalog match for “${q}”. Try a model (AGT-TC…), SKU (Cb-xxxxxx), or mission: border, airport, oilfield, fire.`
    );
  } else if (found.products.length || found.solutions.length) {
    lines.push(`Circuitbull® matches for “${q}”:`);
    for (const p of found.products.slice(0, 6)) {
      const url = `${SITE_ORIGIN}${p.path}`;
      lines.push(`- ${p.sku} · ${p.name}${p.model ? ` (${p.model})` : ""} — ${url}`);
    }
    for (const s of found.solutions.slice(0, 3)) {
      lines.push(`- Mission: ${s.title} — ${s.url}`);
    }
  }
  lines.push(...extraLines);
  if (!extraLines.some((l) => /apply|quote \/ order|başvuru|nda session|authorized seller/i.test(l))) {
    lines.push(`Quote / briefing: ${SITE_ORIGIN}${lang === "en" ? "/contact" : `/${lang}/contact`}`);
  }
  return lines.join("\n");
}

export async function converse(
  env: FindEnv,
  q: string,
  lang: string,
  limit = 8,
  opts: { country?: string; city?: string; lat?: number; lng?: number; geoCountryHint?: string } = {}
) {
  const intents = detectIntents(q);
  const catalogCue = /cb-\d{6}|agt-|thermal|ptz|camera|sensor|sku|border|airport|oilfield|coastal|fire/i.test(q);
  const skipCatalog =
    (intents.office || intents.funding || intents.apply || intents.whatsapp || intents.reseller || intents.ndaSession) &&
    !intents.order &&
    !intents.solution &&
    !intents.ministry &&
    !intents.noBudget &&
    !intents.offset &&
    !catalogCue;
  const found = skipCatalog && q.trim()
    ? { q, lang, source: "skip" as const, products: [] as ReturnType<typeof publicPlatformCard>[], solutions: [] as { slug: string; title: string; lead: string; url: string }[] }
    : await findCatalog(env, q, lang, limit);
  const advice = await commercialAdvice(env, q, lang, opts);
  const extra = commercialReplyLines(advice);
  const catalogFound = {
    products: found.products || [],
    solutions: found.solutions || [],
  };
  return {
    found: { ...found, products: catalogFound.products, solutions: catalogFound.solutions },
    advice,
    reply: chatReply(q, lang, catalogFound, extra),
  };
}

function textFromA2aMessage(msg: any): string {
  if (typeof msg === "string") return msg;
  const parts = msg?.parts || msg?.content || [];
  if (typeof parts === "string") return parts;
  if (Array.isArray(parts)) {
    return parts
      .map((p) => p?.text || p?.content || (typeof p === "string" ? p : ""))
      .filter(Boolean)
      .join(" ");
  }
  return String(msg?.text || msg?.content || "");
}

export async function handleA2aJsonRpc(env: FindEnv, body: any, langHint?: string) {
  const id = body?.id ?? 1;
  const method = String(body?.method || "");
  if (method === "tasks/cancel") {
    return { jsonrpc: "2.0", id, result: { id: body?.params?.id, status: { state: "canceled" } } };
  }
  const msg = body?.params?.message || body?.params?.messages?.[0] || body?.params;
  const text = textFromA2aMessage(msg).trim();
  const lang = String(body?.params?.metadata?.lang || langHint || "en");
  if (!text && (method === "message/send" || method === "tasks/send" || method === "SendTask" || !method)) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32602, message: "message text required" },
    };
  }
  const out = await converse(env, text || "thermal PTZ", lang, 8);
  const artifacts = out.found.products.map((p: ReturnType<typeof publicPlatformCard>) => ({
    name: p.name,
    sku: p.sku,
    url: `${SITE_ORIGIN}${p.path}`,
  }));
  return {
    jsonrpc: "2.0",
    id,
    result: {
      id: String(id),
      status: { state: "completed" },
      history: [
        { role: "user", parts: [{ type: "text", text }] },
        { role: "agent", parts: [{ type: "text", text: out.reply }] },
      ],
      artifacts: [
        {
          name: "catalog-matches",
          parts: [
            {
              type: "data",
              data: {
                products: artifacts,
                solutions: out.found.solutions,
                office: out.advice.office,
                funding: out.advice.funding,
                apply: out.advice.apply,
                whatsapp: out.advice.whatsapp,
                desk: out.advice.desk,
              },
            },
          ],
        },
      ],
    },
  };
}
