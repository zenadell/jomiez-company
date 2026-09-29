import styles from "./SectionLabel.module.css";

/* The template's section header rule: small pill · hairline · MONO LABEL (or mirrored). */
export function SectionLabel({
  children,
  dark = false,
  reverse = false,
  className,
}: {
  children: string;
  dark?: boolean;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`${styles.row} ${dark ? styles.dark : ""} ${reverse ? styles.reverse : ""} ${className ?? ""}`}>
      <span className={styles.pill} aria-hidden="true" />
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
    </div>
  );
}
