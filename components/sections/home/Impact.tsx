"use client";

import { useRef } from "react";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { standards } from "@/content/standards";
import styles from "./Impact.module.css";

export function Impact() {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <BigMarquee text="Work & Impact" />
        <div className={styles.descRow}>
          <span className={styles.descLine} />
          <Appear inView transition={springFirm}>
            <p className={styles.desc}>
              Empowering ambitious businesses through bespoke software architectures and intelligent digital solutions.
            </p>
          </Appear>
        </div>
      </div>

      <div className={styles.carousel}>
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => scroll(-1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3 5 8l5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.arrow} onClick={() => scroll(1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="m6 3 5 5-5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div ref={track} className={styles.track} data-lenis-prevent-wheel="">
          {standards.map((s, i) => (
            <article key={s.title} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.tag}>{s.tag}</span>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <svg className={styles.quote} width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
                <path
                  d="M0 18V9.8C0 4.6 2.5 1.2 7.4.2l.9 2.3C5.7 3.4 4.3 5.3 4.2 8h4.4v10H0Zm12.6 0V9.8c0-5.2 2.5-8.6 7.4-9.6l.9 2.3c-2.6.9-4 2.8-4.1 5.5h4.4v10h-8.6Z"
                  fill="currentColor"
                />
              </svg>
              <p className={styles.cardText}>{s.body}</p>
              <div className={styles.cardFoot}>
                <span className={styles.footRule} />
                <div>
                  <p className={styles.footTitle}>{s.title}</p>
                  <p className={styles.footSub}>The Jomiez standard</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <NewsTicker className={styles.ticker} />
    </section>
  );
}
