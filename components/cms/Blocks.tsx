import { Faq } from "@/components/sections/home/Faq";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Impact } from "@/components/sections/home/Impact";
import { Insights } from "@/components/sections/home/Insights";
import { PageHero } from "@/components/sections/PageHero";
import { Pricing } from "@/components/sections/home/Pricing";
import { Showcase } from "@/components/sections/home/Showcase";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectCard } from "@/components/work/ProjectCard";
import type { Article, Home, JournalPage, Page, Project } from "@/payload-types";
import listStyles from "@/app/(site)/services/services.module.css";
import workStyles from "@/app/(site)/work/work.module.css";
import { RichTextBody } from "./RichTextBody";
import styles from "./Blocks.module.css";

type Block = NonNullable<Page["layout"]>[number];

export type BlocksProps = { blocks: Block[]; home: Home | null; articles: Article[]; journal: JournalPage | null };

/* Which shared content a set of sections needs (so the live site only reads what it uses). */
export function blockNeeds(blocks: Block[]) {
  return {
    home: blocks.some((b) => ["faq", "tenets", "pricing"].includes(b.blockType)),
    articles: blocks.some((b) => b.blockType === "journal"),
  };
}

/* Renders a custom page's sections, in the order they were arranged in the admin. */
export function Blocks({ blocks, home, articles, journal }: BlocksProps) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = b.id ?? `${b.blockType}-${i}`;
        switch (b.blockType) {
          case "pageHero":
            return (
              <PageHero key={key} eyebrow={b.eyebrow} title={b.title} lead={b.lead} cta={b.showCta ? b.cta : null} />
            );
          case "content":
            return (
              <section key={key} className={styles.content}>
                <div className={styles.contentInner}>
                  {b.title && <h2 className={styles.contentTitle}>{b.title}</h2>}
                  <RichTextBody data={b.body} className={styles.prose} quoteClassName={styles.quote} listClassName={styles.bullets} />
                </div>
              </section>
            );
          case "imageBand":
            return <Showcase key={key} data={{ image: b.image, lead: b.lead, pill: b.pill, title: b.title }} />;
          case "list":
            return (
              <section key={key} className={listStyles.list}>
                <h2 className={listStyles.listTitle}>{b.title}</h2>
                <div className={listStyles.grid}>
                  {b.items?.map((s, n) => (
                    <Appear key={s.id ?? s.title} inView delay={(n % 3) * 0.08} transition={springFirm} className={listStyles.card}>
                      <span className={listStyles.num}>{String(n + 1).padStart(2, "0")}</span>
                      <h3 className={listStyles.cardTitle}>{s.title}</h3>
                      <p className={listStyles.cardBody}>{s.body}</p>
                    </Appear>
                  ))}
                </div>
              </section>
            );
          case "projects": {
            const items = (b.projects ?? []).filter((p): p is Project => typeof p === "object" && p !== null);
            return (
              <section key={key} className={`${workStyles.gridSection} ${styles.projects}`}>
                <div className={workStyles.groupHead}>
                  <SectionLabel>{b.label}</SectionLabel>
                </div>
                <div className={workStyles.grid}>
                  {items.map((p, n) => (
                    <Appear key={p.id} inView y={40} delay={(n % 3) * 0.08} transition={springFirm} amount={0.15}>
                      <ProjectCard project={p} />
                    </Appear>
                  ))}
                </div>
              </section>
            );
          }
          case "journal":
            return (
              <section key={key} className={styles.panelSection}>
                <div className={styles.panel}>
                  <Insights
                    data={{ enabled: true, marquee: b.title, intro: null, cta: { label: "", href: "/insights" }, count: b.count }}
                    articles={articles}
                    byLabel={journal?.post?.byLabel}
                  />
                </div>
              </section>
            );
          case "faq":
            if (b.useSiteFaq !== false && home) return <FaqPanel key={key} faq={home.faq} />;
            return (
              <section key={key} className={styles.panelSection}>
                <div className={styles.panel}>
                  <Faq label={b.custom?.label} sub={b.custom?.sub} title={b.custom?.title} items={b.custom?.items} />
                </div>
              </section>
            );
          case "cta":
            return (
              <section key={key} className={styles.cta}>
                <div className={styles.ctaPanel}>
                  <h2 className={styles.ctaTitle}>{b.title}</h2>
                  {b.text && <p className={styles.ctaText}>{b.text}</p>}
                  {b.cta?.label && (
                    <PixelButton href={b.cta.href} variant="light">
                      {b.cta.label}
                    </PixelButton>
                  )}
                </div>
              </section>
            );
          case "tenets":
            return home ? <Impact key={key} data={home.tenets} /> : null;
          case "pricing":
            return home ? <Pricing key={key} data={home.pricing} /> : null;
          default:
            return null;
        }
      })}
    </>
  );
}
