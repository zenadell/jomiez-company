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
import styles from "./page.module.css";

/*
 * Section order and light/dark banding follow the Spartan AI template:
 * light hero → light intro → dark (work, services, mission) → light impact →
 * image band → dark (process, studio) → light pricing → panel (FAQ, insights).
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <section className={`${styles.dark} ${styles.darkFirst}`}>
        <Work />
        <Services />
        <div className={styles.darkRounded}>
          <Mission />
        </div>
      </section>
      <div className={styles.onDark}>
        <Impact />
      </div>
      <Showcase />
      <section className={`${styles.dark} ${styles.darkBottom}`}>
        <div className={styles.darkInner}>
          <Process />
          <Studio />
        </div>
      </section>
      <Pricing />
      <section className={styles.panelSection}>
        <div className={styles.panel}>
          <Faq />
          <Insights />
        </div>
      </section>
    </>
  );
}
