"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { faqs } from "@/content/faq";
import styles from "./Faq.module.css";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <div className={styles.head}>
          <SectionLabel>The inquiry</SectionLabel>
          <p className={styles.sub}>Answers on how we scope, build and care for your product, and on the products we make ourselves.</p>
        </div>
        <Appear inView transition={springFirm} className={styles.bottom}>
          <h2 className={styles.title}>Everything you should know before we begin.</h2>
          <PixelButton href="/contact">Contact Us</PixelButton>
        </Appear>
      </div>

      <div className={styles.list}>
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={f.q}
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
