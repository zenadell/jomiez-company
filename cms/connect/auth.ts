import { timingSafeEqual } from "node:crypto";
import type { Payload, TypedUser } from "payload";
import { fingerprint, type Scope } from "./keys";

/*
 * Checking a request's access key, and keeping a record of every call:
 * wrong keys from one address are slowed down, each key has a request limit,
 * and the last few hundred calls are kept for the owner to look through.
 */

export type Caller = {
  key: { id: number; name: string; scopes: Scope[]; prefix: string };
  user: TypedUser;
  ip: string;
};

export type Refusal = { status: number; error: string; headers?: Record<string, string> };

const PER_MINUTE = 120;
const RUNNER_PER_MINUTE = 1200;
const BAD_PER_TEN_MINUTES = 20;

/**
 * The caller's address as this site's host sees it: the last hop in
 * X-Forwarded-For was added by the host's own proxy (earlier hops are
 * whatever the caller claimed).
 */
export function clientIp(headers: Headers) {
  const hops = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return hops[hops.length - 1] || headers.get("x-real-ip") || "unknown";
}

/** Counts a hit in a fixed window and says whether it's over the limit. */
async function over(payload: Payload, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = await payload.kv.get<{ start: number; n: number }>(key);
  const fresh = !cur || now - cur.start > windowMs;
  const next = fresh ? { start: now, n: 1 } : { start: cur.start, n: cur.n + 1 };
  await payload.kv.set(key, next);
  return next.n > limit ? Math.ceil((next.start + windowMs - now) / 1000) : 0;
}

export async function authenticate(payload: Payload, headers: Headers): Promise<Caller | Refusal> {
  const ip = clientIp(headers);
  const raw = /^Bearer\s+(\S+)$/i.exec(headers.get("authorization") ?? "")?.[1] ?? "";
  const badKey = `connect:bad:${ip}`;
  const refuse = async (error: string): Promise<Refusal> => {
    const wait = await over(payload, badKey, BAD_PER_TEN_MINUTES, 10 * 60_000);
    return wait ? { status: 429, error: "Too many wrong keys from this address. Try again later.", headers: { "retry-after": String(wait) } } : { status: 401, error, headers: { "www-authenticate": 'Bearer realm="jomiez"' } };
  };
  // Already over the limit for wrong keys: don't even look this one up.
  const strikes = await payload.kv.get<{ start: number; n: number }>(badKey);
  if (strikes && strikes.n >= BAD_PER_TEN_MINUTES && Date.now() - strikes.start < 10 * 60_000) {
    return { status: 429, error: "Too many wrong keys from this address. Try again later.", headers: { "retry-after": "600" } };
  }
  if (!/^jz_[A-Za-z0-9_-]{43}$/.test(raw)) return refuse("Send an access key: Authorization: Bearer jz_… (make one in the admin under Agent → Access keys).");

  const hash = fingerprint(raw);
  const { docs } = await payload.find({ collection: "access-keys", where: { hash: { equals: hash } }, limit: 1, depth: 0, overrideAccess: true });
  const doc = docs[0] as unknown as
    | { id: number; name: string; scopes?: Scope[]; prefix?: string; hash?: string; revoked?: boolean; expiresAt?: string | null; allowedIps?: string | null; owner?: number | null; lastUsedAt?: string | null }
    | undefined;
  // The database matched it; compare again in constant time all the same.
  if (!doc?.hash || !timingSafeEqual(Buffer.from(doc.hash), Buffer.from(hash))) return refuse("That access key isn't valid.");
  if (doc.revoked) return refuse("That access key has been revoked.");
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) return refuse("That access key has expired.");
  const allowed = String(doc.allowedIps ?? "")
    .split(/[\s,]+/)
    .filter(Boolean);
  if (allowed.length && !allowed.includes(ip)) return { status: 403, error: `This key can't be used from ${ip}.` };

  const user = doc.owner ? ((await payload.findByID({ collection: "users", id: doc.owner, depth: 0, overrideAccess: true }).catch(() => null)) as TypedUser | null) : null;
  // Only an admin's key works, and only while they're still an admin.
  if (!user || !(user as { roles?: string[] }).roles?.includes("admin")) return { status: 403, error: "The admin this key acts as no longer exists or isn't an admin." };

  // The Aethron runner makes two short requests for every step of Aethron's work, so it may make more.
  const limit = (doc.scopes ?? []).includes("runner") ? RUNNER_PER_MINUTE : PER_MINUTE;
  const wait = await over(payload, `connect:rate:${doc.id}`, limit, 60_000);
  if (wait) return { status: 429, error: `More than ${limit} requests a minute. Slow down.`, headers: { "retry-after": String(wait) } };

  // Note when and where it was last used (at most once a minute, to keep writes down).
  if (!doc.lastUsedAt || Date.now() - new Date(doc.lastUsedAt).getTime() > 60_000) {
    await payload
      .update({ collection: "access-keys", id: doc.id, data: { lastUsedAt: new Date().toISOString(), lastUsedIp: ip } as never, overrideAccess: true, depth: 0 })
      .catch(() => undefined);
  }
  return {
    key: { id: doc.id, name: doc.name, scopes: (doc.scopes ?? []) as Scope[], prefix: doc.prefix ?? "" },
    user: { ...user, collection: "users" } as TypedUser,
    ip,
  };
}

export const refused = (r: Caller | Refusal): r is Refusal => "error" in r;

/* ---------- The record of calls ---------- */

export type LogEntry = { at: string; key: number; name: string; ip: string; via: "api" | "mcp"; what: string; ok: boolean; note?: string };

const LOG = "connect:log";

export async function logCall(payload: Payload, entry: Omit<LogEntry, "at">) {
  const all = (await payload.kv.get<LogEntry[]>(LOG)) ?? [];
  await payload.kv.set(LOG, [{ ...entry, at: new Date().toISOString() }, ...all].slice(0, 400));
}

export async function readLog(payload: Payload, key?: number) {
  const all = (await payload.kv.get<LogEntry[]>(LOG)) ?? [];
  return key ? all.filter((e) => e.key === key) : all;
}
