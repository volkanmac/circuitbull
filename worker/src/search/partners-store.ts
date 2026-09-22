/** Redis-first authorized-seller list. /partners is SSR — no client data fetch. */

import type { PartnerRecord } from "../ui/partners";
import { redisGet } from "./redis";

export const PARTNERS_KEY = "partners:all";
const MEM_TTL_MS = 45_000;

type StoreEnv = { DATA: KVNamespace; REDIS_URL?: string };

type PartnersIndex = {
  v?: number;
  builtAt?: string;
  count?: number;
  partners: PartnerRecord[];
};

let mem: { at: number; index: PartnersIndex; source: string } | null = null;

function parseIndex(raw: unknown): PartnersIndex | null {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data)) return { v: 1, count: data.length, partners: data };
    if (data && Array.isArray(data.partners)) return data as PartnersIndex;
    return null;
  } catch {
    return null;
  }
}

async function kvGetJson(kv: KVNamespace, key: string): Promise<unknown | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadPartners(
  env: StoreEnv
): Promise<{ partners: PartnerRecord[]; source: "memory" | "redis" | "kv" }> {
  if (mem && Date.now() - mem.at < MEM_TTL_MS && mem.index.partners?.length) {
    return { partners: mem.index.partners, source: "memory" };
  }

  if (env.REDIS_URL) {
    const fromRedis = parseIndex(await redisGet(env.REDIS_URL, PARTNERS_KEY));
    if (fromRedis?.partners?.length) {
      mem = { at: Date.now(), index: fromRedis, source: "redis" };
      return { partners: fromRedis.partners, source: "redis" };
    }
  }

  const fromKv =
    parseIndex(await kvGetJson(env.DATA, PARTNERS_KEY)) || parseIndex(await kvGetJson(env.DATA, "partners"));
  const partners = fromKv?.partners || [];
  if (partners.length) mem = { at: Date.now(), index: fromKv!, source: "kv" };
  return { partners, source: "kv" };
}
