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
    "The craft behind Jomiez products, turned to yours: custom software, web and mobile applications, AI development and automation, UI/UX, branding and motion design.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="The craft behind our products, turned to yours."
        lead="Custom software, websites, web and mobile applications and AI integrations, with the design around them. And once you are live, we stay to tend it: SEO, maintenance and growth."
        cta={{ label: "Start a project", href: "/contact" }}
      />
      <section className={styles.dark}>
        <Services />
        <div className={styles.processWrap}>
          <Process />
        </div>
      </section>
      <section className={styles.list}>
        <h2 className={styles.listTitle}>Every craft we practise</h2>
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
