import { Faq } from "@/components/sections/home/Faq";
import styles from "./FaqPanel.module.css";

/* The FAQ block on its grey panel, reused at the end of inner pages. */
export function FaqPanel() {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <Faq />
      </div>
    </section>
  );
}
