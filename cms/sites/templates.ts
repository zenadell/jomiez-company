import type { CollectionConfig, Payload } from "payload";
import { signedIn } from "../access";
import { safeFetch } from "../agent/web";
import { CLIENTS_GROUP } from "../outreach/config";

/*
 * The templates Keeper makes previews from (with Aethron), and how it finds
 * new ones: free templates on Framer's marketplace by default, or the owner's
 * own paid templates, which are added here and offered first for that kind of
 * business.
 */

export const SiteTemplates: CollectionConfig = {
  slug: "site-templates",
  labels: { singular: "Template", plural: "Templates" },
  admin: {
    group: CLIENTS_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "kinds", "source", "prepared", "uses", "enabled"],
    description:
      "Website templates Keeper makes previews from (with Aethron). It finds free Framer templates by itself and adds them here; add your own paid ones (their live address) and say what kinds of business they suit, and Keeper uses them first.",
  },
  access: { read: signedIn, create: signedIn, update: signedIn, delete: signedIn },
  timestamps: true,
  fields: [
    { name: "name", type: "text", required: true },
    { name: "url", label: "Live address", type: "text", required: true, admin: { description: "Where the template can be seen, e.g. https://agarimo.framer.website" } },
    {
      type: "row",
      fields: [
        {
          name: "source",
          type: "select",
          defaultValue: "free",
          options: [
            { value: "free", label: "Free (marketplace)" },
            { value: "paid", label: "Mine (paid)" },
          ],
          admin: { width: "34%" },
        },
        {
          name: "platform",
          type: "select",
          defaultValue: "framer",
          options: [
            { value: "framer", label: "Framer" },
            { value: "webflow", label: "Webflow" },
            { value: "other", label: "Other" },
          ],
          admin: { width: "33%" },
        },
        { name: "enabled", label: "Keeper may use it", type: "checkbox", defaultValue: true, admin: { width: "33%" } },
      ],
    },
    { name: "kinds", label: "Suits", type: "text", hasMany: true, admin: { description: "Kinds of business, e.g. furniture, restaurant, salon, clinic, gym, hotel, school, real estate." } },
    { name: "style", label: "What it looks like", type: "textarea", admin: { rows: 3 } },
    { name: "page", label: "Marketplace page", type: "text" },
    {
      type: "row",
      fields: [
        { name: "licence", type: "text", admin: { width: "50%", description: "e.g. Framer Marketplace licence" } },
        { name: "licenceUrl", label: "Licence address", type: "text", admin: { width: "50%" } },
      ],
    },
    { name: "project", label: "Aethron project", type: "text", unique: true, index: true, admin: { position: "sidebar", readOnly: true } },
    { name: "prepared", label: "Ready in Aethron", type: "checkbox", defaultValue: false, admin: { position: "sidebar", readOnly: true } },
    { name: "pages", label: "Its pages", type: "json", admin: { position: "sidebar", readOnly: true } },
    { name: "uses", label: "Previews made", type: "number", defaultValue: 0, admin: { position: "sidebar", readOnly: true } },
  ],
};

/* ---------- Finding free templates on Framer ---------- */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const FRAMER = "https://www.framer.com/marketplace/templates";

/** Framer's marketplace categories for a kind of business (checked against the marketplace). */
const CATEGORIES: [RegExp, string[]][] = [
  [/dent/, ["dental", "medical"]],
  [/restaurant|caf[eé]|bar\b|pub|food|bakery|kitchen|cater|pastry|confection|ice cream|grill|eatery/, ["restaurant", "food"]],
  [/salon|barber|spa\b|beauty|cosmetic|nail|massage|tattoo|hair|skin/, ["beauty"]],
  [/clinic|hospital|doctor|pharm|health|medical|optic|physio|lab/, ["medical", "health"]],
  [/school|college|kindergarten|training|education|tutor|academy|lesson/, ["education", "school"]],
  [/hotel|guest|motel|hostel|short-?let|apartment|lodge|resort/, ["hotel", "travel"]],
  [/real estate|estate|property|realt|letting/, ["real-estate"]],
  [/gym|fitness|sport|yoga|dance|pilates/, ["fitness"]],
  [/furniture|interior|decor|home|carpent|kitchen design/, ["furniture", "architecture"]],
  [/fashion|cloth|boutique|tailor|shoe|jewel|wear/, ["fashion", "ecommerce"]],
  [/event|venue|party/, ["events"]],
  [/photo/, ["photography"]],
  [/wedding|bridal/, ["wedding", "events"]],
  [/build|construct|plumb|electric|roof|paint|trade|engineer|architect/, ["construction", "architecture"]],
  [/law|legal|solicitor|attorney/, ["legal"]],
  [/travel|tour|safari/, ["travel"]],
  [/consult|account|insur|agency|finance|professional|office|marketing/, ["consulting", "business", "agency"]],
  [/shop|store|supermarket|market|mall|retail/, ["ecommerce"]],
];

export function categoriesFor(kind: string) {
  const k = kind.toLowerCase();
  return CATEGORIES.find(([re]) => re.test(k))?.[1] ?? ["business"];
}

export type Candidate = { name: string; page: string; url: string; category: string; about: string; licence: string; licenceUrl: string | null };

async function get(url: string) {
  const res = await safeFetch(url, { maxBytes: 2_500_000, timeoutMs: 20_000, userAgent: UA });
  if (res.status === 429) throw new Error("Framer's marketplace is busy (too many requests); try again in a few minutes.");
  if (res.status >= 400) throw new Error(`Framer answered ${res.status}.`);
  return res.body.toString("utf8");
}

/** A category's free templates, as Framer lists them (kept a day). */
async function listing(payload: Payload, category: string): Promise<{ slug: string; name: string }[]> {
  const key = `sites:framer:list:${category}`;
  const hit = await payload.kv.get<{ at: number; items: { slug: string; name: string }[] }>(key);
  if (hit && Date.now() - hit.at < 24 * 3600_000) return hit.items;
  const html = await get(`${FRAMER}/category/${category}/?pricing=free`);
  const items = [...html.matchAll(/"url":"https:\/\/www\.framer\.com\/marketplace\/templates\/([a-z0-9-]+)\/","name":"([^"]{1,80})"/g)].map((m) => ({ slug: m[1], name: m[2] }));
  const unique = items.filter((it, i) => items.findIndex((x) => x.slug === it.slug) === i);
  await payload.kv.set(key, { at: Date.now(), items: unique });
  return unique;
}

/** One template's page: is it free, where's its live preview, what is it (kept a week). */
async function details(payload: Payload, slug: string): Promise<{ free: boolean; url: string | null; about: string; licenceUrl: string | null } | null> {
  const key = `sites:framer:tpl:${slug}`;
  const hit = await payload.kv.get<{ at: number; d: { free: boolean; url: string | null; about: string; licenceUrl: string | null } }>(key);
  if (hit && Date.now() - hit.at < 7 * 24 * 3600_000) return hit.d;
  const html = await get(`${FRAMER}/${slug}/`);
  const price = /"price":"([\d.]+)"/.exec(html)?.[1];
  // The template's own live preview is the first *.framer.website link on its page (others are the creator's other work).
  const url = /href="(https:\/\/[a-z0-9-]+\.framer\.(?:website|ai))\/?"/.exec(html)?.[1] ?? null;
  const about = (/<meta name="description" content="([^"]{0,400})"/.exec(html)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
  const licenceUrl = /href="(https:\/\/www\.framer\.com\/[^"]*licen[cs]e[^"]*)"/i.exec(html)?.[1] ?? null;
  const d = { free: price === "0", url, about, licenceUrl };
  await payload.kv.set(key, { at: Date.now(), d });
  return d;
}

/**
 * Free Framer templates for a kind of business: a few at a time, newest
 * listings first, leaving out ones already in the library.
 */
export async function findFreeTemplates(payload: Payload, kind: string, opts: { limit?: number; skip?: string[] } = {}): Promise<{ categories: string[]; candidates: Candidate[]; notes: string[] }> {
  const categories = categoriesFor(kind);
  const limit = Math.min(8, opts.limit ?? 5);
  const skip = new Set((opts.skip ?? []).map((s) => s.toLowerCase()));
  const candidates: Candidate[] = [];
  const notes: string[] = [];
  for (const category of categories) {
    let items: { slug: string; name: string }[] = [];
    try {
      items = await listing(payload, category);
    } catch (err) {
      notes.push(`${category}: ${(err as Error).message}`);
      continue;
    }
    for (const it of items) {
      if (candidates.length >= limit) break;
      if (skip.has(it.slug) || candidates.some((c) => c.page.endsWith(`/${it.slug}/`))) continue;
      try {
        const d = await details(payload, it.slug);
        if (!d?.free || !d.url || skip.has(d.url.toLowerCase())) continue;
        candidates.push({ name: it.name, page: `${FRAMER}/${it.slug}/`, url: d.url, category, about: d.about, licence: "Framer Marketplace licence (free template)", licenceUrl: d.licenceUrl });
      } catch (err) {
        notes.push(`${it.name}: ${(err as Error).message}`);
        if (/busy/.test((err as Error).message)) break;
      }
    }
    if (candidates.length >= limit) break;
  }
  return { categories, candidates, notes };
}

/** The library's templates that suit a kind of business: the owner's own first, then the most used. */
export async function libraryFor(payload: Payload, kind: string) {
  const { docs } = await payload.find({ collection: "site-templates", where: { enabled: { equals: true } }, limit: 200, depth: 0, overrideAccess: true });
  const k = kind.toLowerCase();
  const cats = categoriesFor(kind);
  const score = (t: Record<string, unknown>) => {
    const kinds = ((t.kinds as string[]) ?? []).map((x) => x.toLowerCase());
    const fits = kinds.some((x) => k.includes(x) || x.includes(k) || cats.includes(x.replace(/\s+/g, "-")) || categoriesFor(x).some((c) => cats.includes(c)));
    return (fits ? 100 : 0) + (t.source === "paid" ? 50 : 0) + (t.prepared ? 10 : 0) + Math.min(9, Number(t.uses ?? 0));
  };
  return (docs as unknown as Record<string, unknown>[])
    .map((t) => ({ t, s: score(t) }))
    .filter((x) => x.s >= 100)
    .sort((a, b) => b.s - a.s)
    .map(({ t }) => ({
      id: t.id,
      name: t.name,
      url: t.url,
      source: t.source,
      kinds: t.kinds,
      style: t.style,
      prepared: Boolean(t.prepared),
      project: t.project ?? null,
      pages: t.pages ?? null,
      uses: t.uses ?? 0,
    }));
}
