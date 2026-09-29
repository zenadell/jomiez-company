import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";
import styles from "./ProjectCard.module.css";

/*
 * Template project card: category pill + wordmark on a white tile, the
 * screenshot fades in on hover, and a 2x2 grid of facts underneath.
 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/work/${project.slug}`} className={styles.card}>
      <div className={styles.frame}>
        <div className={styles.media}>
          <span className={styles.pill}>{project.category}</span>
          <span className={styles.mark}>{project.name}</span>
          {project.image ? (
            <Image
              src={project.image}
              alt={`${project.name} screenshot`}
              fill
              sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 440px"
              className={styles.shot}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
        </div>
        <dl className={styles.stats}>
          {project.stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.value}>{s.value}</dt>
              <dd className={styles.label}>{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}
