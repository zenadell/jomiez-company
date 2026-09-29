import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Services } from "@/components/sections/home/Services";
import { Process } from "@/components/sections/home/Process";
import { Appear, springFirm } from "@/components/ui/Motion";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";
import styles from "./services.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("services-page");
  return pageMetadata(page.meta, { title: "Services", description: page.hero.lead });
}

export default async function ServicesPage() {
  const [page, home] = await Promise.all([getGlobal("services-page"), getGlobal("home")]);
  const accordion = page.showAccordion !== false;
  const process = page.showProcess !== false;

  return (
    <>
      <PageHero eyebrow={page.hero.eyebrow} title={page.hero.title} lead={page.hero.lead} cta={page.hero.cta} />
      {(accordion || process) && (
        <section className={styles.dark}>
          {accordion && <Services data={home.services} />}
          {process && (
            <div className={styles.processWrap}>
              <Process data={home.process} />
            </div>
          )}
        </section>
      )}
      {page.list?.enabled !== false && (
        <section className={styles.list}>
          <h2 className={styles.listTitle}>{page.list?.title}</h2>
          <div className={styles.grid}>
            {page.list?.items?.map((s, i) => (
              <Appear key={s.id ?? s.title} inView delay={(i % 3) * 0.08} transition={springFirm} className={styles.card}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.cardBody}>{s.body}</p>
              </Appear>
            ))}
          </div>
        </section>
      )}
      {page.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
