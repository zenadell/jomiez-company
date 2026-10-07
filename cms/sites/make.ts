import type { LanguageModel } from "ai";
import type { Payload } from "payload";
import { gatherBrand } from "../outreach/brand";
import type { CheckResult } from "../outreach/check";
import { looksMobile } from "../outreach/kinds";
import { previewLink, slugOf } from "../outreach/write";
import { aethron, uploadExport, type Answer } from "./aethron";
import { fillPreview, linesOf, type Facts } from "./fill";

/*
 * A lead's preview made from a template (the Aethron handoff, section 2):
 * prepare the template once, copy it for the lead with only the pages worth
 * showing (links to the rest open a "this is a preview" note), write their
 * words, pictures and links into it, add a map, export it, and only when
 * Aethron's browser check says PASS, put it online and give it to the lead.
 */

type Lead = Record<string, unknown> & { id: number; name: string; stopToken?: string; preview?: Record<string, unknown> | null; check?: CheckResult | null };
type Template = Record<string, unknown> & { id: number; name: string; url: string; project?: string | null; prepared?: boolean; pages?: unknown };

/** The address, followed by only the parts of the area it doesn't already say. */
const whereOf = (lead: Lead) => {
  const address = typeof lead.address === "string" ? lead.address.trim() : "";
  const area = typeof lead.area === "string" ? lead.area : "";
  const has = address.toLowerCase();
  return [address, ...area.split(",").map((p) => p.trim()).filter((p) => p && !has.includes(p.toLowerCase()))].filter(Boolean).join(", ");
};

const SITE = () => (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.jomiez.com").replace(/\/$/, "");
const absolute = (u: string) => (u.startsWith("/") ? `${SITE()}${u}` : u);

/** Page names in an Aethron answer. */
function pagesOf(a: Answer): string[] {
  const d = a.data as unknown;
  const pick = (x: unknown): string[] | null => {
    if (Array.isArray(x) && x.every((p) => typeof p === "string")) return x as string[];
    if (Array.isArray(x) && x.every((p) => p && typeof p === "object" && typeof (p as { name?: unknown }).name === "string")) return (x as { name: string }[]).map((p) => p.name);
    if (x && typeof x === "object") {
      for (const k of ["pages", "available", "all", "builds"]) {
        const found = pick((x as Record<string, unknown>)[k]);
        if (found) return found;
      }
    }
    return null;
  };
  return pick(d) ?? [...new Set([...a.text.matchAll(/(?:^|[\s,"'[])(home|about|contact|services|work|pricing|blog(?:\/[a-z0-9-]+)?|[a-z0-9-]+\/[a-z0-9-]+)(?=[\s,"'\]]|$)/gim)].map((m) => m[1].toLowerCase()))];
}

/** The browser check's verdict: export_preview's structured answer, or its words from an older Aethron. */
const verdictOf = (a: Answer) => {
  const v = (a.data as { verdict?: unknown } | undefined)?.verdict;
  if (typeof v === "string" && /^(pass|fail|skipped)$/i.test(v)) return v.toLowerCase();
  return /\bPASS\b/.test(a.text) ? "pass" : /\bFAIL\b/.test(a.text) ? "fail" : /\bSKIPPED\b/.test(a.text) ? "skipped" : a.ok ? "unknown" : "fail";
};

/** Where Aethron wrote the export, on the Mac. */
const folderOf = (a: Answer) => {
  const f = (a.data as { folder?: unknown } | undefined)?.folder;
  return typeof f === "string" && f ? f : undefined;
};

/** Lines that say where to find them, best first: short headings, then sentences, then lone menu words. */
const MAP_WORDS = "Visit|Find us|Location|Address|Directions|Get in touch|Contact";
const anchorRank = (s: string) => {
  const words = s.trim().split(/\s+/).length;
  return words === 1 ? 3 : words <= 8 ? 0 : words <= 30 ? 1 : 2;
};

/** Gets a template ready in Aethron (once): copies the site, takes stock of its lines, lists its pages. */
export async function prepareTemplate(payload: Payload, id: number, progress?: (t: string) => void, again = false) {
  const t = (await payload.findByID({ collection: "site-templates", id, depth: 0, overrideAccess: true })) as unknown as Template;
  if (t.prepared && t.project && !again) return { project: t.project, pages: (t.pages as string[]) ?? [] };
  const project =
    t.project ||
    `tpl-${String(t.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)}-${t.id}`;
  progress?.(`Getting the template “${t.name}” ready in Aethron (a few minutes, once)…`);
  const made = await aethron("create_project", { name: project, url: t.url });
  if (!made.ok && !/exist/i.test(made.text)) throw new Error(`Aethron couldn't start the template: ${made.text.slice(0, 400)}`);
  const fetched = await aethron("fetch", { project });
  if (!fetched.ok) throw new Error(`Aethron couldn't copy ${t.url}: ${fetched.text.slice(0, 400)}`);
  const inv = await aethron("inventory", { project });
  if (!inv.ok) throw new Error(`Aethron couldn't read the template's lines: ${inv.text.slice(0, 400)}`);
  const pages = pagesOf(await aethron("preview_pages", { project }));
  await payload.update({ collection: "site-templates", id, data: { project, prepared: true, pages } as never, overrideAccess: true });
  return { project, pages };
}

/** What the writing model knows about the business, and their pictures and links. */
async function factsFor(lead: Lead, slug: string): Promise<Facts> {
  const check = (lead.check ?? {}) as CheckResult;
  const facts = (check.facts ?? {}) as Record<string, string>;
  const brand = await gatherBrand(lead, slug).catch(() => ({ photos: [], products: [], colours: [], logo: undefined, coords: undefined }));
  const phone = typeof lead.phone === "string" ? lead.phone : "";
  const links: Facts["links"] = [];
  if (phone && looksMobile(phone)) links.push({ label: "WhatsApp", url: `https://wa.me/${phone.replace(/\D/g, "")}` });
  if (phone) links.push({ label: "Call", url: `tel:${phone.replace(/[^\d+]/g, "")}` });
  if (typeof lead.email === "string" && lead.email) links.push({ label: "Email", url: `mailto:${lead.email}` });
  const where = whereOf(lead);
  if (brand.coords) links.push({ label: "Directions (map)", url: `https://www.google.com/maps/dir/?api=1&destination=${brand.coords.lat},${brand.coords.lon}` });
  else if (where) links.push({ label: "Directions (map)", url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name}, ${where}`)}` });
  for (const s of String(lead.socials ?? "").split(/\s+/).filter((x) => /^https?:\/\//.test(x))) {
    links.push({ label: /instagram/.test(s) ? "Instagram" : /facebook/.test(s) ? "Facebook" : /tiktok/.test(s) ? "TikTok" : /x\.com|twitter/.test(s) ? "X" : "Their page", url: s });
  }
  const site = check.site;
  const text = [
    `BUSINESS: ${lead.name}${lead.kind ? ` (${lead.kind})` : ""}.`,
    where ? `WHERE: ${where}${lead.country ? `, ${lead.country}` : ""}.` : "",
    phone ? `PHONE: ${phone}` : "",
    lead.email ? `EMAIL: ${lead.email}` : "",
    facts.opening_hours ? `OPENING HOURS: ${facts.opening_hours}` : "",
    Object.keys(facts).length ? `FROM THEIR MAP LISTING: ${Object.entries(facts).filter(([k]) => !["lat", "lon", "opening_hours"].includes(k)).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("; ")}` : "",
    site ? `WHAT THEIR CURRENT WEBSITE SAYS:\nTitle: ${site.title}\nDescription: ${site.description}\nHeadings: ${site.headings.join(" | ")}\nText: ${site.text.slice(0, 1500)}` : "They have no website of their own.",
    brand.products.length ? `THEIR PRODUCTS (from their site): ${brand.products.map((p) => [p.title, p.price].filter(Boolean).join(" — ")).filter(Boolean).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    text,
    photos: [...brand.photos, ...brand.products].map((p) => ({ url: absolute(p.url), alt: p.alt })),
    logo: brand.logo ? absolute(brand.logo.url) : null,
    links,
  };
}

/** Exports a lead's template preview and, when Aethron's browser check passes, puts it online. */
export async function publishSitePreview(payload: Payload, leadId: number, opts: { template?: Template | null; pages?: string[]; filled?: unknown; progress?: (t: string) => void } = {}) {
  const lead = (await payload.findByID({ collection: "leads", id: leadId, depth: 0, overrideAccess: true })) as unknown as Lead;
  const slug = String(lead.preview?.slug ?? "");
  const site = (lead.preview?.site ?? {}) as Record<string, unknown>;
  const project = String(site.project ?? slug);
  if (!slug) throw new Error("This lead has no preview yet: use make_site_preview.");
  opts.progress?.("Exporting the preview and checking every page in a browser (1–3 minutes)…");
  const exported = await aethron("export_preview", { project });
  const verdict = verdictOf(exported);
  const report = exported.text.slice(0, 2500);
  if (verdict !== "pass") {
    await payload.update({ collection: "leads", id: leadId, data: { preview: { ...lead.preview, site: { ...site, project, verdict, report, checkedAt: new Date().toISOString() } } } as never, overrideAccess: true });
    return { ok: false, verdict, report, note: verdict === "skipped" ? "Aethron couldn't open a browser to check it, so it isn't put online (it may be broken). Try again when the Mac is free." : "Aethron's browser check failed: fix what it lists (aethron tool), then publish_site_preview again. Don't send the link." };
  }
  opts.progress?.("Putting the preview online…");
  const up = await uploadExport(project, slug, folderOf(exported));
  if (!up.ok) return { ok: false, verdict, report, note: `It passed, but uploading failed: ${up.text.slice(0, 400)}. The preview itself is fine: don't make it again. Try publish_site_preview once more; if it fails the same way, tell the owner.` };
  const now = new Date().toISOString();
  const template = opts.template ?? null;
  await payload.update({
    collection: "leads",
    id: leadId,
    data: {
      preview: {
        ...lead.preview,
        slug,
        kind: "aethron",
        madeAt: now,
        site: {
          ...site,
          project,
          ...(template ? { template: { id: template.id, name: template.name, url: template.url, source: template.source, page: template.page ?? null, licence: template.licence ?? null, licenceUrl: template.licenceUrl ?? null } } : {}),
          ...(opts.pages ? { pages: opts.pages } : {}),
          ...(opts.filled ? { filled: opts.filled } : {}),
          verdict,
          report,
          checkedAt: now,
          uploaded: up.text,
        },
      },
      log: [...((lead.log as unknown[]) ?? []), { at: now, what: `Preview made from the template ${template?.name ?? String((site.template as { name?: string } | undefined)?.name ?? "")} (browser check passed)`.trim() }],
    } as never,
    overrideAccess: true,
  });
  return { ok: true, verdict, url: previewLink(slug), uploaded: up.text };
}

/** The whole job for one lead. */
export async function makeSitePreview(payload: Payload, leadId: number, opts: { templateId: number; pages?: string[]; model: LanguageModel; progress?: (t: string) => void }) {
  const lead = (await payload.findByID({ collection: "leads", id: leadId, depth: 0, overrideAccess: true })) as unknown as Lead;
  if (lead.status === "stopped") throw new Error("They asked not to be contacted.");
  const ready = await prepareTemplate(payload, opts.templateId, opts.progress);
  const template = (await payload.findByID({ collection: "site-templates", id: opts.templateId, depth: 0, overrideAccess: true })) as unknown as Template;
  const slug = String(lead.preview?.slug || slugOf(lead.name));
  const old = (lead.preview?.site as { project?: string } | undefined)?.project;
  // Keep the address the lead may already have; the site behind it is replaced.
  await payload.update({ collection: "leads", id: leadId, data: { preview: { ...lead.preview, slug } } as never, overrideAccess: true });
  if (old) await aethron("delete_project", { project: old, confirm: true });

  const available = ready.pages.map((p) => p.toLowerCase());
  const wanted = (opts.pages?.length ? opts.pages : ["home", "contact"]).map((p) => p.toLowerCase()).filter((p) => p === "all" || !available.length || available.includes(p));
  const pages = wanted.length ? wanted : ["home"];
  const site = SITE();
  const token = String(lead.stopToken ?? "");
  opts.progress?.(`Making ${lead.name}'s copy of “${template.name}” (${pages.join(", ")})…`);
  const makeArgs = (project: string) => ({
    template: project,
    name: slug,
    pages,
    base: `/preview/${slug}`,
    notice: `This is a preview Jomiez made for ${lead.name}. This page will be ready when we build your full website.`,
    ribbon: {
      text: `A free website preview Jomiez made for ${lead.name}.`,
      get_url: `${site}/api/outreach/get?t=${encodeURIComponent(token)}`,
      decline_url: `${site}/api/outreach/stop?t=${encodeURIComponent(token)}`,
      get_label: "Get this website",
      decline_label: "Not interested",
    },
  });
  let made = await aethron("make_preview", makeArgs(ready.project));
  // Aethron no longer has the template (a new Mac, a reinstall): get it ready again, once.
  if (!made.ok && /no template|not found|unknown|doesn't exist|does not exist/i.test(made.text)) {
    const again = await prepareTemplate(payload, opts.templateId, opts.progress, true);
    made = await aethron("make_preview", makeArgs(again.project));
  }
  if (!made.ok && /exist/i.test(made.text)) {
    // A copy for this lead is left over from an earlier try: start it afresh.
    await aethron("delete_project", { project: slug, confirm: true });
    made = await aethron("make_preview", makeArgs(ready.project));
  }
  if (!made.ok) throw new Error(`Aethron couldn't make the preview: ${made.text.slice(0, 400)}`);
  await payload.update({ collection: "leads", id: leadId, data: { preview: { ...lead.preview, slug, site: { project: slug, pages, template: { id: template.id, name: template.name } } } } as never, overrideAccess: true });

  if (typeof lead.website === "string" && lead.website && (lead.check?.kind === "basic" || lead.check?.kind === "pagespeed")) {
    await aethron("learn_brand", { project: slug, sources: [lead.website] }).catch(() => undefined);
  }
  opts.progress?.("Reading what we know about them…");
  const facts = await factsFor(lead, slug);
  const filled = await fillPreview({ project: slug, facts, model: opts.model, progress: opts.progress });

  // A map where the template talks about visiting or contacting them, when we know where they are.
  const where = whereOf(lead);
  let map: string | null = null;
  if (where) {
    // The anchor is the template's own words (the old side), on a chosen page; a lone menu word would put the map under the menu.
    const hits = linesOf(await aethron("get_content", { project: slug, section: "strings", filter: MAP_WORDS, limit: 40 }));
    const ranked = hits.filter((h) => h.old.length <= 400).sort((a, b) => anchorRank(a.old) - anchorRank(b.old));
    for (const hit of ranked.slice(0, 3)) {
      const added = await aethron("add_block", { project: slug, kind: "map", anchor: hit.old, position: "after", data: { query: `${lead.name}, ${where}`, title: "Visit us" } });
      map = added.ok ? `after “${hit.old.slice(0, 40)}”` : `not added (${added.text.slice(0, 160)})`;
      if (added.ok) break;
    }
  }
  const published = await publishSitePreview(payload, leadId, { template, pages, filled, progress: opts.progress });
  if (published.ok) await payload.update({ collection: "site-templates", id: template.id, data: { uses: Number(template.uses ?? 0) + 1 } as never, overrideAccess: true });
  return { ...published, template: template.name, pages, filled, map };
}
