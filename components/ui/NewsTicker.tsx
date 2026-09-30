"use client";

import { useSiteData } from "@/components/cms/SiteData";
import { JomiezMark } from "./JomiezMark";
import { Marquee } from "./Marquee";
import styles from "./NewsTicker.module.css";

/* The thin announcement strip between sections. Its words and on/off switch live in Site settings. */
export function NewsTicker({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { ticker } = useSiteData().site;
  if (ticker?.enabled === false || !ticker?.message) return null;
  const item = (
    <span className={styles.item}>
      <span className={styles.tag}>
        <JomiezMark size={18} />
        {ticker.tag}
      </span>
      <span>{ticker.message}</span>
    </span>
  );
  return (
    <div className={`${styles.wrap} ${dark ? styles.dark : ""} ${className ?? ""}`}>
      <Marquee duration={45} gap={100}>
        {item}
        {item}
      </Marquee>
    </div>
  );
}
