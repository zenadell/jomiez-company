"use client";

import { useEffect, useState } from "react";

/*
 * The template's "Animation 1–14" icon: a double chevron (>>) drawn on a
 * 10x5 grid of 3px squares, stepping one column right every ~205ms and
 * wrapping on a 14-column period. Only the lit cells are drawn.
 */
const PERIOD = 14;
const FRAME_MS = 205;
const COLS = 10;
const ROWS = 5;
const CELL = 3;

// Lit columns per row for the frame-1 position (the pattern repeats every 14 columns).
const PATTERN: number[][] = [
  [1, 2, 5, 6],
  [2, 3, 6, 7],
  [3, 4, 7, 8],
  [2, 3, 6, 7],
  [1, 2, 5, 6],
];

function litCells(frame: number) {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < ROWS; row++) {
    const lit = PATTERN[row];
    for (let col = 0; col < COLS; col++) {
      const src = (((col - frame) % PERIOD) + PERIOD) % PERIOD;
      if (lit.includes(src)) cells.push([col, row]);
    }
  }
  return cells;
}

const FRAMES = Array.from({ length: PERIOD }, (_, f) => litCells(f));

type PixelArrowProps = {
  /** Visible window width in px; the 30px sprite is centred inside it (small buttons use 16). */
  width?: number;
  color?: string;
  className?: string;
  /** Hold the full double chevron (the template's hover state) instead of marching. */
  paused?: boolean;
};

export function PixelArrow({ width = 30, color = "currentColor", className, paused = false }: PixelArrowProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((f) => (f + 1) % PERIOD), FRAME_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const frame = paused ? 0 : tick;

  const offset = (width - COLS * CELL) / 2;

  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: "block", width, height: ROWS * CELL, overflow: "hidden", position: "relative", flex: "none" }}
    >
      <svg
        width={COLS * CELL}
        height={ROWS * CELL}
        viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
        style={{ position: "absolute", left: offset, top: 0 }}
      >
        {FRAMES[frame].map(([c, r]) => (
          <rect key={`${c}-${r}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={color} />
        ))}
      </svg>
    </span>
  );
}
