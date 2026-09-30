import Image from "next/image";
import Link from "next/link";
import { img } from "@/lib/media";
import type { Project } from "@/payload-types";
import styles from "./ProjectCard.module.css";

/*
 * Template project card: category pill + wordmark on a white tile, the
 * screenshot fades in on hover, and a 2x2 grid of facts underneath.
 */
export function ProjectCard({ project }: { project: Project }) {
  const shot = img(project.image);
  return (
    <Link href={`/work/${project.slug}`} className={styles.card}>
      <div className={styles.frame}>
        <div className={styles.media}>
          <span className={styles.pill}>{project.isProduct ? `Our product · ${project.category}` : project.category}</span>
          <span className={styles.mark}>{project.name}</span>
          {shot ? (
            <Image
              src={shot.src}
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
          {project.stats?.map((s) => (
            <div key={s.id ?? s.label} className={styles.stat}>
              <dt className={styles.value}>{s.value}</dt>
              <dd className={styles.label}>{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}
