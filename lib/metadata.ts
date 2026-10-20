import type { Metadata } from "next";
import type { Media } from "@/payload-types";
import { getGlobal } from "./cms";
import { img, plain } from "./media";

type Meta = { title?: string | null; description?: string | null; image?: number | Media | null } | null | undefined;

/*
 * A page's search and sharing details from its "SEO" tab in the admin. A title
 * written there is used as is; otherwise the page's own name goes through the
 * site's title pattern ("About" → "About | Jomiez").
 *
 * `path` is the page's address on the site. It becomes the canonical link, on
 * the site's own address (Site settings → URL), so search engines credit that
 * one, not the host's (jomiez-site.onrender.com) or any other copy.
 *
 * The sharing card (WhatsApp, LinkedIn, X…) is always complete: a page that sets
 * its own sharing details replaces the site's whole card, so title, address and
 * site name are written here too. With no image anywhere (the page's, then Site
 * settings'), a branded card with the page's title is drawn (app/og/route.tsx).
 */
export async function pageMetadata(
  path: string,
  meta: Meta,
  fallback: { title?: string; description?: string | null; image?: Media | number | null } = {},
): Promise<Metadata> {
  const site = await getGlobal("site");
  const title = meta?.title ? { absolute: meta.title } : fallback.title;
  const shareTitle = meta?.title || (fallback.title ? (site.titleTemplate || `%s | ${site.name}`).replace("%s", fallback.title) : site.title);
  const description = meta?.description || fallback.description || site.description || undefined;
  const picked = img(meta?.image) ?? img(fallback.image) ?? img(site.ogImage);
  const card = picked
    ? { url: plain(picked.src), width: picked.width ?? undefined, height: picked.height ?? undefined, alt: picked.alt || shareTitle }
    : { url: `/og?title=${encodeURIComponent((meta?.title || fallback.title || site.title).slice(0, 120))}`, width: 1200, height: 630, alt: shareTitle };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: site.name, locale: "en", url: path, title: shareTitle, description, images: [card] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [card.url] },
  };
}
