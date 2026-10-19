import { directionsFor, settle } from "./design/choose";
import { byId, type DirectionId } from "./design/library";
import type { PreviewContent } from "./write";

/*
 * Every preview ever made is read into the current shape, so every link
 * already sent keeps working and gets the current design: version 1 (words
 * and a stock photo) and version 2 (one template in three looks) become a
 * direction from the design library. And a page whose pictures didn't all
 * arrive moves to a direction that works with what it has.
 */

type Old = {
  v?: number;
  name: string;
  kind?: string;
  area?: string;
  address?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  socials?: string | null;
  hours?: string;
  style?: "editorial" | "bold" | "clean";
  palette?: string;
  headline?: string;
  sub?: string;
  cta?: string;
  statement?: string;
  services?: { title: string; text: string }[];
  about?: string;
  highlights?: unknown[];
  closing?: string;
  brand?: PreviewContent["brand"];
  stock?: PreviewContent["stock"];
  image?: { url: string; by: string; source: string; page: string } | null;
};

/** The version 2 look that best matches each direction, and its old colour names. */
const FROM_STYLE: Record<NonNullable<Old["style"]>, DirectionId> = { editorial: "monument", bold: "poster", clean: "split" };
const FROM_COLOUR: Record<string, string[]> = {
  ember: ["post-red-mustard", "poster-chapters", "oxblood-grey"],
  forest: ["moss-sand", "olive-bone", "bottle-gold"],
  ocean: ["teal-paper", "cool-slate", "cobalt-sand", "blue-red-black"],
  berry: ["blush-aubergine", "rose-grey-green", "oxblood-grey"],
  sand: ["three-stones", "cobalt-sand", "walnut-tan"],
  slate: ["cool-slate", "sheet-biro", "lunar-bronze", "charcoal-primaries"],
};

function fromOld(c: Old): PreviewContent | null {
  if (!c.name || !c.headline) return null;
  const services = Array.isArray(c.services) ? c.services : [];
  const brand = c.brand ?? { photos: [], products: [], colours: [] };
  const stock = c.stock ?? (c.image ? [{ url: c.image.url, w: 1600, h: 1000, by: c.image.by, source: c.image.source, page: c.image.page }] : []);
  const offered = directionsFor(c.kind, { photos: brand.photos.length + stock.length, products: brand.products.length });
  const wanted = c.style ? FROM_STYLE[c.style] : offered[0];
  const direction = offered.includes(wanted) ? wanted : offered[0];
  const palette = (FROM_COLOUR[c.palette ?? ""] ?? []).find((p) => byId.direction(direction)!.palettes.includes(p));
  return {
    v: 3,
    name: c.name,
    kind: c.kind,
    area: c.area,
    address: c.address,
    country: c.country,
    phone: c.phone ?? null,
    email: c.email ?? null,
    socials: c.socials ?? null,
    hours: c.hours,
    design: settle(c.name, [direction], { palette }),
    headline: c.headline,
    sub: c.sub ?? "",
    cta: c.cta ?? "Get in touch",
    statement: c.statement || c.sub || "",
    services,
    about: c.about ?? "",
    highlights: (Array.isArray(c.highlights) ? c.highlights : []).slice(0, 3).map((h) => (typeof h === "string" ? { title: h, text: "" } : (h as { title: string; text: string }))),
    closing: c.closing ?? "Come and see us",
    brand,
    stock,
  };
}

export function readPreview(raw: unknown): PreviewContent | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<PreviewContent> & Old;
  const content = c.v === 3 && c.design ? (c as PreviewContent) : fromOld(c);
  if (!content) return null;
  // Pictures that didn't arrive (a stock search that came back short): a direction that works without them.
  const have = { photos: content.brand.photos.length + content.stock.length, products: content.brand.products.length };
  const fits = directionsFor(content.kind, have);
  const needs = byId.direction(content.design.direction)?.needs ?? {};
  if ((needs.photos ?? 0) > have.photos || (needs.products ?? 0) > have.products) {
    const next = fits.find((d) => d !== content.design.direction) ?? "split";
    return { ...content, design: { ...settle(content.name, [next], { palette: byId.direction(next)!.palettes.includes(content.design.palette) ? content.design.palette : undefined }), why: content.design.why } };
  }
  return content;
}
