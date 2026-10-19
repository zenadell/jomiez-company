import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Live } from "@/components/cms/live/Live";
import { getArticle, getArticles, getGlobal } from "@/lib/cms";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { blogPosting, breadcrumbs } from "@/lib/structured-data";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.filter((a) => a.slug).map((a) => ({ slug: a.slug as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  const meta = await pageMetadata(`/insights/${article.slug}`, article.meta, { title: article.title, description: article.excerpt, image: article.image });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: article.date, modifiedTime: article.updatedAt, authors: article.author ? [article.author] : undefined, section: article.category || undefined } };
}

/* A journal post (components/views/ArticleView.tsx). */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, articles, page, site] = await Promise.all([getArticle(slug), getArticles(), getGlobal("journal-page"), getGlobal("site")]);
  if (!article) notFound();
  return (
    <>
      <JsonLd things={[blogPosting(site, article), breadcrumbs(site, [{ name: "Journal", path: "/insights" }, { name: article.title, path: `/insights/${article.slug}` }])]} />
      <Live
      view="article"
      doc={{ field: "article", collection: "articles", id: article.id }}
      props={{ article, articles, page }}
      />
    </>
  );
}
