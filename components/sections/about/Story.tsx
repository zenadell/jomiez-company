import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { About, Site } from "@/payload-types";
import styles from "./Story.module.css";

export function Story({ data, stats }: { data: About["story"]; stats: Site["stats"] }) {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.row}>
          <div className={styles.left}>
            <SectionLabel>{data.label}</SectionLabel>
            <Appear inView transition={springFirm} className={styles.headline}>
              <h2 className={styles.title}>{data.title}</h2>
              {data.cta?.label && <PixelButton href={data.cta.href}>{data.cta.label}</PixelButton>}
            </Appear>
          </div>
          <Appear inView delay={0.1} transition={springFirm} className={styles.copy}>
            {data.paragraphs?.map((p) => (
              <p key={p.id ?? p.text}>{p.text}</p>
            ))}
          </Appear>
        </div>

        {data.showStats !== false && (stats?.length ?? 0) > 0 && (
          <dl className={styles.stats}>
            {stats?.map((s, i) => (
              <Appear key={s.id ?? s.label} inView delay={i * 0.08} transition={springFirm} className={styles.stat}>
                <dt className={styles.value}>{s.value}</dt>
                <dd className={styles.label}>{s.label}</dd>
              </Appear>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
