import Image from "next/image";
import Link from "next/link";
import { formatDate, type Article } from "@/content/articles";
import styles from "./ArticleCard.module.css";

/* Image tile + text tile; alternate cards flip the order, as in the template. */
export function ArticleCard({ article, flip = false }: { article: Article; flip?: boolean }) {
  return (
    <Link href={`/insights/${article.slug}`} className={`${styles.card} ${flip ? styles.flip : ""}`}>
      <div className={styles.media}>
        <Image src={article.image} alt="" fill sizes="(max-width: 809px) 100vw, 432px" className={styles.img} />
      </div>
      <div className={styles.body}>
        <div className={styles.top}>
          <p className={styles.category}>{article.category}</p>
          <h3 className={styles.title}>{article.title}</h3>
          <p className={styles.excerpt}>{article.excerpt}</p>
        </div>
        <div className={styles.foot}>
          <div>
            <p className={styles.by}>Written by</p>
            <p className={styles.author}>
              {article.author} · {formatDate(article.date)}
            </p>
          </div>
          <span className={styles.arrow} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11 11 3M5 3h6v6" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
