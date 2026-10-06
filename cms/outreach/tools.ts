import type { Where } from "payload";
import { z } from "zod";
import type { AddTool, ToolEnv } from "../agent/tools";
import { sightOf, loadConfig } from "../agent/run";
import { checkLead } from "./check";
import { addLead, findLeads } from "./find";
import { COUNTRIES, KINDS, type Country, type Kind } from "./kinds";
import { emailsLeftToday, sendLeadEmail, setStatus, smsLink, stopLead, whatsappLink } from "./send";
import { loadOutreach } from "./settings";
import { outreachToday } from "./today";
import { makePreview, previewLink, writeLead, writerModel } from "./write";

/*
 * Keeper's tools for finding clients (cms/outreach). It can find, check and
 * write to businesses, and send an email when the owner approves it; WhatsApp
 * and texts are always sent by the owner from the phone app.
 */

const kindEnum = z.enum(Object.keys(KINDS) as [Kind, ...Kind[]]);
const countryEnum = z.enum(Object.keys(COUNTRIES) as [Country, ...Country[]]);
const leadId = z.union([z.string(), z.number()]).describe("The lead's id.");

const card = (l: Record<string, unknown>) => ({
  id: l.id,
  name: l.name,
  kind: l.kind,
  area: l.area,
  status: l.status,
  score: l.score,
  phone: l.phone ? "yes" : "no",
  email: l.email ? "yes" : "no",
  website: l.website ?? null,
  found: typeof l.summary === "string" ? l.summary.slice(0, 400) : undefined,
  preview: (l.preview as { slug?: string } | null)?.slug ? previewLink(String((l.preview as { slug: string }).slug)) : undefined,
});

export function addOutreachTools(add: AddTool, env: ToolEnv) {
  const payload = env.actor.payload;

  add(
    "outreach_today",
    {
      description:
        "Finding clients, the whole morning's job: finds new businesses in the areas set in Clients → Finding clients (or the area you give), checks their websites, and writes messages (with a free homepage preview for the best) for the owner to send from the phone app. Takes a few minutes. Nothing is sent.",
      input: z.object({
        area: z.string().optional().describe("Only this area this time, e.g. “Lekki, Lagos”. Leave out to use the saved areas in turn."),
        country: countryEnum.optional(),
        kinds: z.array(kindEnum).optional().describe(`With area: kinds of business. ${Object.entries(KINDS).map(([k, v]) => `${k} = ${v.label}`).join("; ")}`),
        newLeads: z.number().int().min(1).max(40).optional().describe("How many new businesses to find and check (default: the setting)."),
        messages: z.number().int().min(1).max(30).optional().describe("How many messages to write (default: the setting)."),
      }),
      risk: () => "web",
      title: (i) => (i.area ? `Finding clients in ${String(i.area)}` : "Finding new clients"),
    },
    async ({ area, country, kinds, newLeads, messages }) => {
      const s = await loadOutreach(payload);
      const search = area ? { area, country: country ?? "NG", kinds: kinds?.length ? kinds : (["food", "beauty", "health", "education"] as Kind[]) } : undefined;
      const res = await outreachToday(payload, { origin: env.origin, search, newLeads, messages, progress: (text) => env.emit({ t: "notice", text }) });
      return { ...res, next: res.waiting ? `${res.waiting} messages are waiting in the phone app (Clients) for the owner to read and send.` : undefined, emailReady: Boolean(s.gmail && s.gmailPassword) };
    },
  );

  add(
    "find_leads",
    {
      description: "Finds businesses of the given kinds in an area on OpenStreetMap and adds the new ones to Leads (not checked or written to yet). Use outreach_today for the whole job.",
      input: z.object({ area: z.string().min(2), country: countryEnum.default("NG"), kinds: z.array(kindEnum).min(1), limit: z.number().int().min(1).max(40).default(10) }),
      risk: () => "web",
      title: (i) => `Looking for businesses in ${String(i.area)}`,
    },
    async ({ area, country, kinds, limit }) => {
      const res = await findLeads(payload, { area, country, kinds }, limit);
      return { area: res.area, onTheMap: res.seen, added: res.added };
    },
  );

  add(
    "add_lead",
    {
      description: "Adds one business to Leads by hand (e.g. one the owner mentions, or found while researching). Checks it isn't there already or asked not to be contacted.",
      input: z.object({
        name: z.string().min(2),
        kind: z.string().optional(),
        area: z.string().optional(),
        country: countryEnum.optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        socials: z.string().optional(),
        notes: z.string().optional(),
      }),
      risk: () => "note",
      title: (i) => `Adding ${String(i.name)} to leads`,
    },
    async (input) => addLead(payload, input, "keeper"),
  );

  add(
    "list_leads",
    {
      description: "Lists leads (businesses that might want a website), best first, optionally by status (new, checked, ready, contacted, replied, won, lost, skipped, stopped) or area.",
      input: z.object({ status: z.string().optional(), area: z.string().optional(), limit: z.number().int().min(1).max(50).default(15) }),
      risk: () => "read",
      title: () => "Looking at leads",
    },
    async ({ status, area, limit }) => {
      const and: Where[] = [];
      if (status) and.push({ status: { equals: status } });
      if (area) and.push({ area: { like: area } });
      const { docs, totalDocs } = await payload.find({ collection: "leads", where: and.length ? { and } : {}, sort: "-score", limit, depth: 0, overrideAccess: true });
      const counts: Record<string, number> = {};
      for (const st of ["new", "checked", "ready", "contacted", "replied", "won"]) counts[st] = (await payload.count({ collection: "leads", where: { status: { equals: st } }, overrideAccess: true })).totalDocs;
      return { total: totalDocs, byStatus: counts, leads: docs.map((d) => card(d as unknown as Record<string, unknown>)) };
    },
  );

  add(
    "read_lead",
    {
      description: "Everything about one lead: contact details (whether there's a phone/email), what the website check found, the written messages and its history.",
      input: z.object({ id: leadId }),
      risk: () => "read",
      title: () => "Reading a lead",
    },
    async ({ id }) => {
      const l = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
      const check = (l.check ?? {}) as { kind?: string; scores?: unknown; findings?: unknown };
      return {
        ...card(l),
        address: l.address,
        socials: l.socials,
        review: l.review,
        check: { kind: check.kind, scores: check.scores, findings: check.findings },
        messages: l.messages,
        notes: l.notes,
        history: l.log,
      };
    },
  );

  add(
    "check_lead",
    {
      description: "Checks one lead's website on a phone (does it open, speed, made for phones, Google, how it looks) and scores the lead.",
      input: z.object({ id: leadId }),
      risk: () => "web",
      title: () => "Checking a business's website",
    },
    async ({ id }) => {
      const s = await loadOutreach(payload);
      return checkLead(payload, id, { sight: env.sight ?? sightOf(await loadConfig(payload)), pagespeedKey: s.pagespeedKey, ownOrigin: env.origin });
    },
  );

  add(
    "write_to_lead",
    {
      description:
        "Writes (or rewrites) the WhatsApp message, text and email for a lead from what its check found, ready for the owner to send. Give `instructions` to change the angle (e.g. “shorter”, “mention online booking”). Set preview to make the free homepage preview first.",
      input: z.object({ id: leadId, instructions: z.string().optional(), preview: z.boolean().optional(), followUp: z.boolean().optional() }),
      risk: () => "draft",
      title: () => "Writing to a business",
    },
    async ({ id, instructions, preview, followUp }) => {
      const s = await loadOutreach(payload);
      const model = await writerModel(payload);
      const url = preview ? (await makePreview(payload, id, { model })).url : null;
      const res = await writeLead(payload, id, { model, settings: s, previewUrl: url, extra: instructions, followUp });
      env.emit({ t: "change", title: res.name, action: "wrote to", admin: `/admin/collections/leads/${id}`, site: url });
      return res;
    },
  );

  add(
    "make_preview",
    {
      description: "Makes (or remakes) the free sample homepage for a lead, at jomiez.com/preview/…, using only facts about the business. Then rewrite the message so it links to it.",
      input: z.object({ id: leadId }),
      risk: () => "draft",
      title: () => "Making a homepage preview",
    },
    async ({ id }) => {
      const res = await makePreview(payload, id, { model: await writerModel(payload) });
      env.emit({ t: "change", title: res.name, action: "made a preview for", admin: `/admin/collections/leads/${id}`, site: res.url });
      return res;
    },
  );

  add(
    "lead_status",
    {
      description:
        "Records what happened with a lead: replied, won (now a client), lost (not interested), skipped (not a fit), or stopped (they asked not to be contacted: they're never contacted again). WhatsApp and texts are marked sent by the owner in the app.",
      input: z.object({ id: leadId, status: z.enum(["replied", "won", "lost", "skipped", "stopped", "checked"]), note: z.string().optional() }),
      risk: () => "note",
      title: (i) => `Marking a lead ${String(i.status)}`,
    },
    async ({ id, status, note }) => (status === "stopped" ? stopLead(payload, { id }) : setStatus(payload, id, status, note)),
  );

  add(
    "email_lead",
    {
      description: "Sends the lead's written email from the owner's Gmail (Clients → Finding clients → Email), with their address and a don't-email-me link. A few a day at most.",
      input: z.object({ id: leadId }),
      risk: () => "email",
      title: () => "Emailing a business",
      preview: async (i) => {
        const l = (await payload.findByID({ collection: "leads", id: i.id as number, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
        const m = (l.messages ?? {}) as { emailSubject?: string; emailBody?: string };
        return { detail: `To: ${String(l.email ?? "(no email)")} (${String(l.name)})\nSubject: ${m.emailSubject ?? ""}\n\n${m.emailBody ?? ""}` };
      },
    },
    async ({ id }) => {
      const left = await emailsLeftToday(payload);
      if (!left.left) throw new Error("Today's emails have all gone out; it waits for tomorrow.");
      return sendLeadEmail(payload, id);
    },
  );

  add(
    "lead_links",
    {
      description: "The WhatsApp and text links for a lead's message (they open the owner's phone with the message ready). Only for showing the owner; you can't send these yourself.",
      input: z.object({ id: leadId }),
      risk: () => "read",
      title: () => "Getting a lead's message links",
    },
    async ({ id }) => {
      const l = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
      const m = (l.messages ?? {}) as { whatsapp?: string; sms?: string };
      const phone = typeof l.phone === "string" ? l.phone : "";
      return { whatsapp: phone && m.whatsapp ? whatsappLink(phone, m.whatsapp) : null, sms: phone && m.sms ? smsLink(phone, m.sms) : null, app: "/app (Clients)" };
    },
  );
}
