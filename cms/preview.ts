/*
 * Where each document lives on the site, for the admin's live preview and
 * "Open page" links.
 */

/**
 * The site's address, only if pinned with NEXT_PUBLIC_SERVER_URL. Left unset,
 * the admin works from whatever address it is opened at (localhost, a Vercel
 * preview link, www. or the bare domain).
 */
export const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || "";

/** The address a request came in on, e.g. https://jomiez.com. */
export function originOf(headers: Headers | undefined | null): string {
  if (serverUrl) return serverUrl;
  const host = headers?.get("x-forwarded-host") || headers?.get("host");
  if (!host) return "";
  const proto = headers?.get("x-forwarded-proto") || (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

const GLOBAL_PATHS: Record<string, string> = {
  home: "/",
  about: "/about",
  "services-page": "/services",
  "work-page": "/work",
  "journal-page": "/insights",
  "contact-page": "/contact",
  privacy: "/privacy-policy",
  terms: "/terms-conditions",
  "not-found": "/this-page-does-not-exist",
};

export function previewPath({
  collection,
  global,
  slug,
}: {
  collection?: string;
  global?: string;
  slug?: unknown;
}): string {
  const s = typeof slug === "string" && slug ? slug : "";
  if (collection === "projects") return s ? `/work/${s}` : "/work";
  if (collection === "articles") return s ? `/insights/${s}` : "/insights";
  if (collection === "pages") return s ? `/${s}` : "/";
  if (global) return GLOBAL_PATHS[global] ?? "/";
  return "/";
}
