"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./GlassText.module.css";

/*
 * Text that stays readable on clear glass over anything. Every pixel of every
 * letter takes the opposite of whatever shows behind it, white over dark and ink
 * over light, so a word crossing an edge splits exactly along it, and page text
 * scrolling underneath can't swallow it.
 *
 * How: the letters are cut out of a backdrop-filter that turns the backdrop to
 * pure black or white and inverts it. The cut is a mask: the same string drawn
 * on a canvas in the same computed font, on the real text's baseline. The real
 * text stays in the DOM (transparent) for layout, selection and screen readers.
 *
 * Nothing between this and its backdrop may be translucent: an ancestor with
 * opacity below 1 (or a filter or mask) cuts the letters off from the page.
 */

/* Room around the text box for glyphs that overhang it. */
const PAD = 3;

const masks = new Map<string, string>();

function letterMask(text: string, font: string, spacing: string, w: number, h: number, baseline: number): string {
  const dpr = Math.min(3, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
  const key = [text, font, spacing, w, h, baseline, dpr].join("|");
  const hit = masks.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((w + PAD * 2) * dpr);
  canvas.height = Math.ceil((h + PAD * 2) * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(dpr, dpr);
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = spacing;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(text, PAD, PAD + baseline);
  const url = `url(${canvas.toDataURL("image/png")})`;
  masks.set(key, url);
  return url;
}

export function GlassText({ children }: { children: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [mask, setMask] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    const base = probe.current;
    if (!el || !base) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const cs = getComputedStyle(el);
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const url = letterMask(children, font, cs.letterSpacing, el.offsetWidth, el.offsetHeight, base.offsetTop);
      setMask((m) => (m === url || !url ? m : url));
    };
    // The canvas can only draw the site font once it has loaded.
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(() => document.fonts.ready.then(measure));
    ro.observe(el);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [children]);

  return (
    <span ref={box} className={styles.box} data-ready={mask ? "" : undefined}>
      {children}
      {/* A zero-size inline block sits on the baseline, so its offsetTop is the baseline. */}
      <span ref={probe} className={styles.probe} aria-hidden="true" />
      {mask && (
        <span
          className={styles.ink}
          style={{ inset: -PAD, maskImage: mask, WebkitMaskImage: mask }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
