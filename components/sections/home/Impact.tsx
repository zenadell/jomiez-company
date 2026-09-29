"use client";

import { useRef } from "react";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { JomiezMark } from "@/components/ui/JomiezMark";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { standards } from "@/content/standards";
import styles from "./Impact.module.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

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
        <BigMarquee text="Our Tenets" />
        <div className={styles.descRow}>
          <span className={styles.descLine} />
          <Appear inView transition={springFirm}>
            <p className={styles.desc}>
              Seven principles carved into everything we make, from our own products to yours.
            </p>
          </Appear>
        </div>
      </div>

      <div className={styles.carousel}>
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => scroll(-1)} aria-label="Previous">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M22.5 12.5 15 20l7.5 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.arrow} onClick={() => scroll(1)} aria-label="Next">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M17.5 12.5 25 20l-7.5 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div ref={track} className={styles.track} data-lenis-prevent-wheel="">
          {standards.map((s, i) => (
            <article key={s.title} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.chip}>
                  <span className={styles.avatar}>
                    <JomiezMark size={13} />
                  </span>
                  <span className={styles.tag}>{s.tag}</span>
                </span>
                <span className={styles.index}>{ROMAN[i]}</span>
              </div>
              <QuoteMark />
              <p className={styles.cardText}>{s.body}</p>
              <div className={styles.cardFoot}>
                <span className={styles.footRule} />
                <div>
                  <p className={styles.footTitle}>{s.title}</p>
                  <p className={styles.footSub}>A Jomiez tenet</p>
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

/* The template's outlined quote mark (two rounded strokes, 20% ink). */
const QUOTE =
  "M 1 0 L 7 0 C 7.552 0 8 0.448 8 1 L 8 9.5 C 8 10.052 7.552 10.5 7 10.5 L 4.5 10.5 C 4.224 10.5 4 10.724 4 11 L 4 12 C 4 13.105 4.895 14 6 14 L 7 14 C 7.552 14 8 14.448 8 15 L 8 17 C 8 17.552 7.552 18 7 18 L 6 18 C 2.686 18 0 15.314 0 12 L 0 1 C 0 0.448 0.448 0 1 0 Z";

function QuoteMark() {
  return (
    <svg className={styles.quote} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {[2, 14].map((x) => (
        <path key={x} d={QUOTE} transform={`translate(${x} 3)`} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
