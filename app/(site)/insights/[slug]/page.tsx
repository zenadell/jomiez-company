import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Live } from "@/components/cms/live/Live";
import { getArticle, getArticles, getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.filter((a) => a.slug).map((a) => ({ slug: a.slug as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  const meta = pageMetadata(`/insights/${article.slug}`, article.meta, { title: article.title, description: article.excerpt, image: article.image });
  return { ...meta, openGraph: { type: "article", ...meta.openGraph } };
}

/* A journal post (components/views/ArticleView.tsx). */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, articles, page] = await Promise.all([getArticle(slug), getArticles(), getGlobal("journal-page")]);
  if (!article) notFound();
  return (
    <Live
      view="article"
      doc={{ field: "article", collection: "articles", id: article.id }}
      props={{ article, articles, page }}
    />
  );
}
