import { randomBytes } from "node:crypto";
import { generateText, Output, type LanguageModel } from "ai";
import type { Payload } from "payload";
import { z } from "zod";
import { findPhotos } from "../agent/eyes";
import { gatherBrand, type Brand } from "./brand";
import { fetchImage, keepImage, type Picture } from "./images";
import { buildModel } from "../agent/providers";
import { loadConfig } from "../agent/run";
import type { CheckResult } from "./check";
import { COUNTRIES } from "./kinds";

/*
 * Writing to a business: a WhatsApp message, a text and an email, built only
 * from what the website check actually found, and (for the most promising) a
 * free sample homepage. Everything is saved on the lead for the owner to read,
 * change and send; nothing here sends anything.
 */

export type Settings = {
  offer: string;
  senderName: string;
  senderPhone: string;
  address: string;
  previews: boolean;
  previewScore: number;
};

export async function writerModel(payload: Payload): Promise<LanguageModel> {
  const cfg = await loadConfig(payload);
  if (!cfg.model) throw new Error("Choose a model in Agent settings first.");
  return buildModel({ provider: cfg.provider, model: cfg.fastModel || cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
}

/** A JSON answer in a given shape, from any provider: structured output where it works, else parsed from the text. */
async function ask<T>(model: LanguageModel, instructions: string, prompt: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const { output } = await generateText({ model, instructions, prompt, output: Output.object({ schema }) });
    return schema.parse(output);
  } catch {
    const { text } = await generateText({ model, instructions: `${instructions}\n\nReply with only a JSON object, no other text.`, prompt });
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return schema.parse(JSON.parse(json));
  }
}

type Lead = Record<string, unknown> & { id: number | string; name: string };

/** Who the messages are from: the name in Clients → Finding clients, or the team (never a made-up person). */
const sender = (s: Settings) => {
  const first = s.senderName.trim().split(/\s+/)[0];
  return first ? { intro: `${first} from Jomiez`, signOff: `${first}\nJomiez` } : { intro: "the Jomiez team", signOff: "The Jomiez team" };
};

function context(lead: Lead, s: Settings, previewUrl: string | null) {
  const check = (lead.check ?? {}) as CheckResult;
  const top = [...(check.findings ?? [])].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const country = COUNTRIES[(lead.country as keyof typeof COUNTRIES) ?? "NG"]?.label ?? String(lead.country ?? "");
  return [
    `BUSINESS: ${lead.name}${lead.kind ? `, a ${lead.kind}` : ""}${lead.area ? ` in ${lead.area}` : ""}, ${country}.`,
    `WEBSITE: ${lead.website ? String(lead.website) : "none"}${lead.socials ? ` · social pages: ${String(lead.socials)}` : ""}`,
    `FINDINGS (measured, the only problems you may mention):\n${top.length ? top.map((f) => `- ${f.text}`).join("\n") : "- None worth mentioning: their site is decent. Offer a fresher design, gently, or say nothing about problems."}`,
    lead.review ? `HOW THEIR SITE LOOKS ON A PHONE (seen in a screenshot): ${String(lead.review)}` : "",
    `PREVIEW: ${previewUrl ? `${previewUrl} (a free sample homepage made for them; no obligation)` : "none"}`,
    `OFFER: ${s.offer}`,
    `FROM: ${s.senderName.trim() ? `${s.senderName.trim()}, at Jomiez (jomiez.com)` : "the Jomiez team, a small studio (jomiez.com). No person's name is set: write as \"we\", never as a named person"}${s.senderPhone ? `, ${s.senderPhone}` : ""}. How we found them: ${lead.source === "openstreetmap" ? `looking at businesses in ${lead.area ?? "their area"} on the map` : "researching local businesses"}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const RULES = `You write short, honest first messages from Jomiez, a small web design studio, to owners of local businesses.
Rules:
- Mention only the problems under FINDINGS (they were measured) and what's under HOW THEIR SITE LOOKS. Never invent problems, numbers, results, customers, reviews or awards. Never pretend to be a customer.
- Say who you are in the first line exactly as FROM gives it, and how you came across them. Never make up a person's name, and never leave placeholders like [Your Name]. Be warm and human, like a person writing one message, not a template.
- No hype, pressure or false urgency; no ALL CAPS; no emojis.
- Promise only what's in OFFER. Mention a price only if OFFER gives one.
- One small ask: a reply. If there's a PREVIEW, include its link once and say it's a free sample made for them, with no obligation.
- Nigeria, Ghana, Kenya, South Africa: polite, natural business English ("Good day"). UK, US, Ireland, Canada: plain, friendly local English.`;

const MessagesSchema = z.object({
  whatsapp: z.string().min(20),
  sms: z.string().min(20),
  emailSubject: z.string().min(4),
  emailBody: z.string().min(40),
});

export type Messages = z.infer<typeof MessagesSchema>;

const FORMATS = (s: Settings) => `Write four versions:
- whatsapp: 45–85 words in 2–4 short paragraphs. End with: If you'd rather not get messages like this, just reply "stop" and I won't message again.
- sms: at most 300 characters including any link. End with: Reply STOP to opt out.
- emailSubject: under 55 characters, specific and plain (e.g. "A quick idea for ${"{Business}"}'s website"), not clickbait.
- emailBody: 70–130 words, starting "Hi" or "Good day" with the business name. Sign off as: ${sender(s).signOff.replace("\n", ", ")}${s.senderPhone ? `, ${s.senderPhone}` : ""}. Don't add an address or unsubscribe line (they're added when it's sent).`;

/** The first message (or the one follow-up), saved on the lead, which becomes "Message ready". */
export async function writeLead(payload: Payload, id: number | string, opts: { model: LanguageModel; settings: Settings; previewUrl?: string | null; followUp?: boolean; extra?: string }) {
  const lead = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead;
  if (lead.status === "stopped") throw new Error(`${lead.name} asked not to be contacted.`);
  const previewUrl = opts.previewUrl ?? (lead.preview && (lead.preview as { slug?: string }).slug ? previewLink(String((lead.preview as { slug: string }).slug)) : null);
  const before = (lead.messages ?? {}) as Partial<Messages>;
  const prompt = [
    context(lead, opts.settings, previewUrl),
    opts.followUp
      ? `This is ONE short follow-up to the message below, sent a few days ago with no reply. Write all four versions as follow-ups: 25–55 words (the email up to 80), friendly, no guilt, one line on the benefit, the preview link again if there is one, and the same opt-out line.\nEARLIER WHATSAPP: ${before.whatsapp ?? "(none)"}\nEARLIER EMAIL: ${before.emailBody ?? "(none)"}`
      : "",
    opts.extra ? `THE OWNER ASKS: ${opts.extra}` : "",
    FORMATS(opts.settings),
  ]
    .filter(Boolean)
    .join("\n\n");
  const out = await ask(opts.model, RULES, prompt, MessagesSchema);
  // A placeholder the model left is filled in with who's really writing.
  for (const k of Object.keys(out) as (keyof Messages)[]) out[k] = out[k].replace(/\[\s*(your|my|sender'?s?)\s+name\s*\]/gi, opts.settings.senderName.trim() || "the Jomiez team");
  // The opt-out lines are not optional, whatever the model did.
  if (!/\bstop\b/i.test(out.whatsapp)) out.whatsapp = `${out.whatsapp.trim()}\n\nIf you'd rather not get messages like this, just reply "stop" and I won't message again.`;
  if (!/\bstop\b/i.test(out.sms)) out.sms = `${out.sms.trim()} Reply STOP to opt out.`;
  await payload.update({
    collection: "leads",
    id,
    data: {
      messages: { ...out, followUp: Boolean(opts.followUp), writtenAt: new Date().toISOString() },
      status: "ready",
      log: [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what: opts.followUp ? "Follow-up written" : "Message written" }],
    } as never,
    overrideAccess: true,
  });
  return { id, name: lead.name, ...out, previewUrl };
}

/* ---------- The free homepage preview ---------- */

export const PALETTES = ["ember", "forest", "ocean", "berry", "sand", "slate"] as const;
export const STYLES = ["editorial", "bold", "clean"] as const;

/*
 * What Keeper writes for a preview. Lengths are asked for in the descriptions
 * and trimmed afterwards (a model that runs a little long shouldn't lose the
 * whole preview).
 */
const PreviewSchema = z.object({
  style: z.enum(STYLES).describe("editorial: warm and elegant (furniture, interiors, hotels, beauty, restaurants, fashion); bold: dark and punchy (gyms, cars, events, nightlife, trades); clean: light and calm (clinics, schools, professional services, pharmacies)"),
  palette: z.enum(PALETTES).describe("Only used when they have no brand colours of their own"),
  eyebrow: z.string().min(2).describe("2–5 words above the headline, e.g. “Furniture & décor · Ikeja”"),
  headline: z.string().min(3).describe("A striking headline, at most 7 words"),
  headlineAccent: z.string().describe("One or two words from the headline to set in italics/colour, or empty"),
  sub: z.string().min(10).describe("One sentence, at most 24 words"),
  cta: z.string().min(3).describe("The main button, 2–4 words: how a customer acts (Order on WhatsApp, Book a visit, Call us)"),
  marquee: z.array(z.string().min(2)).min(3).describe("4–7 short words or phrases (1–3 words) for a moving band: what they offer"),
  statement: z.string().min(20).describe("A bold 18–35 word statement of what they do and for whom, true to the facts"),
  services: z.array(z.object({ title: z.string().min(2), text: z.string().min(5) })).min(3).describe("3–6 services or product lines, each with a line of at most 18 words"),
  about: z.string().min(30).describe("40–80 words about the business, only from the facts given"),
  highlights: z.array(z.object({ title: z.string().min(2), text: z.string().min(4) })).min(2).describe("3 reasons to choose them (title of 2–4 words, line of at most 14 words), true by nature, no numbers or awards unless given"),
  closing: z.string().min(3).describe("A short closing call, at most 7 words"),
  photo: z.string().min(3).describe("A 3–5 word stock photo search that fits, used only if they have no photos of their own"),
});

type Written = z.infer<typeof PreviewSchema>;

export type PreviewContent = {
  v: 2;
  name: string;
  kind?: string;
  area?: string;
  address?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  socials?: string | null;
  hours?: string;
  style: (typeof STYLES)[number];
  palette: (typeof PALETTES)[number];
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  sub: string;
  cta: string;
  marquee: string[];
  statement: string;
  services: { title: string; text: string }[];
  about: string;
  highlights: { title: string; text: string }[];
  closing: string;
  brand: Brand;
  /** Stock photos, when they have too few of their own. */
  stock: (Picture & { by: string; source: string; page: string })[];
};

const cut = (s: string, n: number) => {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= n) return t;
  const at = t.lastIndexOf(" ", n);
  return `${t.slice(0, at > n * 0.6 ? at : n).replace(/[,;:\s]+$/, "")}…`;
};

function tidyWritten(w: Written): Omit<PreviewContent, "v" | "name" | "brand" | "stock"> {
  const accent = w.headlineAccent.trim();
  return {
    style: w.style,
    palette: w.palette,
    eyebrow: cut(w.eyebrow, 48),
    headline: cut(w.headline, 64).replace(/…$/, ""),
    headlineAccent: accent && w.headline.toLowerCase().includes(accent.toLowerCase()) ? accent : "",
    sub: cut(w.sub, 180),
    cta: cut(w.cta, 26).replace(/…$/, ""),
    marquee: w.marquee.slice(0, 7).map((m) => cut(m, 26)),
    statement: cut(w.statement, 240),
    services: w.services.slice(0, 6).map((sv) => ({ title: cut(sv.title, 36), text: cut(sv.text, 140) })),
    about: cut(w.about, 560),
    highlights: w.highlights.slice(0, 3).map((h) => ({ title: cut(h.title, 34), text: cut(h.text, 100) })),
    closing: cut(w.closing, 56).replace(/…$/, ""),
  };
}

/** The public address of a preview. */
export function previewLink(slug: string) {
  const origin = (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.jomiez.com").replace(/\/$/, "");
  return `${origin}/preview/${slug}`;
}

const slugOf = (name: string) =>
  `${name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)}-${randomBytes(3).toString("hex")}`;

/**
 * Makes (or remakes) the sample homepage for a lead and returns its address:
 * their own logo, photos, colours and map point (brand.ts), Keeper's words
 * from the facts (one short model call), stock photos only where they have
 * none of their own.
 */
export async function makePreview(payload: Payload, id: number | string, opts: { model: LanguageModel }) {
  const lead = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead;
  const check = (lead.check ?? {}) as CheckResult;
  const facts = check.facts ?? {};
  const preview = (lead.preview ?? {}) as { slug?: string; views?: number };
  const slug = preview.slug || slugOf(lead.name);
  const brand = await gatherBrand(lead, slug).catch((): Brand => ({ photos: [], products: [], colours: [] }));
  const prompt = [
    `BUSINESS: ${lead.name}${lead.kind ? ` (${lead.kind})` : ""}${lead.area ? `, ${lead.area}` : ""}.`,
    Object.keys(facts).length
      ? `FACTS FROM THEIR MAP LISTING: ${Object.entries(facts)
          .filter(([k]) => k !== "lat" && k !== "lon")
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
          .join("; ")}`
      : "",
    check.site ? `WHAT THEIR CURRENT WEBSITE SAYS:\nTitle: ${check.site.title}\nDescription: ${check.site.description}\nHeadings: ${check.site.headings.join(" | ")}\nText: ${check.site.text.slice(0, 1400)}` : "They have no website of their own.",
    `THEIR OWN PICTURES: ${brand.photos.length} photos, ${brand.products.length} product shots${brand.logo ? ", a logo" : ""}.`,
    "Write the words for a beautiful one-page website for them, in the shape asked for. It will be shown to the owner as a free sample of what their new site could be.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const written = await ask(
    opts.model,
    `You write website copy for small businesses, like the best studios do: specific, warm, confident, short. Use only the facts given (and what their current site says). Never invent years in business, awards, prices, staff names, reviews, testimonials, customer numbers or opening hours. Where you don't know, write general but true lines about this kind of business. No clichés ("look no further", "one-stop shop", "we've got you covered").`,
    prompt,
    PreviewSchema,
  );
  const words = tidyWritten(written);

  // Stock photos only when they have fewer than two of their own.
  const stock: PreviewContent["stock"] = [];
  if (brand.photos.length < 2) {
    // A narrow search often finds nothing free to use, so widen it step by step.
    const words = written.photo.trim().split(/\s+/);
    const searches = [...new Set([written.photo, words.slice(0, 2).join(" "), lead.kind ? String(lead.kind) : ""].filter(Boolean))];
    const tried = new Set<string>();
    for (const q of searches) {
      const found = await findPhotos(q, "landscape").catch(() => []);
      for (const p of found.filter((x) => (!x.width || x.width >= 1000) && !tried.has(x.url)).slice(0, 4)) {
        tried.add(p.url);
        try {
          const img = await fetchImage(p.url);
          if (img.w < 900) continue;
          stock.push({ ...(await keepImage(img, slug, `stock-${stock.length}`, 1800, p.alt)), by: p.by, source: p.source, page: p.page });
          if (stock.length === 3) break;
        } catch {
          // the next one
        }
      }
      if (stock.length >= 2) break;
    }
  }

  const full: PreviewContent = {
    v: 2,
    ...words,
    name: lead.name,
    kind: (lead.kind as string) || undefined,
    area: (lead.area as string) || undefined,
    address: (lead.address as string) || undefined,
    country: (lead.country as string) || undefined,
    phone: (lead.phone as string) || null,
    email: (lead.email as string) || null,
    socials: (lead.socials as string) || null,
    hours: facts.opening_hours,
    brand,
    stock,
  };
  await payload.update({
    collection: "leads",
    id,
    data: {
      preview: { slug, content: full, madeAt: new Date().toISOString(), views: preview.views ?? 0 },
      log: [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what: `Homepage preview made (${brand.photos.length + brand.products.length} of their own pictures${brand.logo ? ", their logo" : ""})` }],
    } as never,
    overrideAccess: true,
  });
  return { id, name: lead.name, url: previewLink(slug), ownPictures: brand.photos.length + brand.products.length, logo: Boolean(brand.logo) };
}
