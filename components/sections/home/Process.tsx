"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import styles from "./Process.module.css";

const STEPS = [
  {
    title: "Strategic Discovery & Scoping",
    tag: "Scoping",
    body: "We analyse your technical stack, product requirements and business goals to find the high-impact opportunities that match your growth objectives, then come back with scope, timeline and cost.",
  },
  {
    title: "Custom Architecture & Design",
    tag: "Design",
    body: "We design the interface and the system behind it together: user journeys, UI, data models and integrations, so the product is intuitive to use and solid under the hood.",
  },
  {
    title: "Rapid Prototype Development",
    tag: "Build",
    body: "We ship working software early and iterate with you in short cycles, turning the design into responsive web, mobile and AI features you can click through.",
  },
  {
    title: "Production-Grade Deployment",
    tag: "Launch",
    body: "We launch on reliable cloud infrastructure, then stay on for SEO, maintenance and continuous improvement once you are live.",
  },
] as const;

export function Process() {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <SectionLabel dark reverse>
          Our process
        </SectionLabel>
        <Appear inView transition={springFirm}>
          <h2 className={styles.title}>From discovery to production deployment. Our iterative development cycle.</h2>
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
          We don&apos;t just ship code; we deliver competitive advantages. Every product is designed to be fast,
          resilient and scalable.
        </p>
        <PixelButton href="/contact" variant="secondary">
          Get in Touch
        </PixelButton>
      </div>
    </div>
  );
}
