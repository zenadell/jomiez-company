import { tickerMessage } from "@/content/site";
import { JomiezMark } from "./JomiezMark";
import { Marquee } from "./Marquee";
import styles from "./NewsTicker.module.css";

/* The thin announcement strip that runs between sections ("//JOMIEZ  We are expanding…"). */
export function NewsTicker({ className, dark = false }: { className?: string; dark?: boolean }) {
  const item = (
    <span className={styles.item}>
      <span className={styles.tag}>
        <JomiezMark size={18} />
        {"//JOMIEZ"}
      </span>
      <span>{tickerMessage}</span>
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
