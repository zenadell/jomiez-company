import type { Metadata } from "next";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSoft } from "@/components/ui/Motion";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { articles } from "@/content/articles";
import styles from "./insights.module.css";

export const metadata: Metadata = {
  title: "Journal",
  description: "Field notes from the Jomiez workshop on software architecture, AI systems and product design.",
};

export default function InsightsPage() {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.marquee}>
          <BigMarquee text="Journal" />
        </div>
        <Appear delay={0.4} transition={springSoft}>
          <p className={styles.intro}>
            Field notes from the workshop: on architecture, AI and the craft of building software that lasts.
          </p>
        </Appear>
        <div className={styles.grid}>
          {sorted.map((a, i) => (
            <Appear key={a.slug} inView delay={i * 0.08} transition={springFirm}>
              <ArticleCard article={a} flip={i % 2 === 1} />
            </Appear>
          ))}
        </div>
      </div>
    </section>
  );
}
