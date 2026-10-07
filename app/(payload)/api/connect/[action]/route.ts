import { readFile } from "node:fs/promises";
import path from "node:path";
import config from "@payload-config";
import { getPayload } from "payload";
import { originOf } from "@/cms/preview";
import { readLog } from "@/cms/connect/auth";
import { newToken, SCOPES, type Scope } from "@/cms/connect/keys";

/*
 * Access keys, for admins signed in to the admin:
 *   POST new   make a key; the answer is the only time it's shown
 *   GET  log   the record of calls (all keys, or ?key=<id>)
 *   GET  runner   the Aethron runner script (anyone: it does nothing without a runner key)
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ action: string }> };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

async function admin(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  const ok = Boolean((user as { roles?: string[] } | null)?.roles?.includes("admin"));
  return { payload, user: ok ? user : null };
}

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  // A signed-in cookie must come from the admin itself, never another site.
  const origin = req.headers.get("origin");
  if (origin && origin !== originOf(req.headers)) return json({ error: "Wrong origin." }, 403);
  const { payload, user } = await admin(req);
  if (!user) return json({ error: "Only admins can make access keys." }, 403);
  if (action !== "new") return json({ error: "Unknown action." }, 404);

  const body = (await req.json().catch(() => ({}))) as { name?: unknown; scopes?: unknown; days?: unknown };
  const name = String(body.name ?? "").trim().slice(0, 80);
  if (!name) return json({ error: "Say who the key is for." }, 400);
  const valid = SCOPES.map((s) => s.value) as string[];
  const scopes = (Array.isArray(body.scopes) ? body.scopes : []).map(String).filter((s) => valid.includes(s)) as Scope[];
  if (!scopes.length) return json({ error: "Tick at least one thing it may do." }, 400);
  const days = Number(body.days);
  const expiresAt = Number.isFinite(days) && days > 0 ? new Date(Date.now() + Math.min(days, 3650) * 86_400_000).toISOString() : null;

  const { token, prefix, hash } = newToken();
  const doc = await payload.create({
    collection: "access-keys",
    data: { name, scopes, expiresAt, prefix, hash, owner: user.id, revoked: false } as never,
    overrideAccess: true,
    depth: 0,
  });
  return json({ id: doc.id, name, scopes, expiresAt, prefix, token, origin: originOf(req.headers) });
}

export async function GET(req: Request, { params }: Params) {
  const { action } = await params;
  // The Aethron runner script, for the Mac (no secrets in it: it needs a runner key to do anything).
  if (action === "runner") {
    const code = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "aethron-runner.mjs"), "utf8");
    return new Response(code, { headers: { "content-type": "text/javascript; charset=utf-8", "content-disposition": 'attachment; filename="aethron-runner.mjs"', "cache-control": "no-cache" } });
  }
  const { payload, user } = await admin(req);
  if (!user) return json({ error: "Admins only." }, 403);
  if (action !== "log") return json({ error: "Unknown action." }, 404);
  const key = Number(new URL(req.url).searchParams.get("key")) || undefined;
  return json({ calls: (await readLog(payload, key)).slice(0, 100) });
}
