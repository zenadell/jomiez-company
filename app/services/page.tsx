import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Services } from "@/components/sections/home/Services";
import { Process } from "@/components/sections/home/Process";
import { Appear, springFirm } from "@/components/ui/Motion";
import { services } from "@/content/services";
import styles from "./services.module.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom software, web and mobile applications, AI development and automation, UI/UX, branding and motion design from Jomiez Innovation.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="From first idea to production software, with design and AI built in."
        lead="We build custom software, websites, web and mobile applications and AI integrations, plus the design work around them. We also handle SEO and ongoing maintenance once you are live."
        cta={{ label: "Start a project", href: "/contact" }}
      />
      <section className={styles.dark}>
        <Services />
        <div className={styles.processWrap}>
          <Process />
        </div>
      </section>
      <section className={styles.list}>
        <h2 className={styles.listTitle}>Everything we do</h2>
        <div className={styles.grid}>
          {services.map((s, i) => (
            <Appear key={s.slug} inView delay={(i % 3) * 0.08} transition={springFirm} className={styles.card}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardBody}>{s.body}</p>
            </Appear>
          ))}
        </div>
      </section>
      <FaqPanel />
    </>
  );
}
