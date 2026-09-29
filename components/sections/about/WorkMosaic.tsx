"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import styles from "./WorkMosaic.module.css";

const SHOTS = [
  { src: "/media/work/chaka-ai.jpg", alt: "Chaka AI" },
  { src: "/media/work/zyro.jpg", alt: "Zyro" },
  { src: "/media/work/chaka-wap.jpg", alt: "Chaka WAP" },
  { src: "/media/work/renok.jpg", alt: "Renok" },
];

/* A wide band of real project screens; columns drift at different speeds on scroll. */
export function WorkMosaic() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const up = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const down = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <div ref={ref} className={styles.band}>
      {SHOTS.map((s, i) => (
        <motion.div key={s.src} className={styles.tile} style={{ y: i % 2 ? down : up }}>
          <Image src={s.src} alt={`${s.alt} screen`} fill sizes="(max-width: 809px) 50vw, 25vw" className={styles.img} />
        </motion.div>
      ))}
    </div>
  );
}
