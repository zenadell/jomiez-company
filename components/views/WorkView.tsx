import Image from "@/components/ui/Image";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSlow } from "@/components/ui/Motion";
import { ProjectCard } from "@/components/work/ProjectCard";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { fill, src } from "@/lib/media";
import type { Home, Project, WorkPage } from "@/payload-types";
import styles from "@/app/(site)/work/work.module.css";

export type WorkViewProps = { page: WorkPage; home: Home; projects: Project[] };

export function WorkView({ page, home, projects }: WorkViewProps) {
  const ourProducts = projects.filter((p) => p.isProduct);
  const clientWork = projects.filter((p) => !p.isProduct);
  const note = fill(page.note, { products: ourProducts.length, builds: clientWork.length });

  return (
    <>
      <section className={styles.hero}>
        <Appear scale={1.08} transition={springSlow} delay={0.1} className={styles.heroPanel}>
          <Image src={src(page.image, "/media/pricing-swirl.jpg")} alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroMarquee}>
            <BigMarquee text={page.marquee} dark />
          </div>
          {note && <p className={styles.heroNote}>{note}</p>}
        </Appear>
      </section>
      {[
        { key: "products", label: page.productsLabel, items: ourProducts },
        { key: "clients", label: page.clientsLabel, items: clientWork },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.key} className={styles.gridSection}>
            {group.label && (
              <div className={styles.groupHead}>
                <SectionLabel>{group.label}</SectionLabel>
              </div>
            )}
            <div className={styles.grid}>
              {group.items.map((p, i) => (
                <Appear key={p.id} inView y={40} delay={(i % 3) * 0.08} transition={springFirm} amount={0.15}>
                  <ProjectCard project={p} />
                </Appear>
              ))}
            </div>
          </section>
        ))}

      {page.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
