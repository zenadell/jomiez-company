"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

/*
 * Lines of display type sized so the widest one spans its box exactly, in
 * whatever typeface the page uses (glyph widths differ too much between faces
 * to compute on the server). The server's estimate (--size) shows first; the
 * browser corrects it once the font has loaded, and again on resize. `maxVh`
 * keeps a very short name from growing taller than the screen.
 */
export function FitText({ lines, className, style, maxVh = 34, label }: { lines: string[]; className?: string; style?: CSSProperties; maxVh?: number; label?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      const avail = el.clientWidth;
      const widest = Math.max(...[...el.querySelectorAll<HTMLElement>("[data-line]")].map((s) => s.scrollWidth));
      if (!avail || !widest) return;
      const now = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${Math.min((now * avail) / widest, (window.innerHeight * maxVh) / 100)}px`;
    };
    fit();
    void document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [maxVh, lines]);
  return (
    <div ref={ref} className={className} style={style} role={label ? "heading" : undefined} aria-level={label ? 1 : undefined} aria-label={label}>
      {lines.map((l, i) => (
        <span key={i} style={{ "--i": i } as CSSProperties}>
          <span data-line="">{l}</span>
        </span>
      ))}
    </div>
  );
}
