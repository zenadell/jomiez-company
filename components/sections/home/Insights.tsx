import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { articles } from "@/content/articles";
import styles from "./Insights.module.css";

export function Insights() {
  return (
    <div className={styles.wrap}>
      <div className={styles.marquee}>
        <BigMarquee text="Insights" />
      </div>
      <div className={styles.introRow}>
        <span />
        <Appear inView transition={springFirm} className={styles.intro}>
          <p className={styles.introText}>
            Notes on software architecture, AI systems and product design from the team building them.
          </p>
          <PixelButton href="/insights">All articles</PixelButton>
        </Appear>
      </div>
      <div className={styles.grid}>
        {articles.map((a, i) => (
          <Appear key={a.slug} inView delay={i * 0.08} transition={springFirm}>
            <ArticleCard article={a} flip={i % 2 === 1} />
          </Appear>
        ))}
      </div>
    </div>
  );
}
