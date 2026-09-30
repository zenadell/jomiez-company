import type { CollectionSlug, GlobalSlug } from "payload";
import type { Actor } from "./docs";
import { titleOf } from "./docs";
import { siteUrl, walk, type Target } from "./schema";

/*
 * Site checks the agent can run at any time: search listings and sharing
 * details, image descriptions, links that go nowhere, unpublished work and
 * leftover placeholder text.
 */

export type Finding = { severity: "high" | "medium" | "low"; where: string; issue: string; fix?: string };

const STATIC_ROUTES = ["/", "/about", "/services", "/work", "/insights", "/contact", "/privacy-policy", "/terms-conditions"];
const ANCHORS = ["/#work", "/#capabilities", "/#pricing", "/contact#book"];

async function allDocs(a: Actor, t: Target) {
  const opts = a.system ? { overrideAccess: true } : { user: a.user ?? undefined, overrideAccess: false };
  if (t.kind === "global") return [await a.payload.findGlobal({ slug: t.slug as GlobalSlug, draft: t.drafts, depth: 0, ...opts })];
  const { docs } = await a.payload.find({ collection: t.slug as CollectionSlug, draft: t.drafts, depth: 0, limit: 500, pagination: false, ...opts });
  return docs;
}

export async function audit(a: Actor, targets: Target[], checks: string[]): Promise<{ summary: string; findings: Finding[] }> {
  const want = (c: string) => !checks.length || checks.includes(c) || checks.includes("all");
  const findings: Finding[] = [];
  const docsBy = new Map<string, Record<string, unknown>[]>();
  for (const t of targets) {
    if (["inquiries", "agent-memory", "agent-routines", "payload-kv"].includes(t.slug)) continue;
    try {
      docsBy.set(t.slug, (await allDocs(a, t)) as unknown as Record<string, unknown>[]);
    } catch {
      // Not allowed to read it: skip.
    }
  }
  const routes = new Set([...STATIC_ROUTES, ...ANCHORS]);
  for (const p of docsBy.get("pages") ?? []) if (p.slug) routes.add(`/${p.slug}`);
  for (const p of docsBy.get("projects") ?? []) if (p.slug) routes.add(`/work/${p.slug}`);
  for (const p of docsBy.get("articles") ?? []) if (p.slug) routes.add(`/insights/${p.slug}`);
  for (const r of docsBy.get("redirects") ?? []) if (typeof r.from === "string") routes.add(r.from);

  const seoTitles = new Map<string, string>();
  for (const t of targets) {
    for (const doc of docsBy.get(t.slug) ?? []) {
      const name = `${t.label}${t.kind === "collection" ? ` › ${titleOf(t, doc)}` : ""}`;
      const url = siteUrl(t, doc as { slug?: unknown });

      if (want("seo") && url && !url.includes("every page") && "meta" in doc) {
        const meta = (doc.meta ?? {}) as { title?: string; description?: string; image?: unknown };
        if (!meta.title) findings.push({ severity: "medium", where: name, issue: "No search title (SEO tab).", fix: "Write a title under 60 characters." });
        else if (meta.title.length > 60) findings.push({ severity: "low", where: name, issue: `Search title is ${meta.title.length} characters; Google shows about 60.` });
        if (!meta.description) findings.push({ severity: "medium", where: name, issue: "No search description (SEO tab).", fix: "Write 120–155 characters." });
        else if (meta.description.length > 160 || meta.description.length < 70)
          findings.push({ severity: "low", where: name, issue: `Search description is ${meta.description.length} characters; aim for 120–155.` });
        if (meta.title) {
          const seen = seoTitles.get(meta.title);
          if (seen) findings.push({ severity: "medium", where: name, issue: `Same search title as ${seen}.` });
          else seoTitles.set(meta.title, name);
        }
      }

      if (want("content") && t.drafts && doc._status === "draft") {
        findings.push({ severity: "low", where: name, issue: "Has changes that aren't published yet." });
      }

      walk(t.fields, doc, (f, value, path, labels) => {
        const where = `${name} › ${labels.filter(Boolean).join(" › ")}`;
        if (want("links") && "name" in f && f.name === "href" && typeof value === "string" && value.startsWith("/")) {
          const bare = value.split("?")[0].replace(/\/$/, "") || "/";
          const base = bare.split("#")[0] || "/";
          if (!routes.has(bare) && !routes.has(base)) findings.push({ severity: "high", where, issue: `Links to ${value}, which doesn't exist.` });
        }
        if (want("content") && typeof value === "string" && /\b(lorem ipsum|TODO|TBD|placeholder|xxx)\b/i.test(value)) {
          findings.push({ severity: "medium", where, issue: `Looks like placeholder text: "${value.slice(0, 80)}"` });
        }
        void path;
      });
    }
  }

  if (want("images")) {
    for (const m of docsBy.get("media") ?? []) {
      if (!String(m.alt ?? "").trim()) {
        findings.push({ severity: "medium", where: `Media library › ${m.filename}`, issue: "No description (alt text) for screen readers and search.", fix: `Media id ${m.id}` });
      }
    }
  }

  const count = (s: Finding["severity"]) => findings.filter((f) => f.severity === s).length;
  const summary = findings.length
    ? `${findings.length} findings: ${count("high")} high, ${count("medium")} medium, ${count("low")} low.`
    : "Everything checked looks right.";
  return { summary, findings: findings.slice(0, 150) };
}
