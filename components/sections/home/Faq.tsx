"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import styles from "./Faq.module.css";

type FaqProps = {
  label?: string | null;
  sub?: string | null;
  title?: string | null;
  items?: readonly { q: string; a: string; id?: string | null }[] | null;
  cta?: { label: string; href: string } | null;
};

/* FAQ block: label and title on the left, accordion on the right. Product pages pass their own questions. */
export function Faq({ label, sub, title, items, cta }: FaqProps) {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <div className={styles.head}>
          {label && <SectionLabel>{label}</SectionLabel>}
          {sub && <p className={styles.sub}>{sub}</p>}
        </div>
        <Appear inView transition={springFirm} className={styles.bottom}>
          <h2 className={styles.title}>{title}</h2>
          {cta?.label && <PixelButton href={cta.href}>{cta.label}</PixelButton>}
        </Appear>
      </div>

      <div className={styles.list}>
        {(items ?? []).map((f, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={f.id ?? f.q}
              layout
              transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
              className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
            >
              <button
                type="button"
                className={styles.q}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{f.q}</span>
                <motion.span className={styles.icon} animate={{ rotate: isOpen ? 0 : 45 }} aria-hidden="true">
                  <Icon name="xBold" size={16} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.p
                    className={styles.a}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", duration: 0.45, bounce: 0 }}
                  >
                    {f.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
