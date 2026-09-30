"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { src } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Process.module.css";

/* The four seasons of every build: the same cycle we run for our own products and for clients. */
export function Process({ data }: { data: Home["process"] }) {
  const [open, setOpen] = useState(0);
  const STEPS = data.steps ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <SectionLabel dark reverse>
          {data.label}
        </SectionLabel>
        <Appear inView transition={springFirm}>
          <h2 className={styles.title}>{data.title}</h2>
        </Appear>
      </div>

      <div className={styles.row}>
        <div className={styles.art}>
          <Image src={src(data.texture, "/media/process-texture.webp")} alt="" fill sizes="400px" className={styles.texture} />
          <Image src={src(data.iso, "/media/process-iso.webp")} alt="" width={300} height={300} className={styles.iso} />
        </div>

        <div className={styles.steps}>
          {STEPS.map((s, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={s.id ?? s.title}
                layout
                transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                className={`${styles.step} ${isOpen ? styles.stepOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.stepHead}
                  onClick={() => setOpen(i)}
                  onMouseEnter={() => setOpen(i)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.stepNum}>{`// ${String(i + 1).padStart(2, "0")}`}</span>
                  <span className={styles.stepTitle}>{s.title}</span>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        className={styles.stepTag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        {s.tag}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.p
                      className={styles.stepBody}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    >
                      {s.body}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className={styles.cta}>
        {data.closing && <p className={styles.mono}>{data.closing}</p>}
        {data.cta?.label && (
          <PixelButton href={data.cta.href} variant="secondary">
            {data.cta.label}
          </PixelButton>
        )}
      </div>
    </div>
  );
}
