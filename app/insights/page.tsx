import type { Metadata } from "next";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSoft } from "@/components/ui/Motion";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { articles } from "@/content/articles";
import styles from "./insights.module.css";

export const metadata: Metadata = {
  title: "Insights",
  description: "Notes on software architecture, AI systems and product design from the Jomiez team.",
};

export default function InsightsPage() {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.marquee}>
          <BigMarquee text="Insights" />
        </div>
        <Appear delay={0.4} transition={springSoft}>
          <p className={styles.intro}>
            A curated collection of notes on software architecture, AI systems and product design for founders
            building what&apos;s next.
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
