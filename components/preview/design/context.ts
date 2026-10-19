import type { CSSProperties } from "react";
import { hoursLines, parseHours } from "@/cms/outreach/hours";
import { looksMobile } from "@/cms/outreach/kinds";
import { mapRoute } from "@/cms/outreach/map";
import type { Picture } from "@/cms/outreach/images";
import { byId, fontLinks, type Palette, type TypeSystem } from "@/cms/outreach/design/library";
import type { PreviewContent } from "@/cms/outreach/write";

/*
 * Everything a preview layout needs, worked out once (app/(preview)/preview/
 * [slug]/page.tsx): their pictures in order, every link using their own
 * number, their hours, map and address, and the theme (palette, their brand
 * colour, type system) as CSS custom properties.
 */

const TZ: Record<string, string> = { NG: "Africa/Lagos", GH: "Africa/Accra", KE: "Africa/Nairobi", ZA: "Africa/Johannesburg", GB: "Europe/London", IE: "Europe/Dublin", US: "America/New_York", CA: "America/Toronto" };

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Black or white, whichever reads better on a colour. */
export const inkOn = (hex: string) => (contrast(hex, "#111111") >= contrast(hex, "#ffffff") ? "#111111" : "#ffffff");
const isHex = (s: string | undefined): s is string => !!s && /^#[0-9a-f]{6}$/i.test(s);

/** The palette, with their own brand colour as the accent when it can carry it. */
function theme(palette: Palette, brand: string[]): Palette {
  const own = brand.find(isHex);
  if (!own) return palette;
  // Their colour must stand out from the page's ground to be the accent; otherwise it only colours a field.
  const accent = contrast(own, palette.bg) >= 1.8 ? own : palette.accent;
  return { ...palette, accent, accentInk: inkOn(accent), fields: [own, ...palette.fields.filter((f) => f.toLowerCase() !== own.toLowerCase())] };
}

function cssVars(p: Palette, t: TypeSystem): CSSProperties {
  const fam = (f: { family: string }, fallback: string) => `"${f.family}", ${fallback}`;
  const serif = /serif|garamond|literata|newsreader|gambarino|erode|young|bodoni|zodiak|sentient|boska/i;
  return {
    "--bg": p.bg,
    "--surface": p.surface,
    "--ink": p.ink,
    "--muted": p.muted,
    "--accent": p.accent,
    "--accent-ink": p.accentInk,
    "--f1": p.fields[0] ?? p.accent,
    "--f2": p.fields[1] ?? p.surface,
    "--f3": p.fields[2] ?? p.ink,
    "--f4": p.fields[3] ?? p.accent,
    "--f1-ink": inkOn(p.fields[0] ?? p.accent),
    "--f2-ink": inkOn(p.fields[1] ?? p.surface),
    "--f3-ink": inkOn(p.fields[2] ?? p.ink),
    "--f4-ink": inkOn(p.fields[3] ?? p.accent),
    "--display": fam(t.display, serif.test(t.display.family) ? "Georgia, serif" : "system-ui, sans-serif"),
    "--text": fam(t.text, serif.test(t.text.family) ? "Georgia, serif" : "system-ui, sans-serif"),
    "--d-weight": String(t.display.weights[0]),
    "--d-track": t.display.tracking,
    "--d-lead": String(t.display.leading),
    "--d-case": t.display.transform ?? "none",
    "--t-weight": String(t.text.weights[0]),
    "--t-strong": String(t.text.weights[1] ?? 600),
  } as CSSProperties;
}

function socialLinks(raw?: string | null) {
  return (raw ?? "")
    .split(/\s+/)
    .filter((s) => /^https?:\/\//.test(s))
    .map((href) => ({ href, label: /instagram/.test(href) ? "Instagram" : /facebook|fb\./.test(href) ? "Facebook" : /tiktok/.test(href) ? "TikTok" : /x\.com|twitter/.test(href) ? "X" : "Their page" }));
}

/** The address, followed by only the parts of the area it doesn't already say. */
function whereOf(address?: string, area?: string) {
  if (!address) return area ?? "";
  const has = address.toLowerCase();
  const missing = (area ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !has.includes(p.toLowerCase()));
  return [address, ...missing].join(", ");
}

export type Ctx = ReturnType<typeof buildCtx>;

export function buildCtx(c: PreviewContent, opts: { slug: string; ownerWa: string; stop: string }) {
  const palette = theme(byId.palette(c.design.palette) ?? byId.palette("sheet-biro")!, c.brand.colours);
  const type = byId.type(c.design.type) ?? byId.type("general-sans")!;
  // Their own photos first; stock only fills in when they have fewer than two. Each used once.
  const photos: (Picture & { by?: string; page?: string; source?: string })[] = c.brand.photos.length >= 2 ? c.brand.photos : [...c.brand.photos, ...c.stock];
  const products = c.brand.products.slice(0, 12);
  const phone = c.phone ?? null;
  const wa = phone && looksMobile(phone) ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const mail = c.email ? `mailto:${c.email}` : null;
  const primary = wa ?? tel ?? mail ?? "#visit";
  // The button's words must match where it goes (a model may write "WhatsApp" for a landline).
  const cta = !wa && /whatsapp/i.test(c.cta) ? (tel ? "Call us" : mail ? "Email us" : "Find us") : c.cta;
  const coords = c.brand.coords;
  const where = whereOf(c.address, c.area);
  const week = parseHours(c.hours);
  const initials = c.name
    .split(/\s+/)
    .filter((w) => /\w/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return {
    c,
    slug: opts.slug,
    palette,
    type,
    vars: cssVars(palette, type),
    fonts: fontLinks(type),
    photos,
    products,
    logo: c.brand.logo ?? null,
    initials,
    phone,
    wa,
    tel,
    mail,
    primary,
    cta,
    /** A WhatsApp (or call) link asking about one thing on the page. */
    ask: (what: string) => (wa ? `${wa}?text=${encodeURIComponent(`Hello ${c.name}, I saw ${what} on your website. Is it available?`)}` : tel),
    where,
    map: c.brand.map?.url ?? (coords ? mapRoute(coords.lat, coords.lon) : null),
    directions: coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.name, where].filter(Boolean).join(", "))}`,
    week,
    hours: week ? hoursLines(week) : [],
    tz: TZ[c.country ?? ""],
    socials: socialLinks(c.socials),
    credits: c.stock.filter((p) => photos.includes(p)),
    ownerWa: opts.ownerWa,
    stop: opts.stop,
  };
}
