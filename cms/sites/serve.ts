import config from "@payload-config";
import { getPayload } from "payload";
import { getManifest, readBlob } from "./storage";

/*
 * Serving a preview made from a template: its files, exactly as Aethron
 * exported them, at /preview/<slug>/…
 *
 * A template's own scripts run on its pages. So that they never run where
 * the admin is signed in, these previews belong on their own address,
 * PREVIEW_SITES_HOST (e.g. preview.jomiez.com, pointed at this same server):
 * the admin's login cookie isn't sent there, and the admin isn't served there
 * (next.config.ts). Until that address is set up, the pages are served here inside
 * a browser sandbox, which keeps them away from the login too (a few template
 * effects that need the browser's storage may not work in it).
 */

/** The previews' own address: "preview.jomiez.com" (https), or a full origin such as "http://preview.localhost:3000". */
export const previewOrigin = (): { origin: string; hostname: string } | null => {
  const raw = (process.env.PREVIEW_SITES_HOST || "").trim().toLowerCase();
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
    return { origin: u.origin, hostname: u.hostname };
  } catch {
    return null;
  }
};

/** Where a template preview opens. */
export const siteEntry = (slug: string) => {
  const own = previewOrigin();
  return own ? `${own.origin}/preview/${slug}` : `/preview/${slug}/index.html`;
};

const leads = new Map<string, { at: number; ok: boolean }>();

async function isSite(slug: string) {
  const hit = leads.get(slug);
  if (hit && Date.now() - hit.at < 30_000) return hit.ok;
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "leads", where: { "preview.slug": { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, select: { status: true, preview: { kind: true } } });
  const l = docs[0] as unknown as { status?: string; preview?: { kind?: string } } | undefined;
  const ok = Boolean(l && l.status !== "stopped" && l.preview?.kind === "aethron");
  leads.set(slug, { at: Date.now(), ok });
  if (leads.size > 500) leads.delete(leads.keys().next().value as string);
  return ok;
}

const missingPage = () =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not here</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;font:17px/1.5 system-ui,sans-serif;background:#f6f3ef;color:#1c1612"><p>This preview isn't here any more. <a href="https://www.jomiez.com">Jomiez</a></p>`,
    { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );

// allow-scripts must stay: without it the page shows nothing. Aethron's exports bring their own stand-in for the storage a sandbox takes away.
const SANDBOX = "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-downloads";

/** Types browsers are strict about, by file name, whatever the upload said: a module script served as anything else doesn't run. */
const typeOf = (name: string, given?: string | null) =>
  /\.[mc]?js$/i.test(name) ? "text/javascript; charset=utf-8"
  : /\.css$/i.test(name) ? "text/css; charset=utf-8"
  : /\.html?$/i.test(name) ? "text/html; charset=utf-8"
  : /\.framercms$/i.test(name) ? "application/octet-stream"
  : given || "application/octet-stream";

function headersFor(name: string, type: string | null | undefined, etag: string | null, sandboxed: boolean) {
  const t = typeOf(name, type);
  const html = /^text\/html/i.test(t);
  const headers: Record<string, string> = {
    "content-type": t,
    "cache-control": html ? "no-cache" : "public, max-age=3600, stale-while-revalidate=86400",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-robots-tag": "noindex",
  };
  if (etag) headers.etag = etag;
  if (sandboxed) {
    if (html) headers["content-security-policy"] = SANDBOX;
    // A sandboxed page has no origin of its own, so its scripts, fonts, CMS data and other pages load as cross-origin requests.
    headers["access-control-allow-origin"] = "*";
  }
  return headers;
}

/** Hosted Aethron (Mode B) serves its finished previews itself, at /preview/<name>/…; pass them through unchanged. */
async function fromHosted(req: Request, slug: string, rel: string, sandboxed: boolean): Promise<Response | null> {
  const url = process.env.AETHRON_MCP_URL?.trim();
  if (!url || !process.env.AETHRON_MCP_TOKEN?.trim()) return null;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return null;
  }
  const tries = rel ? [rel, ...(/\.[a-z0-9]+$/i.test(rel) ? [] : [`${rel.replace(/\/$/, "")}.html`, `${rel.replace(/\/$/, "")}/index.html`])] : ["index.html"];
  for (const name of tries) {
    const path = name.split("/").map(encodeURIComponent).join("/");
    const inm = req.headers.get("if-none-match");
    const res = await fetch(`${origin}/preview/${slug}/${path}`, { headers: inm ? { "if-none-match": inm } : {}, redirect: "manual", signal: AbortSignal.timeout(30_000) }).catch(() => null);
    if (!res) return null;
    const headers = headersFor(name, res.headers.get("content-type"), res.headers.get("etag"), sandboxed);
    if (res.status === 304) return new Response(null, { status: 304, headers });
    if (res.ok) {
      const len = res.headers.get("content-length");
      return new Response(req.method === "HEAD" ? null : res.body, { headers: { ...headers, ...(len ? { "content-length": len } : {}) } });
    }
    await res.body?.cancel().catch(() => undefined);
  }
  return null;
}

export async function serveSiteFile(req: Request, slug: string, parts: string[]): Promise<Response> {
  const url = new URL(req.url);
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const own = previewOrigin();
  // With its own address set up, a template preview is only ever shown there.
  if (own && host !== own.hostname) return Response.redirect(`${own.origin}${url.pathname}${url.search}`, 308);
  if (!/^[a-z0-9-]{3,80}$/.test(slug) || !(await isSite(slug))) return missingPage();
  let names: string[];
  try {
    names = parts.map((p) => decodeURIComponent(p));
  } catch {
    return missingPage();
  }
  if (names.some((n) => !n || n === "." || n === ".." || /[\\/\0]/.test(n))) return missingPage();
  const rel = names.join("/");
  const manifest = await getManifest(slug);
  if (!manifest) return (await fromHosted(req, slug, rel, !own)) ?? missingPage();

  const tries = rel ? [rel, `${rel}.html`, `${rel}/index.html`] : ["index.html"];
  const name = tries.find((t) => manifest.files[t]);
  if (!name) return missingPage();
  const file = manifest.files[name];
  const etag = `"${file.h}"`;
  const headers = headersFor(name, file.t, etag, !own);
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  const body = await readBlob(file.h);
  if (!body) return missingPage();
  return new Response(body, { headers: { ...headers, "content-length": String(file.s) } });
}
