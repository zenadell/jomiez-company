import { drawMap, verifyMap } from "@/cms/outreach/map";

/*
 * The street map on previews when Cloudinary isn't set up: drawn from
 * OpenStreetMap's tiles the first time it's asked for, then kept (here for a
 * while, and by browsers for a year). Only points signed by the site are
 * drawn (cms/outreach/map.ts).
 */

export const dynamic = "force-dynamic";

const kept = ((globalThis as { __jomiezPreviewMaps?: Map<string, Buffer> }).__jomiezPreviewMaps ??= new Map());

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const c = q.get("c") ?? "";
  const m = /^(-?\d{1,2}\.\d{5}),(-?\d{1,3}\.\d{5})$/.exec(c);
  if (!m || !verifyMap(c, q.get("s") ?? "")) return new Response("Not found", { status: 404 });
  let body = kept.get(c);
  if (!body) {
    try {
      body = await drawMap(Number(m[1]), Number(m[2]));
    } catch {
      return new Response("Not available", { status: 502 });
    }
    kept.set(c, body);
    for (const k of [...kept.keys()].slice(0, Math.max(0, kept.size - 20))) kept.delete(k);
  }
  return new Response(new Uint8Array(body), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
}
