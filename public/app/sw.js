/*
 * The Jomiez app's service worker (scope /app).
 *
 * - Opens instantly and offline: the app's page and its files are kept, the
 *   page is refreshed from the network whenever there is one.
 * - Shows the notifications the site sends (cms/app/push.ts) and opens the
 *   right conversation when one is tapped.
 * Nothing from /api is ever kept: conversations always come fresh.
 */

const SHELL = "jz-app-shell-v2";
const FILES = "jz-app-files-v1";
const PAGE = "/app";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([PAGE, "/app/wallpaper.webp", "/app/icon-192.png", "/app/badge-96.png"]))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL, FILES];
      for (const key of await caches.keys()) if (key.startsWith("jz-app-") && !keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // The app's page: the network first (always the newest), the kept copy when offline.
  if (req.mode === "navigate" && (url.pathname === PAGE || url.pathname.startsWith(PAGE + "/"))) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok) (await caches.open(SHELL)).put(PAGE, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(PAGE)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Next.js's built files never change once built: kept the first time they're fetched.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app/")) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && url.pathname.startsWith("/_next/static/")) (await caches.open(FILES)).put(req, res.clone());
        return res;
      })(),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Jomiez";
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body: data.body || "",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        icon: "/app/icon-192.png",
        badge: "/app/badge-96.png",
        data: { url: data.url || PAGE },
      });
      // The dot on the app's icon, where the phone shows one.
      if (self.navigator.setAppBadge) await self.navigator.setAppBadge().catch(() => {});
      // An open app refreshes what it shows.
      for (const client of await self.clients.matchAll({ type: "window" })) client.postMessage({ type: "pushed", url: data.url || PAGE });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || PAGE, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const app = open.find((c) => new URL(c.url).pathname.startsWith(PAGE));
      if (app) {
        await app.focus();
        app.postMessage({ type: "open", url });
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
