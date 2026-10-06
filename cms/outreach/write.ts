import { randomBytes } from "node:crypto";
import { generateText, Output, type LanguageModel } from "ai";
import type { Payload } from "payload";
import { z } from "zod";
import { findPhotos } from "../agent/eyes";
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

const firstName = (s: Settings) => s.senderName.trim().split(/\s+/)[0] || "the Jomiez team";

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
    `FROM: ${s.senderName || "the Jomiez team"} at Jomiez (jomiez.com)${s.senderPhone ? `, ${s.senderPhone}` : ""}. How we found them: ${lead.source === "openstreetmap" ? `looking at businesses in ${lead.area ?? "their area"} on the map` : "researching local businesses"}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const RULES = `You write short, honest first messages from Jomiez, a small web design studio, to owners of local businesses.
Rules:
- Mention only the problems under FINDINGS (they were measured) and what's under HOW THEIR SITE LOOKS. Never invent problems, numbers, results, customers, reviews or awards. Never pretend to be a customer.
- Say who you are in the first line (first name, from Jomiez) and how you came across them (see FROM). Be warm and human, like a person writing one message, not a template.
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
- emailBody: 70–130 words, starting "Hi" or "Good day" with the business name. Sign off with ${firstName(s)}, Jomiez${s.senderPhone ? `, ${s.senderPhone}` : ""}. Don't add an address or unsubscribe line (they're added when it's sent).`;

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

const PreviewSchema = z.object({
  headline: z.string().min(3).max(80),
  sub: z.string().min(10).max(220),
  cta: z.string().min(3).max(32),
  services: z.array(z.object({ title: z.string().min(2).max(40), text: z.string().min(5).max(160) })).min(3).max(6),
  about: z.string().min(30).max(700),
  highlights: z.array(z.string().min(3).max(60)).min(2).max(4),
  palette: z.enum(PALETTES),
  photo: z.string().min(3).max(60),
});

export type PreviewContent = z.infer<typeof PreviewSchema> & {
  name: string;
  kind?: string;
  area?: string;
  phone?: string | null;
  email?: string | null;
  hours?: string;
  image?: { url: string; by: string; source: string; page: string } | null;
};

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

/** Writes (or rewrites) the sample homepage for a lead and returns its address. */
export async function makePreview(payload: Payload, id: number | string, opts: { model: LanguageModel }) {
  const lead = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead;
  const check = (lead.check ?? {}) as CheckResult;
  const facts = check.facts ?? {};
  const prompt = [
    `BUSINESS: ${lead.name}${lead.kind ? ` (${lead.kind})` : ""}${lead.area ? `, ${lead.area}` : ""}.`,
    Object.keys(facts).length ? `FACTS FROM THEIR MAP LISTING: ${Object.entries(facts).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("; ")}` : "",
    check.site ? `WHAT THEIR CURRENT WEBSITE SAYS:\nTitle: ${check.site.title}\nDescription: ${check.site.description}\nHeadings: ${check.site.headings.join(" | ")}\nText: ${check.site.text.slice(0, 1200)}` : "They have no website.",
    `Write the content for a sample homepage for them: a strong headline, a one-sentence sub-heading, the main button's words (how a customer would contact them: call, WhatsApp, book or order), 3–6 services with a line each, a short "about" paragraph, 2–4 short highlights, a colour palette (${PALETTES.join(", ")}: pick what suits the business) and a 3–5 word search for a fitting stock photo (no people's faces needed; e.g. "plated jollof rice", "modern hair salon interior").`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const content = await ask(
    opts.model,
    `You write website copy for small businesses. Use only the facts given (and what their current site says). Never invent years in business, awards, prices, staff names, reviews, testimonials, numbers of customers or opening hours. Where you don't know, write warm, general but true lines about the kind of business. Plain, confident words; no clichés like "look no further" or "one-stop shop".`,
    prompt,
    PreviewSchema,
  );
  const photo = await findPhotos(content.photo, "landscape")
    .then((all) => all.find((p) => p.width >= 1000) ?? all[0] ?? null)
    .catch(() => null);
  const preview = (lead.preview ?? {}) as { slug?: string; views?: number };
  const slug = preview.slug || slugOf(lead.name);
  const full: PreviewContent = {
    ...content,
    name: lead.name,
    kind: (lead.kind as string) || undefined,
    area: (lead.area as string) || undefined,
    phone: (lead.phone as string) || null,
    email: (lead.email as string) || null,
    hours: facts.opening_hours,
    image: photo ? { url: photo.url, by: photo.by, source: photo.source, page: photo.page } : null,
  };
  await payload.update({
    collection: "leads",
    id,
    data: {
      preview: { slug, content: full, madeAt: new Date().toISOString(), views: preview.views ?? 0 },
      log: [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what: "Homepage preview made" }],
    } as never,
    overrideAccess: true,
  });
  return { id, name: lead.name, url: previewLink(slug) };
}
