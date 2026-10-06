import { shrink, verifyImage } from "@/cms/outreach/images";

/*
 * Pictures on previews when Cloudinary isn't set up: fetched from where they
 * live, shrunk and re-encoded, and kept by browsers for a year. Only
 * addresses signed by the site are served (cms/outreach/images.ts); when
 * one can't be fetched, the browser is sent to the picture's own address.
 */

export const dynamic = "force-dynamic";

type Kept = { at: number; body: Buffer };
const kept = ((globalThis as { __jomiezPreviewImages?: Map<string, Kept> }).__jomiezPreviewImages ??= new Map());

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const url = q.get("u") ?? "";
  const w = Math.min(2000, Math.max(64, Number(q.get("w")) || 1600));
  if (!url || !verifyImage(url, w, q.get("s") ?? "")) return new Response("Not found", { status: 404 });
  const key = `${w}|${url}`;
  let hit = kept.get(key);
  if (!hit) {
    try {
      hit = { at: Date.now(), body: await shrink(url, w) };
    } catch {
      // Their server turned us away (busy, or blocking servers): let the visitor's browser fetch the picture itself.
      return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
    }
    kept.set(key, hit);
    // The newest 40, for the few minutes a business spends looking at their preview.
    for (const k of [...kept.keys()].slice(0, Math.max(0, kept.size - 40))) kept.delete(k);
  }
  return new Response(new Uint8Array(hit.body), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
}
