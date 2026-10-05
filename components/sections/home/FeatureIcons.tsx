"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "./FeatureIcons.module.css";

/*
 * The four animated glyphs from the template's feature row, rebuilt from the
 * live component: same artwork, positions (34 x 55 box), timings and easing.
 * Variant changes ease out over 1s (quint), like Framer's defaults there.
 */
const EASE = [0.22, 1, 0.36, 1] as const;
const SWITCH = { duration: 1, ease: EASE };

/* Flips through `count` states every `ms`, unless the visitor prefers reduced motion. */
function useCycle(count: number, ms: number) {
  const reduce = useReducedMotion();
  const [state, setState] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setState((s) => (s + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [count, ms, reduce]);
  return state;
}

const STAR_BIG =
  "M 5.621 0.224 C 5.682 -0.074 6.108 -0.074 6.169 0.224 L 6.981 4.157 C 7.049 4.485 7.305 4.742 7.634 4.81 L 11.567 5.622 C 11.865 5.683 11.865 6.109 11.567 6.17 L 7.634 6.981 C 7.305 7.049 7.049 7.306 6.981 7.635 L 6.169 11.567 C 6.108 11.865 5.683 11.865 5.621 11.567 L 4.809 7.635 C 4.741 7.306 4.484 7.049 4.156 6.981 L 0.223 6.17 C -0.074 6.109 -0.074 5.683 0.223 5.622 L 4.156 4.81 C 4.484 4.742 4.741 4.485 4.809 4.157 Z";
const STAR_SMALL =
  "M 2.113 0.144 C 2.153 -0.048 2.426 -0.048 2.465 0.144 L 2.731 1.429 C 2.775 1.64 2.94 1.805 3.151 1.849 L 4.435 2.114 C 4.627 2.154 4.627 2.427 4.435 2.466 L 3.15 2.731 C 2.939 2.775 2.774 2.94 2.73 3.151 L 2.465 4.436 C 2.426 4.628 2.152 4.628 2.113 4.436 L 1.848 3.151 C 1.805 2.94 1.64 2.775 1.428 2.731 L 0.143 2.466 C -0.048 2.426 -0.048 2.153 0.143 2.114 L 1.428 1.849 C 1.64 1.805 1.805 1.64 1.848 1.429 Z";
const LENS =
  "M 5.587 1.427 C 10.875 -1.564 17.587 0.299 20.577 5.587 C 23.402 10.582 21.894 16.844 17.262 20.044 L 21.222 27.048 L 22.096 26.555 L 30.956 42.223 L 27.475 44.192 L 18.613 28.524 L 19.481 28.033 L 15.521 21.028 C 10.392 23.346 4.251 21.41 1.427 16.417 C -1.563 11.129 0.299 4.417 5.587 1.427 Z M 18.836 6.571 C 16.389 2.245 10.898 0.721 6.571 3.168 C 2.245 5.615 0.721 11.106 3.168 15.432 C 5.615 19.759 11.106 21.283 15.432 18.836 C 19.759 16.389 21.283 10.898 18.836 6.571 Z";

/* Magnifier that tilts between two angles while its sparkles hop around the lens (1.5s per pose). */
export function LensIcon() {
  const s = useCycle(2, 1500);
  const pose = s === 0 ? { rotate: 41, big: [39, 17], small: [41.5, 27.5] } : { rotate: -20, big: [15, 5], small: [24.5, 7.5] };
  return (
    <span className={styles.box} aria-hidden="true">
      <motion.svg
        className={styles.abs}
        style={{ left: 0.02, top: 10.9 }}
        width="30.956"
        height="44.192"
        viewBox="0 0 30.956 44.192"
        initial={false}
        animate={{ rotate: pose.rotate }}
        transition={SWITCH}
      >
        <path d={LENS} fill="currentColor" />
      </motion.svg>
      <motion.svg
        className={styles.abs}
        width="11.79"
        height="11.791"
        viewBox="0 0 11.79 11.791"
        initial={false}
        animate={{ x: pose.big[0] - 5.9, y: pose.big[1] - 5.9, rotate: pose.rotate }}
        transition={SWITCH}
      >
        <path d={STAR_BIG} fill="currentColor" />
      </motion.svg>
      <motion.svg
        className={styles.abs}
        width="4.579"
        height="4.58"
        viewBox="0 0 4.579 4.58"
        initial={false}
        animate={{ x: pose.small[0] - 2.29, y: pose.small[1] - 2.29, rotate: pose.rotate }}
        transition={SWITCH}
      >
        <path d={STAR_SMALL} fill="currentColor" />
      </motion.svg>
    </span>
  );
}

/* A planet with two moons: the outer one circles clockwise every 6s, the inner one counter-clockwise every 5s. */
export function OrbitIcon() {
  const reduce = useReducedMotion();
  const spin = (turn: number, duration: number) =>
    reduce ? {} : { animate: { rotate: turn }, transition: { duration, ease: "linear" as const, repeat: Infinity } };
  return (
    <span className={styles.box} aria-hidden="true">
      <motion.span className={`${styles.ring} ${styles.outer}`} style={{ rotate: 150 }} {...spin(510, 6)}>
        <span className={styles.moon} style={{ width: 8, height: 8, left: 18, top: -3.375 }} />
      </motion.span>
      <motion.span className={`${styles.ring} ${styles.inner}`} style={{ rotate: 175 }} {...spin(-185, 5)}>
        <span className={styles.moon} style={{ width: 6, height: 6, left: 9.5, top: -2.375 }} />
      </motion.span>
      <span className={styles.core} />
    </span>
  );
}

/* Knob tops (px) for the four sliders; the template steps through these once a second. */
const KNOBS = [
  [45, 32, 20, 38],
  [20, 37, 26, 45],
  [20, 32, 26, 38],
];

export function SlidersIcon() {
  const s = useCycle(KNOBS.length, 1020);
  return (
    <span className={styles.box} aria-hidden="true">
      {KNOBS[s].map((top, i) => (
        <span key={i} className={styles.track} style={{ left: 1.5 + i * 8 }}>
          <span className={styles.rail} />
          <motion.span className={styles.knob} initial={false} animate={{ y: top }} transition={SWITCH} />
        </span>
      ))}
    </span>
  );
}

/* Region codes that slide under a pointer, one jump every 1.5s. */
const REGIONS = ["NG", "US", "UK", "EU", "CA", "AE", "DE", "AU", "IN", "ZA"];
const STOPS = [3, 1, 6, 3, 7, 4, 8, 2, 5];
const PITCH = 21.5;

export function RegionsIcon() {
  const s = useCycle(STOPS.length, 1500);
  const x = 16.5 - (STOPS[s] * PITCH + 7);
  return (
    <span className={styles.box} aria-hidden="true">
      <span className={styles.window}>
        <motion.span className={styles.codes} initial={false} animate={{ x }} transition={SWITCH}>
          {REGIONS.map((r) => (
            <span key={r} className={styles.code}>
              {r}
            </span>
          ))}
        </motion.span>
        <svg className={styles.pointer} width="9" height="9" viewBox="0 0 9 9">
          <path d="M 4.5 7.875 L 8.397 1.125 L 0.603 1.125 Z" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}
