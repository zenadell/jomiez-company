"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { JomiezMark } from "@/components/ui/JomiezMark";
import { src } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Showcase.module.css";

/* Full-bleed image band ("Built to Endure.") with a scroll-driven zoom and the brand mark in the corner. */
export function Showcase({ data }: { data: Pick<Home["showcase"], "image" | "lead" | "pill" | "title"> }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={ref} className={styles.section}>
      <motion.div className={styles.media} style={{ scale, y }}>
        <Image src={src(data.image, "/media/showcase-dial.jpg")} alt="" fill sizes="100vw" className={styles.img} />
      </motion.div>
      <div className={styles.overlay}>
        <div className={styles.top}>
          {data.lead && <p className={styles.lead}>{data.lead}</p>}
          {data.pill && (
            <span className={styles.pill}>
              <Icon name="timer" size={18} />
              {data.pill}
            </span>
          )}
        </div>
        <div className={styles.bottom}>
          <h2 className={styles.title}>{data.title}</h2>
          <JomiezMark size={72} className={styles.mark} />
        </div>
      </div>
    </section>
  );
}
