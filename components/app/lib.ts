"use client";

/* Small pieces the phone app's screens share. */

export type AppUser = { id: number | string; email: string; name: string | null; roles: string[] };
export type Me = { signedIn: true; user: AppUser; push: { key: string; on: boolean } };
export type ThreadRow = { id: number; title: string; status: string; source: string; updatedAt: string };
export type Notice = { id: string; at: string; kind: string; title: string; body: string; link: string; read?: boolean };

export async function post<T = Record<string, unknown>>(path: string, body: unknown = {}): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(out.error || `The site answered ${res.status}.`);
  return out;
}

export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export const STATUS_TEXT: Record<string, string> = {
  idle: "Done",
  running: "Working",
  waiting: "Needs you",
  stopped: "Stopped",
  error: "Problem",
};

export function modeText(mode: string) {
  return (
    {
      ask: "asks before every change",
      drafts: "drafts freely, asks before going live",
      trusted: "publishes on its own",
      full: "full autonomy",
    }[mode] ?? mode
  );
}

/** Running as an installed app (from the home screen), not in a browser tab. */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

/** A short, light tap where the phone can (Android); nothing elsewhere. */
export function tap(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // No vibration here.
  }
}

/** What to call this phone in the list of devices that stay signed in. */
export function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "Android phone" : "Android tablet";
  return "Browser";
}

/* ---------- Photos ---------- */

export const PHOTO_LINE = /^📷 Photo (s[a-z0-9]{8,})$/;

/** Shrinks a photo from the camera or library (12 MP, sometimes HEIC) to a sharp JPEG of at most 2048 px. */
export async function shrinkPhoto(file: File, max = 2048): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const source: CanvasImageSource & { width: number; height: number } =
    bitmap ??
    (await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file isn't a photo this phone can read."));
      img.src = URL.createObjectURL(file);
    }));
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  bitmap?.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that photo."))), "image/jpeg", 0.86));
}

/** Sends a photo to the site, where the agent can look at it. */
export async function uploadPhoto(blob: Blob): Promise<{ id: string; url: string }> {
  const res = await fetch("/api/app/photo", { method: "POST", credentials: "include", headers: { "content-type": blob.type || "image/jpeg" }, body: blob });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || `The photo didn't upload (${res.status}).`);
  return out;
}

/* ---------- Notifications ---------- */

function keyBytes(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function registerWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/app/sw.js", { scope: "/app" }).catch(() => null);
}

/** Asks for permission and subscribes this phone; returns why not when it can't. */
export async function turnOnPush(key: string): Promise<string | null> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "On iPhone, add the app to your Home Screen first, then turn notifications on from there." : "This browser can't show notifications.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Notifications are blocked for this app. Allow them in the phone's settings.";
  const reg = (await registerWorker()) ?? (await navigator.serviceWorker.ready);
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  await post("/api/app/subscribe", { subscription: sub.toJSON() });
  return null;
}

export async function turnOffPush() {
  const reg = await navigator.serviceWorker?.getRegistration("/app");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await post("/api/app/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function currentEndpoint() {
  const reg = await navigator.serviceWorker?.getRegistration("/app");
  return (await reg?.pushManager.getSubscription())?.endpoint ?? null;
}

/** The number on the app's icon (where the phone shows one). */
export function setBadge(n: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (n > 0) void nav.setAppBadge?.(n).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  } catch {
    // Not supported here.
  }
}
