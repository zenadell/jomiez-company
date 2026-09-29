import type { Metadata } from "next";
import Image from "next/image";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm, springSlow } from "@/components/ui/Motion";
import { ProjectCard } from "@/components/work/ProjectCard";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { projects } from "@/content/projects";
import styles from "./work.module.css";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected Jomiez projects: AI platforms, WhatsApp automation, SaaS landing systems, creative studios and e-commerce.",
};

export default function WorkPage() {
  return (
    <>
      <section className={styles.hero}>
        <Appear scale={1.08} transition={springSlow} delay={0.1} className={styles.heroPanel}>
          <Image src="/media/pricing-swirl.jpg" alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroMarquee}>
            <BigMarquee text="Our Work" dark />
          </div>
          <p className={styles.heroNote}>
            {projects.length} projects across AI, automation, web platforms and e-commerce.
          </p>
        </Appear>
      </section>
      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {projects.map((p, i) => (
            <Appear key={p.slug} inView y={40} delay={(i % 3) * 0.08} transition={springFirm} amount={0.15}>
              <ProjectCard project={p} />
            </Appear>
          ))}
        </div>
      </section>
      <FaqPanel />
    </>
  );
}
