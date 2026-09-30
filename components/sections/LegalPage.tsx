import type { Privacy, Site } from "@/payload-types";
import styles from "./LegalPage.module.css";

/* The privacy policy and terms, as set in the admin's Legal pages. */
export function LegalPage({ data, site }: { data: Privacy; site: Site }) {
  const sections = data.sections ?? [];
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Policies</p>
          <h1 className={styles.title}>{data.title}</h1>
          <p className={styles.intro}>{data.intro}</p>
        </header>
        <ol className={styles.list}>
          {sections.map((s, i) => (
            <li key={s.id ?? s.title} className={styles.item}>
              <h2 className={styles.itemTitle}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className={styles.itemBody}>
                {s.body && <p>{s.body}</p>}
                {s.intro && <p>{s.intro}</p>}
                {(s.items?.length ?? 0) > 0 && (
                  <ul>
                    {s.items?.map((it) => (
                      <li key={it.id ?? it.text}>{it.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
          {data.contactNote !== false && (
            <li className={styles.item}>
              <h2 className={styles.itemTitle}>
                <span>{String(sections.length + 1).padStart(2, "0")}</span>
                Contact
              </h2>
              <div className={styles.itemBody}>
                <p>
                  Questions about this page? Email <a href={`mailto:${site.email}`}>{site.email}</a>
                  {site.phone ? (
                    <>
                      {" "}
                      or call <a href={site.phoneHref || `tel:${site.phone}`}>{site.phone}</a>
                    </>
                  ) : null}
                  .
                </p>
              </div>
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}
