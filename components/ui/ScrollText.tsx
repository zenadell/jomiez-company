"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ElementType } from "react";

/*
 * The template's scroll text effect: every character starts at 10% opacity
 * and fills in as the paragraph scrolls through the viewport.
 */
type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Opacity of characters that haven't been reached yet. */
  from?: number;
  /** Scroll window over which the whole text fills in. */
  offset?: ["start end" | "start 0.9" | "start 0.85" | "start 0.8", "end 0.5" | "end 0.4" | "end 0.3" | "center center"];
};

export function ScrollText({ text, as: Tag = "p", className, from = 0.1, offset = ["start 0.85", "end 0.4"] }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let index = 0;

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, w) => {
        const chars = [...word].map((ch) => {
          const i = index++;
          return <Char key={i} ch={ch} i={i} total={total} progress={scrollYProgress} from={from} />;
        });
        return (
          <span key={w} aria-hidden="true" style={{ display: "inline-block", whiteSpace: "pre" }}>
            {chars}
            {w < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </Tag>
  );
}

function Char({
  ch,
  i,
  total,
  progress,
  from,
}: {
  ch: string;
  i: number;
  total: number;
  progress: MotionValue<number>;
  from: number;
}) {
  const start = i / total;
  const end = Math.min(1, start + 1.5 / total + 0.02);
  const opacity = useTransform(progress, [start, end], [from, 1]);
  return <motion.span style={{ opacity }}>{ch}</motion.span>;
}
