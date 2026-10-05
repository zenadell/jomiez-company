import type { Metadata } from "next";
import type { Media } from "@/payload-types";
import { img } from "./media";

type Meta = { title?: string | null; description?: string | null; image?: number | Media | null } | null | undefined;

/*
 * A page's search and sharing details from its "SEO" tab in the admin. A title
 * written there is used as is; otherwise the page's own name goes through the
 * site's title pattern ("About" → "About | Jomiez").
 *
 * `path` is the page's address on the site. It becomes the canonical link, on
 * the site's own address (Site settings → URL), so search engines credit that
 * one, not the host's (jomiez-site.onrender.com) or any other copy.
 */
export function pageMetadata(
  path: string,
  meta: Meta,
  fallback: { title?: string; description?: string | null; image?: Media | number | null } = {},
): Metadata {
  const title = meta?.title ? { absolute: meta.title } : fallback.title;
  const description = meta?.description || fallback.description || undefined;
  const image = img(meta?.image) ?? img(fallback.image);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: image ? { images: [{ url: image.src, width: image.width ?? undefined, height: image.height ?? undefined }] } : undefined,
  };
}
