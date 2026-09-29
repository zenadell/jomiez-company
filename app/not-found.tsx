import { PixelButton } from "@/components/ui/PixelButton";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>This path has grown over.</h1>
        <p className={styles.body}>The link may be broken or the page may have moved. Let&apos;s lead you back.</p>
        <PixelButton href="/">Back to home</PixelButton>
      </div>
    </section>
  );
}
