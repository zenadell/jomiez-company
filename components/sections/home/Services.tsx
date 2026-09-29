"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { headlineServices } from "@/content/services";
import styles from "./Services.module.css";

export function Services() {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.row} id="capabilities">
      <div className={styles.left}>
        <Appear inView transition={springFirm} className={styles.intro}>
          <SectionLabel dark>Services</SectionLabel>
          <p className={styles.introText}>
            Beyond our own products, we lend our craft to others, shaping raw ideas into software that feels as
            natural as it looks.
          </p>
        </Appear>
        <Appear inView delay={0.1} transition={springFirm} className={styles.bottom}>
          <h2 className={styles.title}>Custom Software, Grown From Deep Roots.</h2>
          <PixelButton href="/contact" variant="secondary">
            Start a Project
          </PixelButton>
        </Appear>
      </div>

      <div className={styles.cards}>
        {headlineServices.map((s, i) => {
          const isOpen = open === i;
          const num = String(i + 1).padStart(3, "0");
          return (
            <motion.div
              key={s.title}
              layout
              transition={{ type: "spring", duration: 0.7, bounce: 0.12 }}
              className={`${styles.card} ${isOpen ? styles.open : ""}`}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => setOpen(i)}
              tabIndex={0}
            >
              <span className={styles.num}>{num}</span>
              <div className={styles.openBody} aria-hidden={!isOpen}>
                <div className={styles.copy}>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardText}>{s.body}</p>
                </div>
                <div className={styles.art}>
                  <Image src="/media/services-texture.webp" alt="" fill sizes="480px" className={styles.texture} />
                  <Image src="/media/services-iso.webp" alt="" width={270} height={270} className={styles.iso} />
                </div>
              </div>
              <span className={styles.vertical} aria-hidden={isOpen}>
                {s.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
