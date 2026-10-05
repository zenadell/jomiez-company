import type { Payload } from "payload";
import webpush, { type PushSubscription } from "web-push";

/*
 * Notifications on the phone, for the app at /app: when the agent needs an
 * approval, finishes something it did on its own, or finishes a task you left
 * running. Standard Web Push, so it works on Android and on an iPhone with the
 * app added to the Home Screen (iOS 16.4 and later).
 *
 * The VAPID key pair that identifies this site to the push services is made on
 * first use and kept in the database, so there's nothing to set up. Set
 * VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to use your own.
 */

type Keys = { publicKey: string; privateKey: string };
type Subscription = PushSubscription & { userId: number | string; createdAt: string };
export type PushMessage = { title: string; body: string; url: string; tag?: string };

const KEYS = "app:vapid";
const SUBS = "app:push";

async function keys(payload: Payload): Promise<Keys> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const saved = await payload.kv.get<Keys>(KEYS);
  if (saved?.publicKey && saved.privateKey) return saved;
  const made = webpush.generateVAPIDKeys();
  await payload.kv.set(KEYS, made);
  return made;
}

export const vapidPublicKey = async (payload: Payload) => (await keys(payload)).publicKey;

async function subscriptions(payload: Payload): Promise<Subscription[]> {
  return (await payload.kv.get<Subscription[]>(SUBS)) ?? [];
}

export async function subscribe(payload: Payload, userId: number | string, sub: PushSubscription) {
  if (!/^https:\/\//.test(sub?.endpoint ?? "") || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("That isn't a push subscription.");
  const others = (await subscriptions(payload)).filter((s) => s.endpoint !== sub.endpoint);
  const kept: Subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, userId, createdAt: new Date().toISOString() };
  await payload.kv.set(SUBS, [...others, kept].slice(-100));
}

export async function unsubscribe(payload: Payload, endpoint: string) {
  const all = await subscriptions(payload);
  await payload.kv.set(
    SUBS,
    all.filter((s) => s.endpoint !== endpoint),
  );
}

export async function hasSubscription(payload: Payload, userId?: number | string) {
  const all = await subscriptions(payload);
  return userId === undefined ? all.length > 0 : all.some((s) => String(s.userId) === String(userId));
}

/** Who the notifications say they're from (the push services ask for a contact). */
async function contact(payload: Payload) {
  try {
    const site = (await payload.findGlobal({ slug: "site", depth: 0, overrideAccess: true })) as { email?: string };
    if (site.email) return `mailto:${site.email}`;
  } catch {
    // Fall through to the site's own address.
  }
  return "mailto:hello@jomiez.com";
}

/**
 * Sends a notification to every phone that asked for them, or only to one
 * person's. Phones that have since turned notifications off are forgotten.
 * Says how many phones it tried and how many it reached.
 */
export async function push(payload: Payload, msg: PushMessage, opts: { userId?: number | string } = {}): Promise<{ tried: number; reached: number }> {
  const all = await subscriptions(payload);
  const to = opts.userId === undefined ? all : all.filter((s) => String(s.userId) === String(opts.userId));
  if (!to.length) return { tried: 0, reached: 0 };
  const { publicKey, privateKey } = await keys(payload);
  const vapidDetails = { subject: await contact(payload), publicKey, privateKey };
  const body = JSON.stringify({ ...msg, title: msg.title.slice(0, 120), body: msg.body.slice(0, 400) });
  const gone: string[] = [];
  let reached = 0;
  await Promise.all(
    to.map(async (s) => {
      try {
        await webpush.sendNotification(s, body, { vapidDetails, TTL: 24 * 3600, urgency: "high", timeout: 15_000 });
        reached++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint);
        else payload.logger.warn({ msg: "Couldn't send a notification", code, err: (err as Error).message });
      }
    }),
  );
  if (gone.length) {
    const now = await subscriptions(payload);
    await payload.kv.set(
      SUBS,
      now.filter((s) => !gone.includes(s.endpoint)),
    );
  }
  return { tried: to.length - gone.length, reached };
}

/** The first sentence or so of what the agent said, for a notification. */
export function gist(text: string, max = 160) {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>[\]]/g, "")
    .replace(/\(https?:[^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : plain;
}
