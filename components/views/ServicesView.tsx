import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Services } from "@/components/sections/home/Services";
import { Process } from "@/components/sections/home/Process";
import { Appear, springFirm } from "@/components/ui/Motion";
import type { Home, ServicesPage } from "@/payload-types";
import styles from "@/app/(site)/services/services.module.css";

export type ServicesViewProps = { page: ServicesPage; home: Home };

export function ServicesView({ page, home }: ServicesViewProps) {
  const accordion = page.showAccordion !== false;
  const process = page.showProcess !== false;
  return (
    <>
      <PageHero eyebrow={page.hero?.eyebrow} title={page.hero?.title} lead={page.hero?.lead} cta={page.hero?.cta} />
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
              <Appear key={s.id ?? `${i}`} inView delay={(i % 3) * 0.08} transition={springFirm} className={styles.card}>
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
