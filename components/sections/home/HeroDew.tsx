"use client";

import { Glass, glassValue, type GlassOptics } from "@samasante/liquid-glass";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGlassSupport } from "@/components/ui/useGlassSupport";

/*
 * A dewdrop of liquid glass (github.com/samasante/liquid-glass) drifting over the
 * hero meadow. It is a second copy of the hero photo, bent in place around a
 * round lens, laid exactly over the first: outside the drop the two are the same
 * pixels, inside it the grass magnifies with a chromatic rim. The drop follows the
 * cursor, wanders along the horizon when left alone, rests still under reduced
 * motion and pauses off screen. Browsers without a GPU keep the plain photo.
 */

const DEW: Partial<GlassOptics> = {
  mapSize: 512,
  clipToShape: true,
  softEdge: true,
  strength: 0.06,
  depth: 0.7,
  curvature: 0.62,
  dispersion: 0.75,
  bend: 0,
  bendWidth: 0.16,
  splay: 0,
  frost: 0.5,
  brightness: 0.06,
  specular: 1.3,
  sheenAngle: 35,
  sheen: 1,
  sheenWidth: 4,
  sheenFalloff: 1.6,
  glow: 0.22,
  glowSpread: 1,
  glowFalloff: 0.6,
  // A hairline rim and a soft contact shadow, so the drop still reads over bright sky.
  restEdgeShadow: "0 14px 34px rgba(26, 26, 26, 0.16)",
  restEdgeInsetShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.45), inset 0 -10px 22px rgba(255, 255, 255, 0.12)",
};

/* The hero photo's entrance (springSlow after a 0.2s delay) is still by then. */
const SETTLE_MS = 1600;

/* Where the drop rests: on the hillside, just under the glowing screen. */
const REST = { x: 0.5, y: 0.6 };

type HeroDewProps = {
  src: string;
  sizes: string;
  /** The base photo's class, so the copy crops identically. */
  imageClassName: string;
  className?: string;
};

export function HeroDew(props: HeroDewProps) {
  const supported = useGlassSupport();
  return supported ? <Dew {...props} /> : null;
}

function Dew({ src, sizes, imageClassName, className }: HeroDewProps) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const x = useMemo(() => glassValue(REST.x), []);
  const y = useMemo(() => glassValue(REST.y), []);
  const [box, setBox] = useState({ w: 0, h: 0 });
  // The glass measures its box once, and the hero photo enters scaled up; wait for
  // the entrance to settle so the copy is laid out at the photo's true size.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () =>
      setBox((b) => (b.w === el.offsetWidth && b.h === el.offsetHeight ? b : { w: el.offsetWidth, h: el.offsetHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The bend is per-axis on a wide box; scale the long axis down so the drop stays round.
  const optics = useMemo(() => {
    const { w, h } = box;
    if (!(w > 0 && h > 0)) return DEW;
    const m = Math.min(w, h);
    const strength = DEW.strength ?? 0.06;
    return { ...DEW, scaleX: (strength * m) / w, scaleY: (strength * m) / h };
  }, [box]);

  // Drop diameter: ~13% of the panel width, between 120 and 210px.
  const d = Math.round(Math.min(210, Math.max(120, box.w * 0.13)));

  useEffect(() => {
    const el = boxRef.current;
    if (!el || reduce) {
      x.set(REST.x);
      y.set(REST.y);
      return;
    }
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    let visible = false;
    const start = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      let tx: number;
      let ty: number;
      let ease: number;
      const r = el.getBoundingClientRect();
      const px = pointer && (pointer.x - r.left) / r.width;
      const py = pointer && (pointer.y - r.top) / r.height;
      if (px !== null && py !== null && px >= 0 && px <= 1 && py >= 0 && py <= 1) {
        tx = px;
        ty = py;
        ease = 0.14;
      } else {
        // A slow figure-eight along the horizon.
        const a = ((now - start) / 1000) * 0.22;
        tx = 0.5 + 0.3 * Math.sin(a);
        ty = REST.y + 0.06 * Math.sin(2 * a);
        ease = 0.035;
      }
      const cx = x.get();
      const cy = y.get();
      if (Math.abs(tx - cx) > 1e-4 || Math.abs(ty - cy) > 1e-4) {
        x.set(cx + (tx - cx) * ease);
        y.set(cy + (ty - cy) * ease);
      }
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") pointer = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => (pointer = null);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", run);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", run);
    };
  }, [reduce, x, y]);

  return (
    <div ref={boxRef} className={className} aria-hidden="true">
      {settled && box.w > 0 && (
        <Glass
          optics={optics}
          center={{ x, y }}
          size={d}
          radius={d / 2}
          unstable_lens={{ restShadowOpacity: 1 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Image src={src} alt="" fill sizes={sizes} className={imageClassName} />
        </Glass>
      )}
    </div>
  );
}
