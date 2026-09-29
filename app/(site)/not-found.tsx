import { PixelButton } from "@/components/ui/PixelButton";
import { getGlobal } from "@/lib/cms";
import styles from "./not-found.module.css";

export default async function NotFound() {
  const page = await getGlobal("not-found");
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>{page.title}</h1>
        {page.body && <p className={styles.body}>{page.body}</p>}
        {page.cta?.label && <PixelButton href={page.cta.href}>{page.cta.label}</PixelButton>}
      </div>
    </section>
  );
}
