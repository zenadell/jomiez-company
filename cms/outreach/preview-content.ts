import type { PreviewContent } from "./write";

/*
 * Previews made before the redesign (version 1: words and a stock photo) are
 * read into the current shape, so every link already sent keeps working and
 * gets the new design.
 */

type V1 = {
  name: string;
  kind?: string;
  area?: string;
  phone?: string | null;
  email?: string | null;
  hours?: string;
  headline?: string;
  sub?: string;
  cta?: string;
  services?: { title: string; text: string }[];
  about?: string;
  highlights?: string[];
  palette?: PreviewContent["palette"];
  image?: { url: string; by: string; source: string; page: string } | null;
};

/** Which look fits which kind of business, when none was chosen. */
export function styleFor(kind?: string): PreviewContent["style"] {
  const k = (kind ?? "").toLowerCase();
  if (/gym|fitness|sport|car|auto|tyre|motor|event|bar|pub|night|club|builder|electric|plumb|carpent|construction/.test(k)) return "bold";
  if (/clinic|dent|doctor|pharm|hospital|health|school|college|kindergarten|lawyer|account|consult|insur|estate|architect|engineer|optic/.test(k)) return "clean";
  return "editorial";
}

export function readPreview(raw: unknown): PreviewContent | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<PreviewContent> & Omit<V1, "highlights"> & { highlights?: unknown };
  if (c.v === 2) return c as PreviewContent;
  if (!c.name || !c.headline) return null;
  const services = Array.isArray(c.services) ? c.services : [];
  return {
    v: 2,
    name: c.name,
    kind: c.kind,
    area: c.area,
    phone: c.phone ?? null,
    email: c.email ?? null,
    hours: c.hours,
    style: styleFor(c.kind),
    palette: c.palette ?? "ember",
    eyebrow: [c.kind, c.area].filter(Boolean).join(" · "),
    headline: c.headline,
    headlineAccent: "",
    sub: c.sub ?? "",
    cta: c.cta ?? "Get in touch",
    marquee: services.map((s) => s.title).slice(0, 6),
    statement: c.sub ?? "",
    services,
    about: c.about ?? "",
    highlights: (Array.isArray(c.highlights) ? (c.highlights as unknown[]) : []).slice(0, 3).map((h) => (typeof h === "string" ? { title: h, text: "" } : (h as { title: string; text: string }))),
    closing: "Come and see us",
    brand: { photos: [], products: [], colours: [] },
    stock: c.image ? [{ url: c.image.url, w: 1600, h: 1000, by: c.image.by, source: c.image.source, page: c.image.page }] : [],
  };
}
