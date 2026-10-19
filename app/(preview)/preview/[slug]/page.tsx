import { createHash } from "node:crypto";
import config from "@payload-config";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import type { ReactNode } from "react";
import { push } from "@/cms/app/push";
import { readPreview } from "@/cms/outreach/preview-content";
import { loadOutreach } from "@/cms/outreach/settings";
import { previewLink, type PreviewContent } from "@/cms/outreach/write";
import { siteEntry } from "@/cms/sites/serve";
import type { DirectionId } from "@/cms/outreach/design/library";
import { buildCtx, type Ctx } from "@/components/preview/design/context";
import { Catalogue } from "@/components/preview/design/Catalogue";
import { Monument } from "@/components/preview/design/Monument";
import { Place } from "@/components/preview/design/Place";
import { Poster } from "@/components/preview/design/Poster";
import { Split } from "@/components/preview/design/Split";

/*
 * A free sample homepage made for a business (cms/outreach/write.ts →
 * makePreview): their logo, photos, products and prices, colours, hours and
 * map, in one of the art directions of the design library (cms/outreach/design,
 * laid out by components/preview/design), with a Jomiez ribbon on top. Every button uses
 * their own number. Each photo appears once. The first time someone other than
 * a link-preview robot opens it, the owner gets a notification: that's the
 * moment to follow up.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function leadFor(slug: string) {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "leads", where: { "preview.slug": { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  const lead = docs[0] as unknown as (Record<string, unknown> & { id: number; name: string; preview?: { content?: unknown; views?: number; kind?: string } }) | undefined;
  if (!lead || lead.status === "stopped") return null;
  // A preview made from a template is its own set of files (cms/sites): this address leads to it.
  if (lead.preview?.kind === "aethron") return { payload, lead, content: null };
  const content = readPreview(lead.preview?.content);
  return content ? { payload, lead, content } : null;
}

const heroOf = (c: PreviewContent) => c.brand.photos[0] ?? c.stock[0];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) return { title: "Preview" };
  const { content } = found;
  if (!content) return { title: `${found.lead.name}: a website preview` };
  const hero = heroOf(content);
  const abs = (u: string) => (u.startsWith("/") ? `${previewLink("").replace(/\/preview\/$/, "")}${u}` : u);
  return {
    title: `${content.name}: a website preview`,
    description: content.sub,
    openGraph: { title: `${content.name}: ${content.headline}`, description: content.sub, images: hero ? [{ url: abs(hero.url) }] : undefined, url: previewLink(slug) },
  };
}

const ROBOTS = /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview|embedly|vkshare|skype|linkedin|pinterest|google-?inspection|headless|lighthouse/i;

async function countView(payload: Awaited<ReturnType<typeof getPayload>>, lead: { id: number; name: string; preview?: { views?: number } }) {
  const h = await headers();
  if (ROBOTS.test(h.get("user-agent") ?? "")) return;
  const { user } = await payload.auth({ headers: h }).catch(() => ({ user: null }));
  if (user) return; // the owner looking at it
  // One visitor counts once every few hours (reloads and double renders don't).
  const who = createHash("sha256").update(`${h.get("x-forwarded-for")?.split(",")[0] ?? ""}|${h.get("user-agent") ?? ""}`).digest("base64url").slice(0, 16);
  const key = `outreach:view:${lead.id}:${who}`;
  const seen = await payload.kv.get<number>(key);
  if (seen && Date.now() - seen < 6 * 3600_000) return;
  await payload.kv.set(key, Date.now());
  const views = (lead.preview?.views ?? 0) + 1;
  await payload.update({ collection: "leads", id: lead.id, data: { preview: { ...lead.preview, views, lastViewedAt: new Date().toISOString() } } as never, overrideAccess: true });
  if (views === 1) {
    await push(payload, { title: `${lead.name} opened their preview`, body: "They're looking at the sample homepage now: a good moment to follow up.", url: `/app?lead=${lead.id}`, tag: `preview-${lead.id}` }).catch(() => undefined);
  }
}

/* ---------- The page ---------- */

const LAYOUTS: Record<DirectionId, (p: { ctx: Ctx }) => ReactNode> = { monument: Monument, place: Place, split: Split, poster: Poster, catalogue: Catalogue };

export default async function PreviewPage({ params }: Params) {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) notFound();
  const { payload, lead, content: c } = found;
  await countView(payload, lead).catch(() => undefined);
  if (!c) redirect(siteEntry(slug));
  const s = await loadOutreach(payload);
  const ownerWa = s.senderPhone ? `https://wa.me/${s.senderPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw the website preview for ${c.name} (${previewLink(slug)}). I'd like to know more.`)}` : "https://www.jomiez.com/contact";
  const ctx = buildCtx(c, { slug, ownerWa, stop: `/api/outreach/stop?t=${encodeURIComponent(String(lead.stopToken ?? ""))}` });
  const Layout = LAYOUTS[c.design.direction] ?? Monument;
  return <Layout ctx={ctx} />;
}
