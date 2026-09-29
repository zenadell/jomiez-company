import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { ProjectCard } from "@/components/work/ProjectCard";
import { featuredProjects } from "@/content/projects";
import styles from "./Work.module.css";

export function Work() {
  return (
    <div className={styles.panel} id="work">
      <div className={styles.marquee}>
        <BigMarquee text="Creations" />
      </div>
      <div className={styles.grid}>
        {featuredProjects.map((p, i) => (
          <Appear key={p.slug} inView y={40} delay={(i % 3) * 0.08} transition={springFirm} amount={0.2}>
            <ProjectCard project={p} />
          </Appear>
        ))}
      </div>
    </div>
  );
}
