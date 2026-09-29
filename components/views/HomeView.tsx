import { Hero } from "@/components/sections/home/Hero";
import { Intro } from "@/components/sections/home/Intro";
import { Work } from "@/components/sections/home/Work";
import { Services } from "@/components/sections/home/Services";
import { Mission } from "@/components/sections/home/Mission";
import { Impact } from "@/components/sections/home/Impact";
import { Showcase } from "@/components/sections/home/Showcase";
import { Process } from "@/components/sections/home/Process";
import { Studio } from "@/components/sections/home/Studio";
import { Pricing } from "@/components/sections/home/Pricing";
import { Faq } from "@/components/sections/home/Faq";
import { Insights } from "@/components/sections/home/Insights";
import type { Article, Home, JournalPage, Project } from "@/payload-types";
import styles from "@/app/(site)/page.module.css";

export type HomeViewProps = { home: Home; projects: Project[]; articles: Article[]; journal: JournalPage };

/*
 * Section order and light/dark banding follow the Spartan AI template:
 * light hero → light intro → dark (work, services, mission) → light impact →
 * image band → dark (process, studio) → light pricing → panel (FAQ, insights).
 * Every section's words, images and on/off switch come from the admin's Home page.
 */
export function HomeView({ home, projects, articles, journal }: HomeViewProps) {
  const on = (section: { enabled?: boolean | null } | null | undefined) => !!section && section.enabled !== false;

  const picked = (home.work?.projects ?? []).filter((p): p is Project => typeof p === "object" && p !== null);
  const live = new Set(projects.map((p) => p.id));
  const featured = picked.length ? picked.filter((p) => live.has(p.id)) : projects.slice(0, 6);

  const firstBand = on(home.work) || on(home.services) || on(home.mission);
  const secondBand = on(home.process) || on(home.studio);
  const panel = on(home.faq) || on(home.journal);

  return (
    <>
      {on(home.hero) && <Hero data={home.hero} />}
      {on(home.intro) && <Intro data={home.intro} />}
      {firstBand && (
        <section className={`${styles.dark} ${styles.darkFirst}`}>
          {on(home.work) && <Work data={home.work} projects={featured} />}
          {on(home.services) && <Services data={home.services} />}
          {on(home.mission) && (
            <div className={styles.darkRounded}>
              <Mission data={home.mission} />
            </div>
          )}
        </section>
      )}
      {on(home.tenets) && (
        <div className={styles.onDark}>
          <Impact data={home.tenets} />
        </div>
      )}
      {on(home.showcase) && <Showcase data={home.showcase} />}
      {secondBand && (
        <section className={`${styles.dark} ${styles.darkBottom}`}>
          <div className={styles.darkInner}>
            {on(home.process) && <Process data={home.process} />}
            {on(home.studio) && <Studio data={home.studio} />}
          </div>
        </section>
      )}
      {on(home.pricing) && <Pricing data={home.pricing} />}
      {panel && (
        <section className={styles.panelSection}>
          <div className={styles.panel}>
            {on(home.faq) && <Faq {...home.faq} />}
            {on(home.journal) && <Insights data={home.journal} articles={articles} byLabel={journal.post?.byLabel} />}
          </div>
        </section>
      )}
    </>
  );
}
