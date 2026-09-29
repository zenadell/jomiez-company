import type { Metadata } from "next";
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
import { getArticles, getGlobal, getProjects } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";
import type { Project } from "@/payload-types";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getGlobal("home");
  return pageMetadata(home.meta);
}

/*
 * Section order and light/dark banding follow the Spartan AI template:
 * light hero → light intro → dark (work, services, mission) → light impact →
 * image band → dark (process, studio) → light pricing → panel (FAQ, insights).
 * Every section's words, images and on/off switch come from the admin's Home page.
 */
export default async function HomePage() {
  const [home, allProjects, articles, journal] = await Promise.all([
    getGlobal("home"),
    getProjects(),
    getArticles(),
    getGlobal("journal-page"),
  ]);
  const on = (section: { enabled?: boolean | null }) => section.enabled !== false;

  const picked = (home.work.projects ?? []).filter((p): p is Project => typeof p === "object" && p !== null);
  const live = new Set(allProjects.map((p) => p.id));
  const featured = picked.length ? picked.filter((p) => live.has(p.id)) : allProjects.slice(0, 6);

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
