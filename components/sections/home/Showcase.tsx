"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/content/site";
import styles from "./Showcase.module.css";

/* Full-bleed image band ("Engineering by Design.") with a scroll-driven zoom and a rotating badge. */
export function Showcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={ref} className={styles.section}>
      <motion.div className={styles.media} style={{ scale, y }}>
        <Image src="/media/showcase-dial.jpg" alt="" fill sizes="100vw" className={styles.img} />
      </motion.div>
      <div className={styles.overlay}>
        <div className={styles.top}>
          <p className={styles.lead}>
            Engineering modern web apps and digital products that redefine what is possible for growing businesses.
          </p>
          <span className={styles.pill}>
            <span className={styles.dot} />
            {site.stats[0].value} years building
          </span>
        </div>
        <div className={styles.bottom}>
          <h2 className={styles.title}>Engineering by Design.</h2>
          <RotatingBadge />
        </div>
      </div>
    </section>
  );
}

function RotatingBadge() {
  const text = "JOMIEZ INNOVATION • ENGINEERING BY DESIGN • ";
  return (
    <div className={styles.badge} aria-hidden="true">
      <svg viewBox="0 0 120 120" className={styles.badgeRing}>
        <defs>
          <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className={styles.badgeText}>
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <span className={styles.badgeCore}>J</span>
    </div>
  );
}
