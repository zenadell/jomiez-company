import type { LegalSection } from "@/content/legal";
import { site } from "@/content/site";
import styles from "./LegalPage.module.css";

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Policies</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
        </header>
        <ol className={styles.list}>
          {sections.map((s, i) => (
            <li key={s.title} className={styles.item}>
              <h2 className={styles.itemTitle}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className={styles.itemBody}>
                {s.body && <p>{s.body}</p>}
                {s.intro && <p>{s.intro}</p>}
                {s.items && (
                  <ul>
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
          <li className={styles.item}>
            <h2 className={styles.itemTitle}>
              <span>{String(sections.length + 1).padStart(2, "0")}</span>
              Contact
            </h2>
            <div className={styles.itemBody}>
              <p>
                Questions about this page? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call{" "}
                <a href={site.phoneHref}>{site.phone}</a>.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
