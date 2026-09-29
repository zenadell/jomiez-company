import type { Metadata } from "next";
import Image from "next/image";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSlow } from "@/components/ui/Motion";
import { ProjectCard } from "@/components/work/ProjectCard";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { clientWork, ourProducts } from "@/content/projects";
import styles from "./work.module.css";

export const metadata: Metadata = {
  title: "Products & Work",
  description: "Jomiez products, like Chaka AI and Chaka WAP, and the software we have grown for businesses: SaaS, creative platforms and e-commerce.",
};

export default function WorkPage() {
  return (
    <>
      <section className={styles.hero}>
        <Appear scale={1.08} transition={springSlow} delay={0.1} className={styles.heroPanel}>
          <Image src="/media/pricing-swirl.jpg" alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroMarquee}>
            <BigMarquee text="Creations" dark />
          </div>
          <p className={styles.heroNote}>
            {ourProducts.length} products of our own and {clientWork.length} builds grown for businesses, across AI,
            automation, web platforms and e-commerce.
          </p>
        </Appear>
      </section>
      {[
        { label: "Our products", items: ourProducts },
        { label: "Built for businesses", items: clientWork },
      ].map((group) => (
        <section key={group.label} className={styles.gridSection}>
          <div className={styles.groupHead}>
            <SectionLabel>{group.label}</SectionLabel>
          </div>
          <div className={styles.grid}>
            {group.items.map((p, i) => (
              <Appear key={p.slug} inView y={40} delay={(i % 3) * 0.08} transition={springFirm} amount={0.15}>
                <ProjectCard project={p} />
              </Appear>
            ))}
          </div>
        </section>
      ))}

      <FaqPanel />
    </>
  );
}
