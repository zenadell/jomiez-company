import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { blockNeeds } from "@/components/cms/Blocks";
import { Live } from "@/components/cms/live/Live";
import { getArticles, getGlobal, getPage, getPageSlugs, getRedirect, isPreview } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

/*
 * Every other address: a custom page built in the admin, or else a redirect
 * set up in the admin, or else the 404 page.
 */
type Params = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  return (await getPageSlugs()).map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = slug.length === 1 ? await getPage(slug[0]) : null;
  if (!page) return {};
  return pageMetadata(`/${page.slug}`, page.meta, { title: page.title });
}

export default async function CustomPage({ params }: Params) {
  const { slug } = await params;
  const path = `/${slug.map(decodeURIComponent).join("/")}`;
  const page = slug.length === 1 ? await getPage(slug[0]) : null;
  if (page) {
    // Visitors' pages read only the shared content their sections use; the
    // preview reads it all, since sections can be added while editing.
    const needs = (await isPreview()) ? { home: true, articles: true } : blockNeeds(page.layout ?? []);
    const [home, articles, journal] = await Promise.all([
      needs.home ? getGlobal("home") : null,
      needs.articles ? getArticles() : [],
      needs.articles ? getGlobal("journal-page") : null,
    ]);
    return (
      <Live view="page" doc={{ field: "page", collection: "pages", id: page.id }} props={{ page, home, articles, journal }} />
    );
  }

  const rule = await getRedirect(path);
  if (rule) {
    const to = rule.to;
    let target = to?.url ?? "";
    if (to?.type === "reference" && to.reference && typeof to.reference.value === "object") {
      const doc = to.reference.value as { slug?: string | null };
      const base = to.reference.relationTo === "projects" ? "/work/" : to.reference.relationTo === "articles" ? "/insights/" : "/";
      target = `${base}${doc.slug ?? ""}`;
    }
    if (target) {
      if (rule.type === "302") redirect(target);
      permanentRedirect(target);
    }
  }
  notFound();
}
