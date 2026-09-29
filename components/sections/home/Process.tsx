"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import styles from "./Process.module.css";

/* The four seasons of every build: the same cycle we run for our own products and for clients. */
const STEPS = [
  {
    title: "The Seed: Discovery & Scoping",
    tag: "Seed",
    body: "We study your idea, your stack and your goals until we find what is worth growing, then return with scope, timeline and cost.",
  },
  {
    title: "The Root: Architecture & Design",
    tag: "Root",
    body: "The interface and the system beneath it are designed together: journeys, UI, data models and integrations, so what grows above ground is held firmly below.",
  },
  {
    title: "The Growth: Rapid Development",
    tag: "Growth",
    body: "Working software appears early and grows in short cycles beside you, into web, mobile and AI features you can touch.",
  },
  {
    title: "The Harvest: Launch & Care",
    tag: "Harvest",
    body: "We launch on reliable cloud ground, then keep tending: SEO, maintenance and continuous improvement long after release.",
  },
] as const;

export function Process() {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <SectionLabel dark reverse>
          The four seasons
        </SectionLabel>
        <Appear inView transition={springFirm}>
          <h2 className={styles.title}>From seed to harvest. The four seasons of every build.</h2>
        </Appear>
      </div>

      <div className={styles.row}>
        <div className={styles.art}>
          <Image src="/media/process-texture.webp" alt="" fill sizes="400px" className={styles.texture} />
          <Image src="/media/process-iso.webp" alt="" width={300} height={300} className={styles.iso} />
        </div>

        <div className={styles.steps}>
          {STEPS.map((s, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={s.title}
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
        <p className={styles.mono}>
          We do not rush what is meant to last. Every product is grown to be fast, resilient and ready for the
          seasons ahead.
        </p>
        <PixelButton href="/contact" variant="secondary">
          Begin With Us
        </PixelButton>
      </div>
    </div>
  );
}
