"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { JomiezMark } from "@/components/ui/JomiezMark";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import type { Home } from "@/payload-types";
import styles from "./Impact.module.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/*
 * Infinite slideshow, as in the template: the current card sits on the centre
 * line under the arrows and looped copies fill the width to both edges. It
 * advances every 5s; each move eases out over 0.9s (the template's curve).
 */
const COPIES = 3;
const SLIDE = { duration: 0.9, ease: [0.25, 1, 0.5, 1] as const };
const AUTOPLAY_MS = 5000;

export function Impact({ data }: { data: Home["tenets"] }) {
  const standards = data.items ?? [];
  const N = standards.length;
  const viewport = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const index = useRef<number>(N);
  const pitch = useRef(301);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const inView = useInView(viewport, { amount: 0.3 });

  // Card width + gap, re-measured on resize so the loop stays aligned.
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => {
      const cards = el.querySelectorAll("article");
      if (cards.length > 1) pitch.current = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
      x.set(-index.current * pitch.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [x]);

  const go = useCallback(
    (to: number) => {
      if (!N) return;
      index.current = to;
      animate(x, -to * pitch.current, {
        ...SLIDE,
        onComplete: () => {
          // Jump back into the middle copy without animating, so the loop never runs out.
          let n = index.current;
          if (n < N) n += N;
          else if (n >= 2 * N) n -= N;
          if (n !== index.current) {
            index.current = n;
            x.set(-n * pitch.current);
          }
        },
      });
    },
    [x, N],
  );

  useEffect(() => {
    if (reduce || paused || !inView) return;
    const id = window.setInterval(() => go(index.current + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [go, reduce, paused, inView]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = -x.get() - info.velocity.x * 0.2;
    go(Math.round(projected / pitch.current));
    setPaused(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <BigMarquee text={data.marquee} />
        <div className={styles.descRow}>
          <span className={styles.descLine} />
          <Appear inView transition={springFirm}>
            <p className={styles.desc}>{data.description}</p>
          </Appear>
        </div>
      </div>

      <div className={styles.carousel}>
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => go(index.current - 1)} aria-label="Previous">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M22.5 12.5 15 20l7.5 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.arrow} onClick={() => go(index.current + 1)} aria-label="Next">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M17.5 12.5 25 20l-7.5 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div
          ref={viewport}
          className={styles.viewport}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <motion.div
            className={styles.track}
            style={{ x }}
            drag="x"
            dragMomentum={false}
            onDragStart={() => setPaused(true)}
            onDragEnd={onDragEnd}
          >
            {Array.from({ length: COPIES }, (_, copy) =>
              standards.map((s, i) => (
                <article key={`${copy}-${s.id ?? s.title}`} className={styles.card} aria-hidden={copy !== 1 || undefined}>
                  <div className={styles.cardTop}>
                    <span className={styles.chip}>
                      <span className={styles.avatar}>
                        <JomiezMark size={13} />
                      </span>
                      <span className={styles.tag}>{s.tag}</span>
                    </span>
                    <span className={styles.index}>{ROMAN[i] ?? i + 1}</span>
                  </div>
                  <QuoteMark />
                  <p className={styles.cardText}>{s.body}</p>
                  <div className={styles.cardFoot}>
                    <span className={styles.footRule} />
                    <div>
                      <p className={styles.footTitle}>{s.title}</p>
                      <p className={styles.footSub}>{data.cardFooter}</p>
                    </div>
                  </div>
                </article>
              )),
            )}
          </motion.div>
        </div>
      </div>

      {data.showTicker !== false && <NewsTicker className={styles.ticker} />}
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
