import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ArticleCard } from "@/components/insights/ArticleCard";
import type { Article, Home } from "@/payload-types";
import styles from "./Insights.module.css";

export function Insights({ data, articles, byLabel }: { data: Home["journal"]; articles: Article[]; byLabel?: string | null }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.marquee}>
        <BigMarquee text={data.marquee} onPanel />
      </div>
      <div className={styles.introRow}>
        <span />
        <Appear inView transition={springFirm} className={styles.intro}>
          {data.intro && <p className={styles.introText}>{data.intro}</p>}
          {data.cta?.label && <PixelButton href={data.cta.href}>{data.cta.label}</PixelButton>}
        </Appear>
      </div>
      <div className={styles.grid}>
        {articles.slice(0, data.count ?? 3).map((a, i) => (
          <Appear key={a.id} inView delay={i * 0.08} transition={springFirm}>
            <ArticleCard article={a} flip={i % 2 === 1} byLabel={byLabel} />
          </Appear>
        ))}
      </div>
    </div>
  );
}
