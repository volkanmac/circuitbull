/** Minimal RESP GET over Cloudflare TCP sockets (Redis Cloud TLS). */

import { connect } from "cloudflare:sockets";

type RedisTarget = {
  hostname: string;
  port: number;
  username: string;
  password: string;
};

function parseRedisUrl(raw: string): RedisTarget | null {
  try {
    const u = new URL(raw);
    if (!u.hostname) return null;
    return {
      hostname: u.hostname,
      port: Number(u.port || (u.protocol === "rediss:" ? 6380 : 6379)),
      username: decodeURIComponent(u.username || "default"),
      password: decodeURIComponent(u.password || ""),
    };
  } catch {
    return null;
  }
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const len = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function encodeCommand(args: string[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [enc.encode(`*${args.length}\r\n`)];
  for (const a of args) {
    const bytes = enc.encode(a);
    chunks.push(enc.encode(`$${bytes.length}\r\n`), bytes, enc.encode("\r\n"));
  }
  return concatBytes(chunks);
}

function findCrlf(buf: Uint8Array, from = 0): number {
  for (let i = from; i < buf.length - 1; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10) return i;
  }
  return -1;
}

function ascii(buf: Uint8Array, start: number, end: number): string {
  return new TextDecoder().decode(buf.subarray(start, end));
}

function parseOne(buf: Uint8Array): { value: string | null; rest: Uint8Array } | null {
  if (!buf.length) return null;
  const type = buf[0];
  if (type === 43 || type === 45 || type === 58) {
    const end = findCrlf(buf, 0);
    if (end < 0) return null;
    const text = ascii(buf, 1, end);
    if (type === 45) throw new Error(text);
    return { value: text, rest: buf.subarray(end + 2) };
  }
  if (type === 36) {
    const hdr = findCrlf(buf, 0);
    if (hdr < 0) return null;
    const n = Number(ascii(buf, 1, hdr));
    if (!Number.isFinite(n)) throw new Error("bad_bulk_len");
    if (n < 0) return { value: null, rest: buf.subarray(hdr + 2) };
    const start = hdr + 2;
    const end = start + n;
    if (buf.length < end + 2) return null;
    return { value: new TextDecoder().decode(buf.subarray(start, end)), rest: buf.subarray(end + 2) };
  }
  throw new Error("unsupported_resp");
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readMessages(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  count: number,
  timeoutMs: number
): Promise<(string | null)[]> {
  const out: (string | null)[] = [];
  let buf = new Uint8Array(0);
  const deadline = Date.now() + timeoutMs;
  while (out.length < count) {
    const parsed = parseOne(buf);
    if (parsed) {
      out.push(parsed.value);
      buf = parsed.rest;
      continue;
    }
    const remain = deadline - Date.now();
    if (remain <= 0) throw new Error("redis_read_timeout");
    const chunk = await withTimeout(reader.read(), remain, "redis_read_timeout");
    if (chunk.done) throw new Error("redis_closed");
    buf = concatBytes([buf, chunk.value]);
  }
  return out;
}

async function redisGetOnce(target: RedisTarget, key: string, tls: boolean): Promise<string | null> {
  let socket: ReturnType<typeof connect> | null = null;
  try {
    socket = connect(
      { hostname: target.hostname, port: target.port },
      { secureTransport: tls ? "on" : "off", allowHalfOpen: false }
    );
    await withTimeout(socket.opened, 2500, "redis_connect_timeout");
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const authCmd = target.username && target.username !== "default"
      ? encodeCommand(["AUTH", target.username, target.password])
      : target.password
        ? encodeCommand(["AUTH", target.password])
        : null;
    await writer.write(authCmd ? concatBytes([authCmd, encodeCommand(["GET", key])]) : encodeCommand(["GET", key]));
    const msgs = await readMessages(reader, authCmd ? 2 : 1, 3000);
    const bulk = authCmd ? msgs[1] : msgs[0];
    try {
      await writer.close();
    } catch {
      /* ignore */
    }
    reader.releaseLock();
    await socket.close().catch(() => {});
    return bulk;
  } catch (err) {
    try {
      await socket?.close();
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export async function redisGet(url: string, key: string): Promise<string | null> {
  const target = parseRedisUrl(url);
  if (!target || !key) return null;
  const preferTls = url.startsWith("rediss://") || target.hostname.includes("redis.io") || target.hostname.includes("redislabs");
  const order = preferTls ? [true, false] : [false, true];
  let last = "";
  for (const tls of order) {
    try {
      return await redisGetOnce(target, key, tls);
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
  }
  console.warn("redisGet failed", last);
  return null;
}
