import { z } from "zod";
import type { AddTool, ToolEnv } from "../agent/tools";
import { loadOutreach } from "../outreach/settings";
import { writeLead, writerModel } from "../outreach/write";
import { aethron, aethronStatus, AETHRON_TOOLS } from "./aethron";
import { makeSitePreview, prepareTemplate, publishSitePreview } from "./make";
import { findFreeTemplates, libraryFor } from "./templates";

/*
 * Keeper's tools for previews made from templates, with Aethron (cms/sites).
 * The big steps are whole tools (so a preview costs a few short model calls,
 * not a long conversation); the aethron tool is there for adjusting one.
 */

const leadId = z.union([z.string(), z.number()]).describe("The lead's id.");

const RULES = `Aethron's rules: write only through its tools; batches of at most 40 lines; a line with max_bytes must fit that many UTF-8 bytes (shorten and resend when refused); no backticks or "\${" in new text; reviews only when real (never invent reviews, ratings or counts); custom HTML has no scripts; an add_block anchor is the template's own words (the "old" side from get_content); never call undo repeatedly; a preview is done only when export_preview says PASS.`;

export function addSiteTools(add: AddTool, env: ToolEnv) {
  const payload = env.actor.payload;
  const progress = (text: string) => env.emit({ t: "notice", text });

  add(
    "find_templates",
    {
      description:
        "Finds website templates for a kind of business, to make a lead's preview from (with Aethron): first the template library (the owner's own paid templates first, then ones used before), then free templates on Framer's marketplace. Look at the most promising ones (screenshot their live address) and choose one that is truly beautiful, modern and close to what the business does; then save_template it, or use a library one with make_site_preview. Also says whether Aethron is connected.",
      input: z.object({
        kind: z.string().min(2).describe("What the business is, e.g. “furniture shop”, “restaurant”, “hair salon”, “dental clinic”"),
        more: z.boolean().optional().describe("Look for free templates even when the library has some"),
      }),
      risk: () => "web",
      title: (i) => `Looking for ${String(i.kind)} templates`,
    },
    async ({ kind, more }) => {
      const library = await libraryFor(payload, kind);
      const status = aethronStatus();
      const aethronNote = status.ready ? `Aethron is connected (${status.mode === "hosted" ? `hosted at ${status.where}` : `through the runner on ${"runner" in status && status.runner.connected ? status.runner.name : "the Mac"}`}).` : "Aethron isn't connected right now (the runner on the Mac isn't running), so previews can't be made from templates until it is.";
      if (library.length && !more) return { aethron: aethronNote, library, note: "These are in the library. Use one with make_site_preview, or call again with more: true to look for new free ones." };
      const { docs } = await payload.find({ collection: "site-templates", limit: 500, depth: 0, overrideAccess: true, select: { url: true, page: true } });
      const skip = docs.flatMap((d) => [String((d as { url?: string }).url ?? ""), String((d as { page?: string }).page ?? "").replace(/\/$/, "").split("/").pop() ?? ""]).filter(Boolean);
      const found = await findFreeTemplates(payload, kind, { limit: 6, skip });
      return {
        aethron: aethronNote,
        library,
        free: found.candidates,
        searched: found.categories.map((c) => `framer.com/marketplace/templates/category/${c}`),
        notes: found.notes.length ? found.notes : undefined,
        next: "Screenshot the live addresses of the best two or three, pick the most beautiful one that fits, then save_template it.",
      };
    },
  );

  add(
    "save_template",
    {
      description:
        "Adds a template to the library (a free one found with find_templates, or one the owner gives you) and gets it ready in Aethron: copies it and lists its pages. Takes a few minutes the first time; after that each preview from it is quick.",
      input: z.object({
        url: z.string().url().describe("The template's live address, e.g. https://agarimo.framer.website"),
        name: z.string().min(2).max(80),
        kinds: z.array(z.string().min(2).max(40)).min(1).max(12).describe("Kinds of business it suits"),
        style: z.string().max(400).optional().describe("A line on how it looks"),
        page: z.string().url().optional().describe("Its marketplace page"),
        source: z.enum(["free", "paid"]).default("free").describe("paid: one of the owner's own templates"),
        licence: z.string().max(120).optional(),
        licenceUrl: z.string().url().optional(),
      }),
      risk: () => "web",
      title: (i) => `Adding the template ${String(i.name)}`,
    },
    async (t) => {
      const { docs } = await payload.find({ collection: "site-templates", where: { url: { equals: t.url } }, limit: 1, depth: 0, overrideAccess: true });
      const platform = /framer\.(website|ai|app)/.test(t.url) ? "framer" : /webflow\.io/.test(t.url) ? "webflow" : "other";
      const doc =
        docs[0] ??
        (await payload.create({
          collection: "site-templates",
          data: { name: t.name, url: t.url, kinds: t.kinds, style: t.style, page: t.page, source: t.source, platform, licence: t.licence ?? (t.source === "free" && platform === "framer" ? "Framer Marketplace licence (free template)" : undefined), licenceUrl: t.licenceUrl, enabled: true } as never,
          overrideAccess: true,
        }));
      const ready = await prepareTemplate(payload, Number(doc.id), progress);
      env.emit({ t: "change", title: t.name, action: "added the template", admin: `/admin/collections/site-templates/${doc.id}`, site: t.url });
      return { id: doc.id, name: t.name, project: ready.project, pages: ready.pages };
    },
  );

  add(
    "make_site_preview",
    {
      description:
        "Makes a lead's preview from a library template, with Aethron: copies the template with only the pages worth showing (home, plus contact or about when they help; links to other pages open a 'this is a preview' note), writes the business's own words, pictures and links into it, adds a map, and has Aethron check every page in a browser. Only when the check passes does it go online at jomiez.com/preview/… and the lead's messages are rewritten to link to it. Takes several minutes.",
      input: z.object({
        id: leadId,
        template: z.union([z.string(), z.number()]).describe("The library template's id (from find_templates or save_template)"),
        pages: z.array(z.string().min(1).max(60)).max(8).optional().describe("Which of the template's pages to build, e.g. [\"home\", \"contact\"] (default). Only what's worth showing."),
      }),
      risk: () => "draft",
      title: () => "Making a preview from a template",
    },
    async ({ id, template, pages }) => {
      const model = await writerModel(payload);
      const res = await makeSitePreview(payload, Number(id), { templateId: Number(template), pages, model, progress });
      if (!res.ok) return res;
      const written = await writeLead(payload, id, { model, settings: await loadOutreach(payload), previewUrl: res.url ?? null });
      env.emit({ t: "change", title: `Preview from ${res.template}`, action: "made", admin: `/admin/collections/leads/${id}`, site: res.url ?? null });
      return { ...res, whatsapp: written.whatsapp };
    },
  );

  add(
    "publish_site_preview",
    {
      description: "After adjusting a lead's template preview with the aethron tool: exports it again, checks it in a browser, and puts it online when the check passes.",
      input: z.object({ id: leadId }),
      risk: () => "draft",
      title: () => "Publishing a template preview",
    },
    async ({ id }) => publishSitePreview(payload, Number(id), { progress }),
  );

  add(
    "aethron",
    {
      description: `Calls one of Aethron's tools directly, to adjust a template preview (its project is the lead's preview slug): ${AETHRON_TOOLS.join(", ")}. E.g. get_content {project, section: strings|images|links, only_unfilled, filter, offset, limit}; set_content_bulk {project, entries: [{old, new, section}], build: false}; add_block {project, kind: map|reviews|html, anchor, position, page, data}; preview_pages {project, pages}; preview_ribbon {project, ribbon}. After changes, publish_site_preview. ${RULES}`,
      input: z.object({
        tool: z.enum(AETHRON_TOOLS),
        args: z.record(z.string(), z.unknown()).describe("The tool's arguments"),
      }),
      risk: (i) => (i.tool === "delete_project" ? "delete" : "draft"),
      title: (i) => `Aethron: ${String(i.tool).replace(/_/g, " ")}`,
    },
    async ({ tool, args }) => {
      const r = await aethron(tool, args);
      return { ok: r.ok, result: r.data ?? r.text.slice(0, 12_000) };
    },
  );
}
