import { Appear, springFirm } from "@/components/ui/Motion";
import { Marquee } from "@/components/ui/Marquee";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TechMark } from "@/components/ui/TechMark";
import type { About } from "@/payload-types";
import styles from "./Capabilities.module.css";

/* The four symbols a craft card can carry (chosen in the admin). */
const SHAPES: Record<string, string> = {
  blocks: "M12 4h14v14H12zM30 22h14v14H30zM12 30a8 8 0 1 0 16 0 8 8 0 1 0-16 0",
  zline: "M8 8h32L8 40h32M24 8v32",
  rings: "M24 6a18 18 0 1 0 0 36 18 18 0 1 0 0-36M24 16a8 8 0 1 0 0 16 8 8 0 1 0 0-16",
  diamond: "M6 24 24 6l18 18-18 18zM24 16l8 8-8 8-8-8z",
};

export function Capabilities({ data, stack }: { data: About["crafts"]; stack: string[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionLabel dark reverse>
          {data.label}
        </SectionLabel>
        <ScrollText as="h2" className={styles.statement} from={0.15} text={data.statement} />
        {data.lead && <p className={styles.lead}>{data.lead}</p>}
      </div>
      {data.showStack !== false && stack.length > 0 && (
        <Marquee duration={40} gap={10} fade>
          {stack.map((s) => (
            <span key={s} className={styles.stackItem}>
              <TechMark name={s} size={20} />
              {s}
            </span>
          ))}
        </Marquee>
      )}
      <div className={styles.cards}>
        {(data.cards ?? []).map((c, i) => (
          <Appear key={c.id ?? c.title} inView delay={i * 0.08} transition={springFirm} className={styles.card}>
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className={styles.icon}>
              <path d={SHAPES[c.shape ?? "blocks"] ?? SHAPES.blocks} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <div>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardBody}>{c.body}</p>
            </div>
          </Appear>
        ))}
      </div>
    </section>
  );
}
