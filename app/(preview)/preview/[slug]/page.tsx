import { createHash } from "node:crypto";
import config from "@payload-config";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import type { CSSProperties, ReactNode } from "react";
import { push } from "@/cms/app/push";
import { hoursLines, parseHours } from "@/cms/outreach/hours";
import { looksMobile } from "@/cms/outreach/kinds";
import { readPreview } from "@/cms/outreach/preview-content";
import { loadOutreach } from "@/cms/outreach/settings";
import { previewLink, type PreviewContent } from "@/cms/outreach/write";
import { mapRoute } from "@/cms/outreach/map";
import { Header, OpenNow, Reveal, Ribbon, ScrollWords, StickyBar } from "@/components/preview/PreviewBits";

/*
 * A free sample homepage made for a business (cms/outreach/write.ts →
 * makePreview): their logo, photos, products and prices, colours, hours and
 * map, in one of three looks, with a Jomiez ribbon on top. Every button uses
 * their own number. Each photo appears once. The first time someone other than
 * a link-preview robot opens it, the owner gets a notification: that's the
 * moment to follow up.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function leadFor(slug: string) {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "leads", where: { "preview.slug": { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  const lead = docs[0] as unknown as (Record<string, unknown> & { id: number; name: string; preview?: { content?: unknown; views?: number } }) | undefined;
  const content = readPreview(lead?.preview?.content);
  if (!lead || !content || lead.status === "stopped") return null;
  return { payload, lead, content };
}

const heroOf = (c: PreviewContent) => c.brand.photos[0] ?? c.stock[0];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) return { title: "Preview" };
  const { content } = found;
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

/* ---------- Colours ---------- */

const PALETTE: Record<PreviewContent["palette"], [string, string]> = {
  ember: ["#e4572e", "#ffb347"],
  forest: ["#1f7a4d", "#b8e09a"],
  ocean: ["#1b6ca8", "#8fd3fe"],
  berry: ["#b0306a", "#ffb3d1"],
  sand: ["#a56f14", "#f1d9a6"],
  slate: ["#334155", "#94a3b8"],
};

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

const TZ: Record<string, string> = { NG: "Africa/Lagos", GH: "Africa/Accra", KE: "Africa/Nairobi", ZA: "Africa/Johannesburg", GB: "Europe/London", IE: "Europe/Dublin" };

/* ---------- Small pieces ---------- */

function Headline({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.toLowerCase().indexOf(accent.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em>{text.slice(at, at + accent.length)}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const PHONE = "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z";
const CHAT = "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.5 8.5 0 1 1 21 11.5z";
const PIN = "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";
const MAIL = "M4 5h16v14H4zM4 6l8 7 8-7";
const ARROW = "M5 12h14M13 6l6 6-6 6";

function socialLinks(raw?: string | null) {
  return (raw ?? "")
    .split(/\s+/)
    .filter((s) => /^https?:\/\//.test(s))
    .map((href) => ({ href, label: /instagram/.test(href) ? "Instagram" : /facebook|fb\./.test(href) ? "Facebook" : /tiktok/.test(href) ? "TikTok" : /x\.com|twitter/.test(href) ? "X" : "Page" }));
}

const external = (href: string) => (/^https?:/.test(href) ? { target: "_blank", rel: "noopener" } : {});

function Btn({ href, children, ghost }: { href: string; children: ReactNode; ghost?: boolean }) {
  return (
    <a className={`pv-btn${ghost ? " pv-btn--ghost" : ""}`} href={href} {...external(href)}>
      {children}
    </a>
  );
}

/** The address, followed by only the parts of the area it doesn't already say. */
function whereOf(address?: string, area?: string) {
  if (!address) return area ?? "";
  const has = address.toLowerCase();
  const missing = (area ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !has.includes(p.toLowerCase()));
  return [address, ...missing].join(", ");
}

/** The middle value of a few numbers (for a product grid's one shape). */
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 1;

/* ---------- The page ---------- */

export default async function PreviewPage({ params }: Params) {
  const { slug } = await params;
  const found = await leadFor(slug);
  if (!found) notFound();
  const { payload, lead, content: c } = found;
  await countView(payload, lead).catch(() => undefined);
  const s = await loadOutreach(payload);

  const [fallback, fallback2] = PALETTE[c.palette] ?? PALETTE.ember;
  const accent = c.brand.colours[0] ?? fallback;
  const accent2 = c.brand.colours[1] ?? fallback2;
  const vars = { "--accent": accent, "--accent-2": accent2, "--accent-ink": lum(accent) > 0.45 ? "#14110f" : "#ffffff" } as CSSProperties;

  // Their photos, each used once: the hero, one beside the services, a row to swipe, one beside "About".
  const photos = c.brand.photos.length >= 2 ? c.brand.photos : [...c.brand.photos, ...c.stock];
  const hero = photos[0];
  const rest = photos.slice(1);
  const aboutImg = rest.length >= 2 ? rest[rest.length - 1] : rest[0];
  const spare = rest.filter((p) => p !== aboutImg);
  const servicesImg = spare.length >= 1 ? spare[0] : undefined;
  const gallery = spare.slice(1);
  const products = c.brand.products.slice(0, 8);
  const shape = Math.min(1.25, Math.max(0.75, median(products.map((p) => p.w / Math.max(1, p.h)))));

  const phone = c.phone ?? null;
  const wa = phone && looksMobile(phone) ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const mail = c.email ? `mailto:${c.email}` : null;
  const primary = wa ?? tel ?? mail ?? "#visit";
  // The button's words must match where it goes (a model may write "Chat on WhatsApp" for a landline).
  const cta = !wa && /whatsapp/i.test(c.cta) ? (tel ? "Call us" : mail ? "Email us" : "Find us") : c.cta;
  const ask = (what: string) => (wa ? `${wa}?text=${encodeURIComponent(`Hello ${c.name}, I saw ${what} on your website. Is it available?`)}` : tel);

  const coords = c.brand.coords;
  const map = c.brand.map?.url ?? (coords ? mapRoute(coords.lat, coords.lon) : null);
  const where = whereOf(c.address, c.area);
  const directions = coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.name, where].filter(Boolean).join(", "))}`;
  const week = parseHours(c.hours);
  const tz = TZ[c.country ?? ""];
  const socials = socialLinks(c.socials);
  const ownerWa = s.senderPhone ? `https://wa.me/${s.senderPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw the website preview for ${c.name} (${previewLink(slug)}). I'd like to know more.`)}` : "https://www.jomiez.com/contact";
  const stop = `/api/outreach/stop?t=${encodeURIComponent(String(lead.stopToken ?? ""))}`;
  const initials = c.name
    .split(/\s+/)
    .filter((w) => /\w/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const credits = c.stock.filter((p) => photos.includes(p));
  const featured = products.find((p) => p.title && p.price) ?? products[0];

  return (
    <div className={`pv pv--${c.style}`} style={vars}>
      <Ribbon>
        <p>
          <strong>A free preview</strong>
          <span className="pv-ribbon__long"> Jomiez made for {c.name}. Every button works, using your own number.</span>
          <span className="pv-ribbon__short"> made for you by Jomiez</span>
        </p>
        <div className="pv-ribbon__actions">
          <a className="pv-ribbon__go" href={ownerWa}>
            Get this website
          </a>
          <a className="pv-ribbon__no" href={stop}>
            Not interested
          </a>
        </div>
      </Ribbon>

      <Header>
        <a className="pv-brand" href="#top" aria-label={c.name}>
          {c.brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- their own logo
            <img className="pv-brand__logo" src={c.brand.logo.url} alt={c.name} />
          ) : (
            <>
              <span className="pv-brand__mark" aria-hidden="true">
                {initials}
              </span>
              <span className="pv-brand__name">{c.name}</span>
            </>
          )}
        </a>
        <nav className="pv-nav" aria-label="Sections">
          <a href="#what">{products.length >= 3 ? "Collection" : "What we do"}</a>
          <a href="#about">About</a>
          <a href="#visit">Visit</a>
        </nav>
        <a className="pv-btn pv-btn--small" href={primary} {...external(primary)}>
          {wa ? <Icon d={CHAT} size={16} /> : <Icon d={PHONE} size={16} />}
          <span>{wa ? "WhatsApp" : tel ? "Call" : "Contact"}</span>
        </a>
      </Header>

      <main id="top">
        {/* ----- Hero ----- */}
        <section className={`pv-hero${hero ? "" : " is-plain"}`}>
          {hero && (
            <div className="pv-hero__media">
              {/* eslint-disable-next-line @next/next/no-img-element -- their photo, or a credited stock photo */}
              <img src={hero.url} alt={hero.alt ?? ""} fetchPriority="high" />
            </div>
          )}
          <div className="pv-hero__shade" aria-hidden="true" />
          <div className="pv-hero__inner">
            <div className="pv-hero__chips">
              {c.eyebrow && <span className="pv-chip">{c.eyebrow}</span>}
              {week && tz && <OpenNow week={week} tz={tz} />}
            </div>
            <h1 className="pv-display pv-hero__title">
              <Headline text={c.headline} accent={c.headlineAccent} />
            </h1>
            <div className="pv-hero__foot">
              <div>
                <p className="pv-hero__sub">{c.sub}</p>
                <div className="pv-actions">
                  <Btn href={primary}>
                    {cta}
                    <Icon d={ARROW} size={18} />
                  </Btn>
                  <Btn href="#visit" ghost>
                    Find us
                  </Btn>
                </div>
              </div>
              {featured && products.length >= 3 && (
                <a className="pv-feature" href="#what">
                  {/* eslint-disable-next-line @next/next/no-img-element -- their product photo */}
                  <img src={featured.url} alt="" />
                  <span>
                    <small>In the showroom</small>
                    {featured.title && <b>{featured.title}</b>}
                    {featured.price && <em>{featured.price}</em>}
                  </span>
                  <Icon d={ARROW} size={16} />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ----- Moving band ----- */}
        {c.marquee.length > 0 && (
          <div className="pv-marquee" aria-hidden="true">
            <div className="pv-marquee__track">
              {[...c.marquee, ...c.marquee, ...c.marquee, ...c.marquee].map((w, i) => (
                <span key={i}>
                  {w}
                  <i>✦</i>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ----- Statement ----- */}
        <section className="pv-section pv-statement">
          <Reveal as="p" className="pv-eyebrow">
            {c.name}
          </Reveal>
          <ScrollWords className="pv-display pv-statement__text" text={c.statement} />
        </section>

        {/* ----- Their products, with their names and prices ----- */}
        {products.length >= 3 && (
          <section className="pv-section pv-collection" id="what">
            <Reveal className="pv-section__head pv-section__head--row">
              <div>
                <p className="pv-eyebrow">From the showroom</p>
                <h2 className="pv-display pv-h2">
                  A look at what&apos;s <em>in store</em>
                </h2>
              </div>
              {wa && (
                <a className="pv-link" href={`${wa}?text=${encodeURIComponent(`Hello ${c.name}, I'd like to see more of your collection.`)}`} target="_blank" rel="noopener">
                  See more on WhatsApp <Icon d={ARROW} size={16} />
                </a>
              )}
            </Reveal>
            <div className="pv-products" style={{ "--shape": shape } as CSSProperties}>
              {products.map((p, i) => {
                const link = ask(p.title ? `the ${p.title}${p.price ? ` (${p.price})` : ""}` : "one of your pieces");
                return (
                  <Reveal key={p.url} className="pv-product" style={{ "--i": i % 4 } as CSSProperties}>
                    <div className="pv-product__img">
                      {/* eslint-disable-next-line @next/next/no-img-element -- their product photo */}
                      <img src={p.url} alt={p.alt ?? p.title ?? ""} loading="lazy" />
                      {link && (
                        <a className="pv-product__ask" href={link} {...external(link)}>
                          {wa ? "Ask about this" : "Call about this"}
                        </a>
                      )}
                    </div>
                    {(p.title || p.price) && (
                      <p className="pv-product__cap">
                        {p.title && <span>{p.title}</span>}
                        {p.price && <strong>{p.price}</strong>}
                      </p>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* ----- Services ----- */}
        <section className={`pv-section pv-offer${servicesImg ? " has-img" : ""}`} id={products.length >= 3 ? "services" : "what"}>
          {servicesImg && (
            <Reveal className="pv-offer__media">
              {/* eslint-disable-next-line @next/next/no-img-element -- their photo */}
              <img src={servicesImg.url} alt={servicesImg.alt ?? ""} loading="lazy" />
            </Reveal>
          )}
          <div className="pv-offer__body">
            <Reveal className="pv-section__head">
              <p className="pv-eyebrow">{products.length >= 3 ? "What we do" : "What we offer"}</p>
              <h2 className="pv-display pv-h2">
                {c.services.length} ways we can <em>help</em>
              </h2>
            </Reveal>
            <ol className="pv-services">
              {c.services.map((sv, i) => (
                <Reveal as="div" key={sv.title} className="pv-service" style={{ "--i": i } as CSSProperties}>
                  <span className="pv-service__n">{String(i + 1).padStart(2, "0")}</span>
                  <div className="pv-service__body">
                    <h3>{sv.title}</h3>
                    <p>{sv.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ----- Gallery ----- */}
        {gallery.length >= 2 && (
          <section className="pv-gallery" aria-label="Photos">
            <div className="pv-gallery__track">
              {gallery.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- their photos
                <img key={p.url} src={p.url} alt={p.alt ?? ""} loading="lazy" className={i % 2 ? "is-wide" : ""} />
              ))}
            </div>
          </section>
        )}

        {/* ----- Why us ----- */}
        {c.highlights.length > 0 && (
          <section className="pv-band">
            <div className="pv-section">
              <Reveal className="pv-section__head">
                <p className="pv-eyebrow">Why people choose us</p>
              </Reveal>
              <div className="pv-highlights">
                {c.highlights.map((h, i) => (
                  <Reveal key={h.title} className="pv-highlight" style={{ "--i": i } as CSSProperties}>
                    <span className="pv-display pv-highlight__n">{String(i + 1).padStart(2, "0")}</span>
                    <h3>{h.title}</h3>
                    {h.text && <p>{h.text}</p>}
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ----- About ----- */}
        <section className={`pv-section pv-about${aboutImg ? "" : " is-text"}`} id="about">
          <Reveal className="pv-about__text">
            <p className="pv-eyebrow">About us</p>
            <h2 className="pv-display pv-h2">{c.name}</h2>
            <p>{c.about}</p>
          </Reveal>
          {aboutImg && (
            <Reveal className="pv-about__media">
              {/* eslint-disable-next-line @next/next/no-img-element -- their photo */}
              <img src={aboutImg.url} alt={aboutImg.alt ?? ""} loading="lazy" />
            </Reveal>
          )}
        </section>

        {/* ----- Visit ----- */}
        <section className="pv-section pv-visit" id="visit">
          <Reveal className="pv-section__head">
            <p className="pv-eyebrow">Visit</p>
            <h2 className="pv-display pv-h2">
              Come and <em>see us</em>
            </h2>
          </Reveal>
          <Reveal className={`pv-visit__wrap${map ? " has-map" : ""}`}>
            {map && (
              <a className="pv-map" href={directions} target="_blank" rel="noopener" aria-label={`Directions to ${c.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a map picture made for this preview */}
                <img src={map} alt="" loading="lazy" />
                <span className="pv-pin" aria-hidden="true">
                  <Icon d={PIN} size={22} />
                </span>
                <small>© OpenStreetMap</small>
              </a>
            )}
            <div className="pv-visit__card">
              {where && <p className="pv-display pv-visit__where">{where}</p>}
              {week && (
                <ul className="pv-hours">
                  {hoursLines(week).map((l) => (
                    <li key={l.days}>
                      <span>{l.days}</span>
                      <span>{l.hours}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="pv-visit__actions">
                <Btn href={directions}>
                  <Icon d={PIN} /> Directions
                </Btn>
                {wa && (
                  <Btn href={wa} ghost>
                    <Icon d={CHAT} /> WhatsApp
                  </Btn>
                )}
                {tel && (
                  <Btn href={tel} ghost>
                    <Icon d={PHONE} /> Call
                  </Btn>
                )}
                {mail && (
                  <Btn href={mail} ghost>
                    <Icon d={MAIL} /> Email
                  </Btn>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ----- Closing ----- */}
        <section className="pv-closing">
          <Reveal className="pv-closing__inner">
            <h2 className="pv-display">{c.closing}</h2>
            <div className="pv-actions">
              <a className="pv-btn pv-btn--invert" href={primary} {...external(primary)}>
                {cta}
                <Icon d={ARROW} size={18} />
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="pv-foot">
        <div className="pv-foot__cols">
          <div>
            {c.brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- their own logo
              <img className="pv-brand__logo" src={c.brand.logo.url} alt={c.name} />
            ) : (
              <span className="pv-brand__mark" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>
          {where && (
            <div>
              <h4>Visit</h4>
              <p>{where}</p>
            </div>
          )}
          {(phone || c.email) && (
            <div>
              <h4>Talk to us</h4>
              {phone && (
                <p>
                  <a href={tel ?? "#"}>{phone}</a>
                </p>
              )}
              {c.email && (
                <p>
                  <a href={mail ?? "#"}>{c.email}</a>
                </p>
              )}
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <h4>Follow</h4>
              {socials.map((l) => (
                <p key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener">
                    {l.label}
                  </a>
                </p>
              ))}
            </div>
          )}
        </div>
        <p className="pv-display pv-foot__name" aria-hidden="true" style={{ "--len": Math.max(6, c.name.length) } as CSSProperties}>
          {c.name}
        </p>
        <div className="pv-foot__base">
          <span>
            © {new Date().getFullYear()} {c.name}
          </span>
          <span>
            Sample homepage by{" "}
            <a href="https://www.jomiez.com" target="_blank" rel="noopener">
              Jomiez
            </a>
            {credits.length > 0 && (
              <>
                {" · Photos: "}
                {credits.map((p, i) => (
                  <span key={p.url}>
                    {i > 0 && ", "}
                    <a href={p.page} target="_blank" rel="noopener nofollow">
                      {p.by}
                    </a>{" "}
                    ({p.source})
                  </span>
                ))}
              </>
            )}
          </span>
        </div>
      </footer>

      <StickyBar>
        {tel && (
          <a href={tel}>
            <Icon d={PHONE} />
            Call
          </a>
        )}
        {wa && (
          <a href={wa} className="is-main" target="_blank" rel="noopener">
            <Icon d={CHAT} />
            WhatsApp
          </a>
        )}
        <a href={directions} target="_blank" rel="noopener">
          <Icon d={PIN} />
          Directions
        </a>
      </StickyBar>
    </div>
  );
}
