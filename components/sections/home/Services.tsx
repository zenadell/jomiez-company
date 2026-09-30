"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { src } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Services.module.css";

export function Services({ data }: { data: Home["services"] }) {
  const [open, setOpen] = useState(0);
  const texture = src(data.texture, "/media/services-texture.webp");
  const iso = src(data.iso, "/media/services-iso.webp");

  return (
    <div className={styles.row} id="capabilities">
      <div className={styles.left}>
        <Appear inView transition={springFirm} className={styles.intro}>
          <SectionLabel dark>{data.label}</SectionLabel>
          {data.intro && <p className={styles.introText}>{data.intro}</p>}
        </Appear>
        <Appear inView delay={0.1} transition={springFirm} className={styles.bottom}>
          <h2 className={styles.title}>{data.title}</h2>
          {data.cta?.label && (
            <PixelButton href={data.cta.href} variant="secondary">
              {data.cta.label}
            </PixelButton>
          )}
        </Appear>
      </div>

      <div className={styles.cards}>
        {(data.items ?? []).map((s, i) => {
          const isOpen = open === i;
          const num = String(i + 1).padStart(3, "0");
          return (
            <motion.div
              key={s.id ?? s.title}
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
                  <Image src={texture} alt="" fill sizes="480px" className={styles.texture} />
                  <Image src={iso} alt="" width={270} height={270} className={styles.iso} />
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
