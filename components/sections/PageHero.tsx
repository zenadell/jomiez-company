import type { ReactNode } from "react";
import { Appear, springFirm, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import styles from "./PageHero.module.css";

/* Inner-page opener from the template's About page: large statement, supporting copy and a CTA. */
export function PageHero({
  title,
  lead,
  cta,
  eyebrow,
  children,
}: {
  title: string;
  lead?: string | null;
  cta?: { label: string; href: string } | null;
  eyebrow?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {eyebrow && (
          <Appear delay={0.4}>
            <p className={styles.eyebrow}>{eyebrow}</p>
          </Appear>
        )}
        <Appear delay={0.5} transition={springSoft}>
          <h1 className={styles.title}>{title}</h1>
        </Appear>
        {lead && (
          <Appear delay={0.6} transition={springSoft}>
            <p className={styles.lead}>{lead}</p>
          </Appear>
        )}
        {cta?.label && (
          <Appear delay={0.7} transition={springFirm}>
            <PixelButton href={cta.href}>{cta.label}</PixelButton>
          </Appear>
        )}
      </div>
      {children}
    </section>
  );
}
