"use client";

import Image from "@/components/ui/Image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Img } from "@/lib/media";
import styles from "./WorkMosaic.module.css";

/* A wide band of real project screens; columns drift at different speeds on scroll. */
export function WorkMosaic({ shots }: { shots: Img[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const up = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const down = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <div ref={ref} className={styles.band}>
      {shots.map((s, i) => (
        <motion.div key={`${s.src}-${i}`} className={styles.tile} style={{ y: i % 2 ? down : up }}>
          <Image src={s.src} alt={s.alt} fill sizes="(max-width: 809px) 50vw, 25vw" className={styles.img} />
        </motion.div>
      ))}
    </div>
  );
}
