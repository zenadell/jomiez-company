"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/*
 * Counts the leading number of a stat ("60fps", "$0", "384-dim") up from zero
 * as it scrolls into view. The final value is what renders on the server; the
 * count writes straight to the text node while it runs.
 */
export function CountUp({ value, duration = 1.4 }: { value: string; duration?: number }) {
  const match = value.match(/^([^0-9]*)([0-9]+)(.*)$/);
  const target = match ? Number(match[2]) : 0;
  const num = useRef<HTMLSpanElement>(null);
  const inView = useInView(num, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = num.current;
    if (!el || !inView || reduce || target === 0) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, target, duration]);

  if (!match) return <span>{value}</span>;
  return (
    <span>
      {match[1]}
      <span ref={num}>{target}</span>
      {match[3]}
    </span>
  );
}
