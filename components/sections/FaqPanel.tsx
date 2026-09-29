import { Faq } from "@/components/sections/home/Faq";
import type { Home } from "@/payload-types";
import styles from "./FaqPanel.module.css";

/* The FAQ block on its grey panel, reused at the end of inner pages (questions from the Home page). */
export function FaqPanel({ faq }: { faq: Home["faq"] }) {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <Faq {...faq} />
      </div>
    </section>
  );
}
