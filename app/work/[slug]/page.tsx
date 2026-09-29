import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Appear, springFirm, springSlow, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { getProject, projects } from "@/content/projects";
import styles from "./case.module.css";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.summary,
    openGraph: project.image ? { images: [{ url: project.image }] } : undefined,
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = projects[(index + 1) % projects.length];

  const facts = [
    { label: "Category", value: project.category },
    { label: "Services", value: project.services.join(", ") },
    ...(project.client ? [{ label: "Client", value: project.client }] : []),
    ...(project.year ? [{ label: "Year", value: project.year }] : []),
  ];

  return (
    <article>
      <section className={styles.hero}>
        <Appear scale={1.05} transition={springSlow} delay={0.1} className={styles.heroPanel}>
          {project.image ? (
            <Image src={project.image} alt={`${project.name} screenshot`} fill priority sizes="100vw" className={styles.heroImg} />
          ) : (
            <div className={styles.heroFallback} aria-hidden="true">
              <span>{project.name}</span>
            </div>
          )}
          <dl className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label} className={styles.fact}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
            {project.link && (
              <div className={styles.fact}>
                <dt>Live site</dt>
                <dd>
                  <a href={project.link.href} target="_blank" rel="noopener">
                    {project.link.label} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <div className={styles.tab}>
            <p>{project.summary}</p>
          </div>
        </Appear>
      </section>

      <section className={styles.intro}>
        <Appear delay={0.4} transition={springSoft}>
          <p className={styles.kicker}>{project.product ? "Our product" : "Case study"}</p>
          <h1 className={styles.title}>{project.name}</h1>
        </Appear>
        <dl className={styles.stats}>
          {project.stats.map((s, i) => (
            <Appear key={s.label} inView delay={i * 0.07} transition={springFirm} className={styles.stat}>
              <dt className={styles.statValue}>{s.value}</dt>
              <dd className={styles.statLabel}>{s.label}</dd>
            </Appear>
          ))}
        </dl>
      </section>

      <section className={styles.body}>
        {project.sections.map((sec) => (
          <Appear key={sec.title} inView transition={springFirm} className={styles.block}>
            <h2 className={styles.blockTitle}>{sec.title}</h2>
            <div className={styles.blockContent}>
              {sec.body && <p className={styles.blockText}>{sec.body}</p>}
              {sec.points && (
                <ul className={styles.points}>
                  {sec.points.map((pt) => (
                    <li key={pt.title}>
                      <span className={styles.check} aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="m2 5.2 2 2L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>
                        <strong>{pt.title}.</strong> {pt.body}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Appear>
        ))}
      </section>

      <section className={styles.next}>
        <Link href={`/work/${next.slug}`} className={styles.nextCard}>
          <span className={styles.nextLabel}>{next.product ? "Next product" : "Next creation"}</span>
          <span className={styles.nextName}>{next.name}</span>
          <span className={styles.nextSummary}>{next.summary}</span>
        </Link>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Have something like this ready to grow?</h2>
          <PixelButton href="/contact">Start a project</PixelButton>
        </div>
      </section>
    </article>
  );
}
