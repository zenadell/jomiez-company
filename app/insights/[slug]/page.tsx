import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Appear, springSlow, springSoft } from "@/components/ui/Motion";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { articles, formatDate, getArticle, type Block } from "@/content/articles";
import styles from "./article.module.css";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: { type: "article", images: [{ url: article.image }] },
  };
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "p":
      return <p key={i}>{block.text}</p>;
    case "quote":
      return (
        <blockquote key={i} className={styles.quote}>
          {block.text}
        </blockquote>
      );
    case "h3":
      return <h2 key={i}>{block.text}</h2>;
    case "h4":
      return <h3 key={i}>{block.text}</h3>;
    case "list":
      return (
        <ul key={i} className={styles.list}>
          {block.items.map((it) => (
            <li key={it.title}>
              <strong>{it.title}:</strong> {it.text}
            </li>
          ))}
        </ul>
      );
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const more = articles.filter((a) => a.slug !== slug);

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Appear delay={0.4} transition={springSoft}>
          <p className={styles.category}>{article.category}</p>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.excerpt}>{article.excerpt}</p>
        </Appear>
        <Appear delay={0.55} transition={springSoft} className={styles.meta}>
          <div>
            <span>Author</span>
            <strong>{article.author}</strong>
          </div>
          <div>
            <span>Published</span>
            <strong>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </strong>
          </div>
        </Appear>
      </header>

      <Appear scale={1.04} transition={springSlow} delay={0.3} className={styles.cover}>
        <Image src={article.image} alt="" fill priority sizes="100vw" className={styles.coverImg} />
      </Appear>

      <div className={styles.body}>{article.body.map(renderBlock)}</div>

      <section className={styles.more}>
        <div className={styles.moreHead}>
          <h2>More insights</h2>
          <PixelButton href="/contact">Work with Jomiez</PixelButton>
        </div>
        <div className={styles.moreGrid}>
          {more.map((a, i) => (
            <ArticleCard key={a.slug} article={a} flip={i % 2 === 1} />
          ))}
        </div>
      </section>
    </article>
  );
}
