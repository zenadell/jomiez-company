"use client";

import { motion } from "motion/react";
import { Icon } from "./Icon";

/*
 * The "Execution speed" gauge: a ring of radial ticks that light up in
 * sequence when it scrolls into view, around a dark centre button.
 */
const TICKS = 48;
const R_OUT = 70;
const R_IN = 56;
// Rounded so server and client render identical attributes.
const r2 = (n: number) => Math.round(n * 100) / 100;

export function Dial() {
  return (
    <div style={{ position: "relative", height: 192, display: "grid", placeItems: "center" }} aria-hidden="true">
      <svg width="153" height="153" viewBox="-76.5 -76.5 153 153">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
          const long = i % 4 === 0;
          const r1 = long ? R_IN - 4 : R_IN;
          return (
            <motion.line
              key={i}
              x1={r2(Math.cos(a) * r1)}
              y1={r2(Math.sin(a) * r1)}
              x2={r2(Math.cos(a) * R_OUT)}
              y2={r2(Math.sin(a) * R_OUT)}
              stroke="#1a1a1a"
              strokeWidth={long ? 1.6 : 1}
              strokeLinecap="round"
              initial={{ opacity: 0.12 }}
              whileInView={{ opacity: i < TICKS * 0.82 ? 0.85 : 0.12 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: 0.3 + i * 0.018, duration: 0.25 }}
            />
          );
        })}
      </svg>
      <span
        style={{
          position: "absolute",
          width: 60,
          height: 60,
          borderRadius: "100%",
          background: "#1a1a1a",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name="rocketLight" size={24} style={{ color: "#fff" }} />
      </span>
    </div>
  );
}
