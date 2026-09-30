import Image from "next/image";
import Link from "next/link";
import { Appear, springFirm, springSlow, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProductPage } from "@/components/product/ProductPage";
import { img, texts } from "@/lib/media";
import type { Project, Site, WorkPage } from "@/payload-types";
import styles from "@/app/(site)/work/[slug]/case.module.css";

export type ProjectViewProps = { project: Project; projects: Project[]; page: WorkPage; site: Site };

/* A product or client project: our own products get the product page (the
   template's "Digital Brain" layout); client builds get the case study. */
export function ProjectView({ project, projects, page, site }: ProjectViewProps) {
  if (project.isProduct && project.productPage?.hero?.title) {
    return <ProductPage project={project} avatars={site.avatars ?? []} />;
  }

  const index = projects.findIndex((p) => p.id === project.id);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const cs = page.caseStudy ?? {};
  const cover = img(project.image);
  const services = texts(project.services);

  const facts = [
    { label: "Category", value: project.category },
    ...(services.length ? [{ label: "Services", value: services.join(", ") }] : []),
    ...(project.client ? [{ label: "Client", value: project.client }] : []),
    ...(project.year ? [{ label: "Year", value: project.year }] : []),
  ];

  return (
    <article>
      <section className={styles.hero}>
        <Appear scale={1.05} transition={springSlow} delay={0.1} className={styles.heroPanel}>
          {cover ? (
            <Image src={cover.src} alt={cover.alt || `${project.name} screenshot`} fill priority sizes="100vw" className={styles.heroImg} />
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
            {project.link?.href && (
              <div className={styles.fact}>
                <dt>Live site</dt>
                <dd>
                  <a href={project.link.href} target="_blank" rel="noopener">
                    {project.link.label || project.link.href} ↗
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
          <p className={styles.kicker}>{project.isProduct ? cs.productKicker : cs.caseKicker}</p>
          <h1 className={styles.title}>{project.name}</h1>
        </Appear>
        <dl className={styles.stats}>
          {project.stats?.map((s, i) => (
            <Appear key={s.id ?? s.label} inView delay={i * 0.07} transition={springFirm} className={styles.stat}>
              <dt className={styles.statValue}>{s.value}</dt>
              <dd className={styles.statLabel}>{s.label}</dd>
            </Appear>
          ))}
        </dl>
      </section>

      <section className={styles.body}>
        {project.sections?.map((sec) => (
          <Appear key={sec.id ?? sec.title} inView transition={springFirm} className={styles.block}>
            <h2 className={styles.blockTitle}>{sec.title}</h2>
            <div className={styles.blockContent}>
              {sec.body && <p className={styles.blockText}>{sec.body}</p>}
              {(sec.points?.length ?? 0) > 0 && sec.points && (
                <ul className={styles.points}>
                  {sec.points.map((pt) => (
                    <li key={pt.id ?? pt.title}>
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
        {next && (
          <Link href={`/work/${next.slug}`} className={styles.nextCard}>
            <span className={styles.nextLabel}>{next.isProduct ? cs.nextProduct : cs.nextCase}</span>
            <span className={styles.nextName}>{next.name}</span>
            <span className={styles.nextSummary}>{next.summary}</span>
          </Link>
        )}
        <div className={styles.cta}>
          {cs.ctaTitle && <h2 className={styles.ctaTitle}>{cs.ctaTitle}</h2>}
          {cs.cta?.label && <PixelButton href={cs.cta.href}>{cs.cta.label}</PixelButton>}
        </div>
      </section>
    </article>
  );
}
