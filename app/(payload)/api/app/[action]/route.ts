import config from "@payload-config";
import { getPayload } from "payload";
import { generateExpiredPayloadCookie, generatePayloadCookie } from "payload/shared";
import { keepShot } from "@/cms/agent/eyes";
import { DEVICE_COOKIE, deviceCookie, forgetDevice, rememberDevice, resumeDevice } from "@/cms/app/device";
import { hasSubscription, push, subscribe, unsubscribe, vapidPublicKey } from "@/cms/app/push";
import { originOf } from "@/cms/preview";

/*
 * The phone app's endpoints (/app). Everything else it does goes through the
 * agent's own endpoints (/api/agent/…), with the same rules as the admin.
 *   GET  me           who's signed in, and the key for notifications
 *   POST login        sign in; with remember: true, stay signed in on this phone
 *   POST resume       sign in again with this phone's device key
 *   POST logout       forget this phone's device key and end the sign-in
 *   POST subscribe    turn notifications on for this phone
 *   POST unsubscribe  turn them off
 *   POST test-push    send a test notification to this person's phones
 *   POST photo        keep a photo (the raw image) for the agent to look at
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ action: string }> };

const json = (data: unknown, status = 200, cookies: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(JSON.stringify(data), { status, headers });
};

function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

/** Requests from another site are refused (the sign-in cookies would otherwise go with them). */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === originOf(req.headers);
}

const MAX_PHOTO = 10 * 1024 * 1024;

type AppUser = { id: number | string; email: string; name?: string | null; roles?: string[] | null };
const who = (u: AppUser) => ({ id: u.id, email: u.email, name: u.name ?? null, roles: u.roles ?? [] });

export async function GET(req: Request, { params }: Params) {
  const { action } = await params;
  const payload = await getPayload({ config });
  if (action !== "me") return json({ error: "Unknown action." }, 404);
  const { user } = await payload.auth({ headers: req.headers });
  // A device key that can sign in again is worth knowing about before showing the sign-in screen.
  if (!user) return json({ signedIn: false, canResume: Boolean(readCookie(req, DEVICE_COOKIE)) }, 401);
  return json({
    signedIn: true,
    user: who(user as AppUser),
    push: { key: await vapidPublicKey(payload), on: await hasSubscription(payload, user.id) },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  if (!sameOrigin(req)) return json({ error: "Wrong origin." }, 403);
  const payload = await getPayload({ config });
  const auth = payload.collections.users.config.auth;
  const cookiePrefix = payload.config.cookiePrefix;

  if (action === "login") {
    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string; remember?: boolean; device?: string };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || !password) return json({ error: "Enter your email and password." }, 400);
    try {
      const { token, user } = await payload.login({ collection: "users", data: { email, password } });
      if (!token || !user) throw new Error("No sign-in.");
      const cookies = [generatePayloadCookie({ collectionAuthConfig: auth, cookiePrefix, token }) as string];
      if (body.remember) cookies.push(deviceCookie(await rememberDevice(payload, user.id, String(body.device || "Phone"))));
      return json({ signedIn: true, user: who(user as AppUser) }, 200, cookies);
    } catch (err) {
      const name = (err as Error).name;
      const message =
        name === "LockedAuth"
          ? "Too many wrong tries: this account is locked for 10 minutes."
          : name === "UnverifiedEmail"
            ? "This account's email isn't verified yet."
            : "That email and password don't match.";
      return json({ error: message }, 401);
    }
  }

  if (action === "resume") {
    const secret = readCookie(req, DEVICE_COOKIE);
    const resumed = await resumeDevice(payload, secret);
    if (!resumed) return json({ error: "Sign in again." }, 401, secret ? [deviceCookie(null)] : []);
    // The device cookie is sent again so its 90 days start over.
    return json({ signedIn: true }, 200, [resumed.cookie, deviceCookie(secret!)]);
  }

  if (action === "logout") {
    await forgetDevice(payload, readCookie(req, DEVICE_COOKIE));
    const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
    if (body.endpoint) await unsubscribe(payload, body.endpoint);
    return json({ ok: true }, 200, [deviceCookie(null), generateExpiredPayloadCookie({ collectionAuthConfig: auth, cookiePrefix }) as string]);
  }

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return json({ error: "Sign in first." }, 401);

  switch (action) {
    case "subscribe": {
      const body = (await req.json().catch(() => ({}))) as { subscription?: Parameters<typeof subscribe>[2] };
      try {
        await subscribe(payload, user.id, body.subscription as Parameters<typeof subscribe>[2]);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
      return json({ ok: true });
    }
    case "unsubscribe": {
      const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
      if (body.endpoint) await unsubscribe(payload, body.endpoint);
      return json({ ok: true });
    }
    case "test-push": {
      const { tried, reached } = await push(
        payload,
        { title: "Notifications are on", body: "This phone will hear when the agent needs you or finishes something.", url: "/app", tag: "test" },
        { userId: user.id },
      );
      if (reached) return json({ ok: true, reached });
      return json({ error: tried ? "Your phone's notification service didn't take it. Try again in a moment." : "No phone of yours has notifications on." }, tried ? 502 : 400);
    }
    case "photo": {
      const type = (req.headers.get("content-type") ?? "").split(";")[0].trim();
      if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: "Send a JPEG, PNG or WebP image." }, 415);
      if (Number(req.headers.get("content-length") ?? 0) > MAX_PHOTO) return json({ error: "That photo is too big (10 MB at most)." }, 413);
      const data = Buffer.from(await req.arrayBuffer());
      if (!data.byteLength) return json({ error: "The photo didn't arrive." }, 400);
      if (data.byteLength > MAX_PHOTO) return json({ error: "That photo is too big (10 MB at most)." }, 413);
      return json(keepShot(data, type));
    }
    default:
      return json({ error: "Unknown action." }, 404);
  }
}
