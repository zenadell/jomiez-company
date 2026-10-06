import config from "@payload-config";
import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { push } from "@/cms/app/push";
import { looksMobile } from "@/cms/outreach/kinds";
import { loadOutreach } from "@/cms/outreach/settings";
import { previewLink, type PreviewContent } from "@/cms/outreach/write";

/*
 * A free sample homepage made for a business (cms/outreach/write.ts → makePreview),
 * in their colours and words, with a Jomiez ribbon on top. The first time
 * someone other than a link-preview robot opens it, the owner gets a
 * notification: that's the moment to follow up.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function leadFor(slug: string) {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "leads", where: { "preview.slug": { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  const lead = docs[0] as unknown as (Record<string, unknown> & { id: number; name: string; preview?: { content?: PreviewContent; views?: number } }) | undefined;
  if (!lead?.preview?.content || lead.status === "stopped") return null;
  return { payload, lead, content: lead.preview.content };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) return { title: "Preview" };
  const { content } = found;
  return {
    title: `${content.name}: a website preview`,
    description: content.sub,
    openGraph: { title: `${content.name}: ${content.headline}`, description: content.sub, images: content.image ? [{ url: content.image.url }] : undefined, url: previewLink(slug) },
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

const DAYS: Record<string, string> = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun", PH: "Public holidays" };
const hoursOf = (raw?: string) =>
  raw
    ?.split(/;\s*/)
    .map((part) => part.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d]).replace(/-/g, "–").replace(/,/g, ", ").replace(/\boff\b/i, "closed"))
    .filter(Boolean) ?? [];

export default async function PreviewPage({ params }: Params) {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) notFound();
  const { payload, lead, content: c } = found;
  await countView(payload, lead).catch(() => undefined);
  const s = await loadOutreach(payload);

  const phone = c.phone ?? null;
  const wa = phone && looksMobile(phone) ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;
  const tel = phone ? `tel:${phone}` : null;
  const primary = wa ?? tel ?? (c.email ? `mailto:${c.email}` : "#contact");
  const hours = hoursOf(c.hours);
  const map = `https://www.google.com/maps/search/${encodeURIComponent([c.name, c.area].filter(Boolean).join(" "))}`;
  const ownerWa = s.senderPhone ? `https://wa.me/${s.senderPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw the website preview for ${c.name} (${previewLink(slug)}). I'd like to know more.`)}` : "https://www.jomiez.com/contact";
  const stop = `/api/outreach/stop?t=${encodeURIComponent(String(lead.stopToken ?? ""))}`;
  const initials = c.name
    .split(/\s+/)
    .filter((w) => /\w/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <div className={`pv pv--${c.palette}`}>
      <aside className="pv-ribbon" aria-label="About this preview">
        <p>
          <strong>A free preview</strong> Jomiez made for {c.name}. The buttons use your own number, so you can try them.
        </p>
        <div className="pv-ribbon__actions">
          <a className="pv-ribbon__go" href={ownerWa}>
            Get this website
          </a>
          <a className="pv-ribbon__no" href={stop}>
            Not interested
          </a>
        </div>
      </aside>

      <header className="pv-head">
        <a className="pv-brand" href="#top">
          <span className="pv-brand__mark" aria-hidden="true">
            {initials}
          </span>
          {c.name}
        </a>
        <nav className="pv-nav" aria-label="Sections">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="pv-btn pv-btn--small" href={primary}>
          {c.cta}
        </a>
      </header>

      <main id="top">
        <section className="pv-hero">
          {c.image && (
            // eslint-disable-next-line @next/next/no-img-element -- a stock photo from Openverse or Pexels, shown as is
            <img className="pv-hero__img" src={c.image.url} alt="" />
          )}
          <div className="pv-hero__inner">
            {(c.kind || c.area) && <p className="pv-eyebrow">{[c.kind, c.area].filter(Boolean).join(" · ")}</p>}
            <h1>{c.headline}</h1>
            <p className="pv-hero__sub">{c.sub}</p>
            <div className="pv-hero__actions">
              <a className="pv-btn" href={primary}>
                {c.cta}
              </a>
              <a className="pv-btn pv-btn--ghost" href="#services">
                See what we do
              </a>
            </div>
          </div>
        </section>

        <ul className="pv-highlights">
          {c.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>

        <section id="services" className="pv-section">
          <h2>What we do</h2>
          <div className="pv-services">
            {c.services.map((sv) => (
              <article key={sv.title} className="pv-card">
                <h3>{sv.title}</h3>
                <p>{sv.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="pv-section pv-about">
          <h2>About {c.name}</h2>
          <p>{c.about}</p>
        </section>

        <section id="contact" className="pv-section pv-contact">
          <h2>Get in touch</h2>
          <div className="pv-contact__grid">
            <div className="pv-card">
              <h3>Talk to us</h3>
              {wa && (
                <a className="pv-btn" href={wa}>
                  Chat on WhatsApp
                </a>
              )}
              {tel && (
                <a className={wa ? "pv-btn pv-btn--ghost" : "pv-btn"} href={tel}>
                  Call {phone}
                </a>
              )}
              {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
            </div>
            <div className="pv-card">
              <h3>Find us</h3>
              <p>{(lead.address as string) || c.area || "Ask us for directions"}</p>
              <a href={map} target="_blank" rel="noopener">
                Open in Maps ↗
              </a>
              {hours.length > 0 && (
                <>
                  <h3 className="pv-hours">Opening hours</h3>
                  <ul>
                    {hours.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="pv-foot">
        <p>
          © {new Date().getFullYear()} {c.name}
        </p>
        <p className="pv-foot__small">
          Sample homepage by{" "}
          <a href="https://www.jomiez.com" target="_blank" rel="noopener">
            Jomiez
          </a>
          {c.image && (
            <>
              {" "}
              · Photo:{" "}
              <a href={c.image.page} target="_blank" rel="noopener nofollow">
                {c.image.by}
              </a>{" "}
              ({c.image.source})
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
