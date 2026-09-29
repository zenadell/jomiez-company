"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import { useEffect, useRef } from "react";
import { useCursorLens } from "@/components/ui/useGlassSupport";
import styles from "./CursorLens.module.css";

/*
 * A drop of liquid glass that rides the cursor across the whole site
 * (github.com/samasante/liquid-glass). It is a backdrop-filter lens, so it bends
 * the live page under it: text, photos, cards and buttons all magnify with a
 * chromatic rim, and nothing is copied. Chromium with a GPU and a mouse only
 * (see useCursorLens); it never takes clicks, and steps aside over form fields.
 */

const LENS: Partial<GlassOptics> = {
  mapSize: 256,
  clipToShape: true,
  softEdge: true,
  strength: 0.2,
  depth: 0.6,
  curvature: 0.62,
  dispersion: 0.7,
  bend: 0.12,
  bendWidth: 0.16,
  splay: 0,
  frost: 0,
  saturate: 1.12,
  brightness: 0.03,
  specular: 1.2,
  sheenAngle: 35,
  sheen: 1,
  sheenWidth: 4,
  sheenFalloff: 1.6,
  glow: 0.22,
  glowSpread: 1,
  glowFalloff: 0.6,
};

/* Where the drop steps aside so typing and embeds stay clear. */
const AVOID = "input, textarea, select, iframe, [contenteditable='true']";

/** `size` is the drop's diameter in px (set in the admin's Effects). */
export function CursorLens({ size = 132 }: { size?: number }) {
  return useCursorLens() ? <Lens key={size} D={size} /> : null;
}

function Lens({ D }: { D: number }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = wrap.current;
    const glass = node?.firstElementChild as HTMLElement | null;
    if (!node || !glass) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let placed = false;
    let raf = 0;

    const place = () => {
      node.style.transform = `translate3d(${x - D / 2}px, ${y - D / 2}px, 0)`;
    };
    // Opacity goes on the glass element itself: on an ancestor, a fade below 1
    // would cut the backdrop off from the page mid-fade.
    const show = (on: boolean) => {
      glass.style.opacity = on ? "1" : "0";
    };

    // A little lag behind the pointer reads as liquid; stop ticking once it lands.
    const tick = () => {
      x += (tx - x) * 0.32;
      y += (ty - y) * 0.32;
      if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) {
        x = tx;
        y = ty;
        raf = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      place();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!placed) {
        x = tx;
        y = ty;
        placed = true;
        place();
      }
      const avoid = e.target instanceof Element && e.target.closest(AVOID);
      show(!avoid);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) show(false);
    };
    const onBlur = () => show(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("blur", onBlur);
    };
  }, [D]);

  return (
    <div ref={wrap} className={styles.lens} aria-hidden="true">
      <Glass optics={LENS} radius={D / 2} className={styles.glass} style={{ width: D, height: D, opacity: 0 }}>
        <span />
      </Glass>
    </div>
  );
}
