import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { ProjectCard } from "@/components/work/ProjectCard";
import type { Home, Project } from "@/payload-types";
import styles from "./Work.module.css";

export function Work({ data, projects }: { data: Home["work"]; projects: Project[] }) {
  return (
    <div className={styles.panel} id="work">
      <div className={styles.marquee}>
        <BigMarquee text={data.marquee} />
      </div>
      <div className={styles.grid}>
        {projects.map((p, i) => (
          <Appear key={p.id} inView y={40} delay={(i % 3) * 0.08} transition={springFirm} amount={0.2}>
            <ProjectCard project={p} />
          </Appear>
        ))}
      </div>
    </div>
  );
}
