import Image from "next/image";
import { RichTextBody } from "@/components/cms/RichTextBody";
import { Appear, springSlow, springSoft } from "@/components/ui/Motion";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { formatDate } from "@/lib/dates";
import { img } from "@/lib/media";
import type { Article, JournalPage } from "@/payload-types";
import styles from "@/app/(site)/insights/[slug]/article.module.css";

export type ArticleViewProps = { article: Article; articles: Article[]; page: JournalPage };

export function ArticleView({ article, articles, page }: ArticleViewProps) {
  const more = articles.filter((a) => a.id !== article.id).slice(0, 3);
  const cover = img(article.image);
  const post = page.post ?? {};

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
            <span>{post.authorLabel}</span>
            <strong>{article.author}</strong>
          </div>
          <div>
            <span>{post.dateLabel}</span>
            <strong>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </strong>
          </div>
        </Appear>
      </header>

      <Appear scale={1.04} transition={springSlow} delay={0.3} className={styles.cover}>
        {cover && <Image src={cover.src} alt={cover.alt} fill priority sizes="100vw" className={styles.coverImg} />}
      </Appear>

      <RichTextBody data={article.body} className={styles.body} quoteClassName={styles.quote} listClassName={styles.list} />

      <section className={styles.more}>
        <div className={styles.moreHead}>
          {post.moreTitle && <h2>{post.moreTitle}</h2>}
          {post.cta?.label && <PixelButton href={post.cta.href}>{post.cta.label}</PixelButton>}
        </div>
        <div className={styles.moreGrid}>
          {more.map((a, i) => (
            <ArticleCard key={a.id} article={a} flip={i % 2 === 1} byLabel={post.byLabel} />
          ))}
        </div>
      </section>
    </article>
  );
}
