import { createHash } from "node:crypto";
import { isHash, MAX_FILE, verifyUpload, writeBlob } from "@/cms/sites/storage";

/*
 * Where the Aethron runner uploads a preview's files when they're kept on this
 * server's own disk (no Supabase yet). Each upload link is made for one file,
 * signed and short-lived (cms/sites/storage.ts), and the file must match the
 * fingerprint it claims.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ hash: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { hash } = await params;
  const q = new URL(req.url).searchParams;
  if (!isHash(hash) || !verifyUpload(hash, Number(q.get("exp")), q.get("sig") ?? "")) return Response.json({ error: "That upload link isn't valid (or has expired)." }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_FILE) return Response.json({ error: "Too big." }, { status: 413 });
  const data = Buffer.from(await req.arrayBuffer());
  if (data.length > MAX_FILE) return Response.json({ error: "Too big." }, { status: 413 });
  if (createHash("sha256").update(data).digest("hex") !== hash) return Response.json({ error: "The file doesn't match its fingerprint." }, { status: 400 });
  await writeBlob(hash, data);
  return Response.json({ ok: true, bytes: data.length });
}
