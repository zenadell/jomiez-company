import type { CSSProperties, ReactNode } from "react";
import styles from "./Marquee.module.css";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full loop of the content. */
  duration?: number;
  gap?: number;
  reverse?: boolean;
  fade?: boolean;
  className?: string;
  pauseOnHover?: boolean;
};

/* Infinite ticker: the content is rendered twice and the track slides by exactly one copy. */
export function Marquee({
  children,
  duration = 30,
  gap = 10,
  reverse = false,
  fade = false,
  className,
  pauseOnHover = false,
}: MarqueeProps) {
  const style = { "--marquee-duration": `${duration}s`, "--marquee-gap": `${gap}px` } as CSSProperties;
  return (
    <div
      className={`${styles.viewport} ${fade ? styles.fade : ""} ${pauseOnHover ? styles.pausable : ""} ${className ?? ""}`}
      style={style}
    >
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
