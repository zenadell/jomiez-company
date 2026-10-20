import type { Article, Project, Site } from "@/payload-types";
import { img, plain } from "./media";

/*
 * Structured data (schema.org JSON-LD): the facts about Jomiez, its pages,
 * products and posts in the form search engines and AI assistants read, so they
 * can say who Jomiez is, what it makes and who wrote what. Everything comes
 * from the admin (Site settings, products, journal posts); nothing is invented
 * here, and an empty field is left out rather than guessed.
 */

type Thing = Record<string, unknown>;

const base = (site: Site) => site.url.replace(/\/$/, "");
export const absolute = (site: Site, path: string) => (/^https?:\/\//.test(path) ? path : `${base(site)}${path.startsWith("/") ? "" : "/"}${path}`);
const orgId = (site: Site) => `${base(site)}/#organization`;

/** Drops empty values so nothing reads as a fact that isn't one. */
function clean<T extends Thing>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length))) as T;
}

export function organization(site: Site): Thing {
  const logo = absolute(site, "/icon.png");
  const og = img(site.ogImage);
  const founder = site.founder?.name
    ? clean({ "@type": "Person", name: site.founder.name, alternateName: site.founder.alias || undefined, jobTitle: site.founder.role || undefined })
    : undefined;
  return clean({
    "@type": "Organization",
    "@id": orgId(site),
    name: site.name,
    legalName: site.legalName !== site.name ? site.legalName : undefined,
    url: `${base(site)}/`,
    logo: { "@type": "ImageObject", url: logo },
    image: og ? absolute(site, plain(og.src)) : undefined,
    description: site.description,
    email: site.email,
    telephone: site.phone || undefined,
    location: site.location || undefined,
    founder,
    sameAs: (site.socials ?? []).map((s) => s.href).filter((h) => /^https?:\/\//.test(h) && !/wa\.me|whatsapp\.com/.test(h)),
  });
}

export function website(site: Site): Thing {
  return { "@type": "WebSite", "@id": `${base(site)}/#website`, url: `${base(site)}/`, name: site.name, inLanguage: "en", publisher: { "@id": orgId(site) } };
}

/** "Home › Journal › This post": the page's place in the site. */
export function breadcrumbs(site: Site, trail: { name: string; path: string }[]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absolute(site, t.path) })),
  };
}

export function blogPosting(site: Site, a: Article): Thing {
  const image = img(a.image);
  const url = absolute(site, `/insights/${a.slug}`);
  return clean({
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: a.title.slice(0, 110),
    description: a.meta?.description || a.excerpt,
    image: image ? absolute(site, plain(image.src)) : undefined,
    datePublished: a.date,
    dateModified: a.updatedAt,
    author: a.author ? { "@type": "Person", name: a.author } : { "@id": orgId(site) },
    publisher: { "@id": orgId(site) },
    articleSection: a.category || undefined,
    mainEntityOfPage: url,
    inLanguage: "en",
  });
}

/** One of our own products (software), or a project built for a client. */
export function project(site: Site, p: Project): Thing {
  const image = img(p.image);
  const url = absolute(site, `/work/${p.slug}`);
  const common = {
    "@id": `${url}#work`,
    name: p.name,
    description: p.meta?.description || p.summary,
    image: image ? absolute(site, plain(image.src)) : undefined,
    url,
  };
  if (p.isProduct) return clean({ "@type": "SoftwareApplication", ...common, applicationCategory: p.category || undefined, publisher: { "@id": orgId(site) }, creator: { "@id": orgId(site) } });
  return clean({ "@type": "CreativeWork", ...common, genre: p.category || undefined, dateCreated: p.year || undefined, creator: { "@id": orgId(site) } });
}

/** Questions and answers shown on the page, word for word. */
export function faqPage(items: { question: string; answer: string }[]): Thing | null {
  const qa = items.filter((q) => q.question?.trim() && q.answer?.trim());
  if (!qa.length) return null;
  return { "@type": "FAQPage", mainEntity: qa.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer } })) };
}

/** The JSON for a <script type="application/ld+json">: "<" escaped so text from the admin can't close the tag. */
export function jsonLd(things: (Thing | null | undefined)[]): string {
  const graph = things.filter(Boolean);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
