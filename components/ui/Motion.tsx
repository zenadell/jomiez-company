"use client";

import { motion, type HTMLMotionProps, type Transition } from "motion/react";

/* Transitions lifted from the template's appear-animation config. */
export const springSoft: Transition = { type: "spring", duration: 0.4, bounce: 0.2 };
export const springSlow: Transition = { type: "spring", duration: 1, bounce: 0.2 };
export const springStiff: Transition = { type: "spring", stiffness: 400, damping: 61, mass: 1 };
export const springFirm: Transition = { type: "spring", stiffness: 400, damping: 64, mass: 1 };

type AppearProps = HTMLMotionProps<"div"> & {
  delay?: number;
  x?: number;
  y?: number;
  scale?: number;
  blur?: number;
  transition?: Transition;
  /** Animate when scrolled into view instead of on page load. */
  inView?: boolean;
  amount?: number;
};

/** Page-load (or in-view) entrance: fades from ~0 with an optional offset/scale/blur. */
export function Appear({
  delay = 0,
  x = 0,
  y = 0,
  scale = 1,
  blur = 0,
  transition = springSoft,
  inView = false,
  amount = 0.3,
  children,
  ...rest
}: AppearProps) {
  const initial = { opacity: 0.001, x, y, scale, filter: blur ? `blur(${blur}px)` : "blur(0px)" };
  const target = { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" };
  const t = { ...transition, delay };
  return (
    <motion.div
      initial={initial}
      {...(inView
        ? { whileInView: target, viewport: { once: true, amount } }
        : { animate: target })}
      transition={t}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
