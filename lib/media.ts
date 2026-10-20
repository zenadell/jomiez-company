import type { Media } from "@/payload-types";

/*
 * Turning upload fields into something <Image> can draw. Safe to use in client
 * components (no server imports).
 */

export type Img = { src: string; alt: string; width: number | null; height: number | null };

/** Uploads served by the app itself come back as absolute links to its own
    origin; keep them relative so <Image> treats them as local files. */
export const localUrl = (url: string | null | undefined) =>
  url ? url.replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, "") : "";

/** How a picture is framed (Media → "How it's framed on the site"), or null for the usual: fill, centred, no zoom. */
export type Frame = { fit: "cover" | "contain"; x: number; y: number; zoom: number };

export function frameOf(value: Media | null | undefined): Frame | null {
  const f = value?.frame;
  if (!f) return null;
  const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const frame: Frame = { fit: f.fit === "contain" ? "contain" : "cover", x: num(f.x, 50, 0, 100), y: num(f.y, 50, 0, 100), zoom: num(f.zoom, 100, 50, 300) };
  return frame.fit === "cover" && frame.x === 50 && frame.y === 50 && frame.zoom === 100 ? null : frame;
}

/*
 * The framing travels with the image's address, as a "#frame=…" ending that
 * the site's <Image> reads (and removes before loading the file), so every
 * section honours it without each one being changed. A fragment never reaches
 * a server; addresses for sharing cards and search engines use plain().
 */
const FRAME = /#frame=(cover|contain),([\d.]+),([\d.]+),([\d.]+)$/;

/** An address without its framing. */
export const plain = (url: string) => url.replace(FRAME, "");

/** The framing an address carries, and the address without it. */
export function readFrame(url: string): { url: string; frame: Frame | null } {
  const m = FRAME.exec(url);
  return m ? { url: url.replace(FRAME, ""), frame: { fit: m[1] as Frame["fit"], x: Number(m[2]), y: Number(m[3]), zoom: Number(m[4]) } } : { url, frame: null };
}

/** An upload field as an image (null when empty). */
export function img(value: number | Media | null | undefined): Img | null {
  if (!value || typeof value === "number" || !value.url) return null;
  const f = frameOf(value);
  const frame = f ? `#frame=${f.fit},${f.x},${f.y},${f.zoom}` : "";
  return { src: localUrl(value.url) + frame, alt: value.alt ?? "", width: value.width ?? null, height: value.height ?? null };
}

/** The image's address, or a fallback. */
export const src = (value: number | Media | null | undefined, fallback = "") => img(value)?.src ?? fallback;

/** Array rows of { text } as plain strings. */
export const texts = (rows: { text?: string | null }[] | null | undefined) =>
  (rows ?? []).map((r) => r.text ?? "").filter(Boolean);

/** Fills {tokens} in admin-written text ("© {year} {legalName}"). */
export function fill(template: string | null | undefined, values: Record<string, string | number>) {
  return (template ?? "").replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
