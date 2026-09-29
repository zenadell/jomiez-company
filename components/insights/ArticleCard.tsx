import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/dates";
import { img } from "@/lib/media";
import type { Article } from "@/payload-types";
import styles from "./ArticleCard.module.css";

/* Image tile + text tile; alternate cards flip the order, as in the template. */
export function ArticleCard({ article, flip = false, byLabel }: { article: Article; flip?: boolean; byLabel?: string | null }) {
  const cover = img(article.image);
  return (
    <Link href={`/insights/${article.slug}`} className={`${styles.card} ${flip ? styles.flip : ""}`}>
      <div className={styles.media}>
        {cover && <Image src={cover.src} alt="" fill sizes="(max-width: 809px) 100vw, 432px" className={styles.img} />}
      </div>
      <div className={styles.body}>
        <div className={styles.top}>
          <p className={styles.category}>{article.category}</p>
          <h3 className={styles.title}>{article.title}</h3>
          <p className={styles.excerpt}>{article.excerpt}</p>
        </div>
        <div className={styles.foot}>
          <div>
            <p className={styles.by}>{byLabel ?? "Written by"}</p>
            <p className={styles.author}>
              {article.author} · {formatDate(article.date)}
            </p>
          </div>
          <span className={styles.arrow} aria-hidden="true">
            <Icon name="arrowRight" size={18} className={styles.arrowIcon} />
          </span>
        </div>
      </div>
    </Link>
  );
}
