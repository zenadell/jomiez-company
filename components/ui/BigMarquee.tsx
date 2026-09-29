"use client";

import { motion } from "motion/react";
import { Marquee } from "./Marquee";
import styles from "./BigMarquee.module.css";

/* Giant section title ("Our Work ✳ Our Work …") scrolling sideways with a spinning asterisk between repeats. */
export function Asterisk({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 150 150"
      animate={{ rotate: 360 }}
      transition={{ duration: 12, ease: "linear", repeat: Infinity }}
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="67" y="0" width="16" height="62" rx="8" transform={`rotate(${i * 45} 75 75)`} fill="currentColor" />
      ))}
    </motion.svg>
  );
}

export function BigMarquee({ text, dark = false, className }: { text: string; dark?: boolean; className?: string }) {
  const unit = (
    <>
      <h2 className={styles.word}>{text}</h2>
      <Asterisk className={styles.star} />
    </>
  );
  return (
    <div className={`${styles.wrap} ${dark ? styles.dark : ""} ${className ?? ""}`}>
      <Marquee duration={28} gap={60}>
        {unit}
        {unit}
      </Marquee>
    </div>
  );
}
