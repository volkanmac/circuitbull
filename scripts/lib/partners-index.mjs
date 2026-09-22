/** Authorized-seller list for Redis + KV. Worker renders /partners from this blob — no client fetch. */

import { createClient } from "redis";

export const PARTNERS_KEY = "partners:all";

export function buildPartnersIndex(partners) {
  const list = Array.isArray(partners) ? partners : [];
  return {
    v: 1,
    builtAt: new Date().toISOString(),
    count: list.length,
    partners: list,
  };
}

export async function syncPartnersIndex({ partners, putKey, nsId }) {
  const index = buildPartnersIndex(partners);
  const body = JSON.stringify(index);

  let redisOk = false;
  if (process.env.REDIS_URL) {
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (e) => console.warn("redis", e.message));
    await redis.connect();
    await redis.set(PARTNERS_KEY, body);
    await redis.quit();
    redisOk = true;
  }

  if (putKey && nsId) {
    await putKey(nsId, PARTNERS_KEY, index);
    await putKey(nsId, "partners", partners);
  }

  return { redis: redisOk, key: PARTNERS_KEY, count: index.count };
}
