import { aethron } from "./aethron";
import { HIDDEN_LINK, HIDE_HREF, linesOf, networkOf } from "./fill";

/*
 * A template's links, made right for a lead's preview, with no model:
 * - its social icons are the designer's accounts: they become the business's
 *   account on the same network, or are hidden;
 * - a button the designer pointed at their own marketplace page ("Book Now",
 *   "Contact": Aethron hides any link to a template shop) goes to the
 *   preview's contact page, or the business's phone. Only when every button
 *   using that address reads like one, on the template's own live site: a
 *   "Buy template" pill sharing it keeps it hidden;
 * - any other link to someone else's site (the designer's studio, a demo
 *   booking service) goes to the preview's home page instead.
 * Runs on every publish, so old previews are put right too.
 */

const CTA = /\b(book|booking|reserv\w*|table|appointment|contact|get in touch|call|visit|enquir\w*|inquir\w*|find us|order)\b/i;
const SALE = /\b(buy|template|purchase|remix|get it|for free|made (in|with|by)|framer|webflow|creator|pricing|download)\b/i;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ");

/** Every link's address on a page, with the words on each button that uses it. */
export function anchorTexts(html: string, into = new Map<string, string[]>()): Map<string, string[]> {
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = /\bhref\s*=\s*"([^"]*)"/i.exec(m[1])?.[1] ?? /\bhref\s*=\s*'([^']*)'/i.exec(m[1])?.[1];
    if (!href) continue;
    const label = /\baria-label\s*=\s*"([^"]*)"/i.exec(m[1])?.[1] ?? "";
    const text = decode(`${label} ${m[2].replace(/<[^>]+>/g, " ")}`).replace(/\s+/g, " ").trim();
    const key = decode(href);
    into.set(key, [...(into.get(key) ?? []), text]);
  }
  return into;
}

export type LinkContext = {
  /** href → the words on each button using it, from the template's live pages. */
  texts: Map<string, string[]>;
  /** The business's own addresses (phone, WhatsApp, email, socials, website). */
  business: string[];
  /** The preview's contact page, as the template names it ("contact", "reservation"…). */
  contactPage?: string | null;
  /** The template's own hosts: links to them are its pages, which Aethron localizes. */
  templateHosts: string[];
};

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Where a template link should go on the lead's preview, or null to leave it as it is. */
export function linkTarget(old: string, current: string, ctx: LinkContext): { to: string; why: string; cta?: boolean } | null {
  if (ctx.business.includes(old) || ctx.business.includes(current)) return null;
  const net = networkOf(old);
  if (net) {
    const to = ctx.business.find((u) => networkOf(u) === net) ?? HIDE_HREF;
    return to === current ? null : { to, why: `the template designer's ${net}` };
  }
  const reach = ctx.contactPage ? `./${ctx.contactPage}.html` : ctx.business.find((u) => /^(tel:|https:\/\/wa\.me\/)/.test(u));
  if (HIDDEN_LINK.test(old)) {
    const texts = (ctx.texts.get(old) ?? []).filter(Boolean);
    const isButton = texts.length > 0 && texts.every((t) => CTA.test(t) && !SALE.test(t));
    if (!isButton || !reach) return null;
    // (reported even when already done: the publish step must know not to hide it again)
    return { to: reach, why: `a “${texts[0].slice(0, 40)}” button that pointed at the template's sales page`, cta: true };
  }
  if (!/^https?:\/\//i.test(old) || current !== old) return null;
  const host = hostOf(old);
  if (!host || ctx.templateHosts.includes(host) || /(^|\.)google\.[a-z.]+$|goo\.gl$/.test(host)) return null;
  return { to: "./index.html", why: `a link to someone else's site (${host})` };
}

/** Puts a preview's links right (see above); returns the sales-page buttons it pointed somewhere real. */
export async function fixTemplateLinks(project: string, opts: { templateUrl?: string | null; pages: string[]; business: string[]; contactPage?: string | null }) {
  const texts = new Map<string, string[]>();
  const hosts: string[] = [];
  if (opts.templateUrl) {
    const base = opts.templateUrl.replace(/\/$/, "");
    hosts.push(hostOf(base));
    for (const page of opts.pages) {
      const html = await fetch(page === "home" ? `${base}/` : `${base}/${page}`, { signal: AbortSignal.timeout(20_000) })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => "");
      anchorTexts(html, texts);
    }
  }
  const ctx: LinkContext = { texts, business: opts.business, contactPage: opts.contactPage, templateHosts: hosts };
  const entries: { old: string; new: string; section: "links" }[] = [];
  const cta: string[] = [];
  const changed: string[] = [];
  for (let offset = 0; offset < 400; offset += 100) {
    const lines = linesOf(await aethron("get_content", { project, section: "links", limit: 100, offset }));
    for (const l of lines) {
      const t = linkTarget(l.old, l.new || l.old, ctx);
      if (!t) continue;
      if (t.cta) cta.push(l.old);
      if (t.to === (l.new || l.old)) continue;
      entries.push({ old: l.old, new: t.to, section: "links" });
      changed.push(`${t.why} → ${t.to === HIDE_HREF ? "hidden" : t.to}`);
    }
    if (lines.length < 100) break;
  }
  if (entries.length) await aethron("set_content_bulk", { project, entries, build: false });
  return { cta, changed };
}
