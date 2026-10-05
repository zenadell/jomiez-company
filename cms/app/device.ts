import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getFieldsToSign, jwtSign, type Payload } from "payload";
import { generatePayloadCookie } from "payload/shared";

/*
 * "Stay signed in on this phone", for the app at /app.
 *
 * An admin sign-in lasts 8 hours (Users → tokenExpiration), which is right for
 * a desktop but means signing in again every morning on a phone. When asked,
 * the app also gets a long-lived device key: a random secret in an HttpOnly
 * cookie that only /api/app can read, stored here as a hash. When the 8-hour
 * sign-in has run out, the app trades the key for a fresh one. Signing out of
 * the app deletes the key; an unused key runs out after 90 days.
 */

export const DEVICE_COOKIE = "jz-device";
export const DEVICE_DAYS = 90;
const KEY = "app:devices";

type Device = { hash: string; userId: number | string; name: string; createdAt: string; usedAt: string; expiresAt: string };
type Session = { id: string; createdAt: Date | string; expiresAt: Date | string };

const hashOf = (secret: string) => createHash("sha256").update(secret).digest("hex");
const expiry = () => new Date(Date.now() + DEVICE_DAYS * 86_400_000).toISOString();

async function devices(payload: Payload): Promise<Device[]> {
  const all = (await payload.kv.get<Device[]>(KEY)) ?? [];
  return all.filter((d) => new Date(d.expiresAt).getTime() > Date.now());
}

/** A new device key for this user; the secret goes in the cookie, only its hash is kept. */
export async function rememberDevice(payload: Payload, userId: number | string, name: string): Promise<string> {
  const secret = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();
  const all = await devices(payload);
  await payload.kv.set(KEY, [...all, { hash: hashOf(secret), userId, name: name.slice(0, 80), createdAt: now, usedAt: now, expiresAt: expiry() }].slice(-50));
  return secret;
}

export async function forgetDevice(payload: Payload, secret: string | undefined) {
  if (!secret) return;
  const hash = hashOf(secret);
  const all = await devices(payload);
  await payload.kv.set(
    KEY,
    all.filter((d) => d.hash !== hash),
  );
}

/** Signs the user in again from a device key: the Set-Cookie value for a fresh sign-in, or null. */
export async function resumeDevice(payload: Payload, secret: string | undefined): Promise<{ cookie: string; userId: number | string } | null> {
  if (!secret) return null;
  const hash = hashOf(secret);
  const all = await devices(payload);
  const device = all.find((d) => d.hash === hash);
  if (!device) return null;
  const cookie = await signIn(payload, device.userId).catch(() => null);
  // The account is gone or locked: the key is no use any more.
  if (!cookie) {
    await payload.kv.set(
      KEY,
      all.filter((d) => d !== device),
    );
    return null;
  }
  // Each use keeps the key going for another 90 days.
  await payload.kv.set(
    KEY,
    all.map((d) => (d === device ? { ...d, usedAt: new Date().toISOString(), expiresAt: expiry() } : d)),
  );
  return { cookie, userId: device.userId };
}

/*
 * A sign-in made the way Payload's own login makes one (auth/operations/login.js):
 * a session added to the user, and a token naming it, in Payload's cookie.
 */
async function signIn(payload: Payload, userId: number | string): Promise<string> {
  const collectionConfig = payload.collections.users.config;
  const auth = collectionConfig.auth;
  const user = (await payload.db.findOne({ collection: "users", where: { id: { equals: userId } } })) as
    | (Record<string, unknown> & { id: number | string; email: string; sessions?: Session[]; lockUntil?: string | null })
    | null;
  if (!user) throw new Error("No such user.");
  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) throw new Error("Locked.");

  let sid: string | undefined;
  if (auth.useSessions) {
    sid = randomUUID();
    const now = new Date();
    const sessions = [
      ...(user.sessions ?? []).filter((s) => new Date(s.expiresAt).getTime() > now.getTime()),
      { id: sid, createdAt: now, expiresAt: new Date(now.getTime() + auth.tokenExpiration * 1000) },
    ];
    // updatedAt: null keeps the account's "last changed" date as it was, as Payload's login does.
    await payload.db.updateOne({ collection: "users", id: user.id, data: { sessions, updatedAt: null }, returning: false });
    user.sessions = sessions;
  }
  const fieldsToSign = getFieldsToSign({ collectionConfig, email: user.email, sid, user: { ...user, collection: "users" } as never });
  const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration: auth.tokenExpiration });
  return generatePayloadCookie({ collectionAuthConfig: auth, cookiePrefix: payload.config.cookiePrefix, token }) as string;
}

/** The device-key cookie: HttpOnly, sent only to /api/app, never to another site. */
export function deviceCookie(secret: string | null) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return secret
    ? `${DEVICE_COOKIE}=${secret}; Path=/api/app; Max-Age=${DEVICE_DAYS * 86_400}; HttpOnly; SameSite=Strict${secure}`
    : `${DEVICE_COOKIE}=; Path=/api/app; Max-Age=0; HttpOnly; SameSite=Strict${secure}`;
}
