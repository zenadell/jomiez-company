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

/** An upload field as an image (null when empty). */
export function img(value: number | Media | null | undefined): Img | null {
  if (!value || typeof value === "number" || !value.url) return null;
  return { src: localUrl(value.url), alt: value.alt ?? "", width: value.width ?? null, height: value.height ?? null };
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
