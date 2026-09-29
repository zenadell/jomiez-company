import type { Metadata } from "next";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSoft } from "@/components/ui/Motion";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { getArticles, getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";
import styles from "./insights.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("journal-page");
  return pageMetadata(page.meta, { title: "Journal", description: page.intro });
}

export default async function InsightsPage() {
  const [page, articles] = await Promise.all([getGlobal("journal-page"), getArticles()]);
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.marquee}>
          <BigMarquee text={page.marquee} />
        </div>
        {page.intro && (
          <Appear delay={0.4} transition={springSoft}>
            <p className={styles.intro}>{page.intro}</p>
          </Appear>
        )}
        <div className={styles.grid}>
          {articles.map((a, i) => (
            <Appear key={a.id} inView delay={i * 0.08} transition={springFirm}>
              <ArticleCard article={a} flip={i % 2 === 1} byLabel={page.post?.byLabel} />
            </Appear>
          ))}
        </div>
      </div>
    </section>
  );
}
