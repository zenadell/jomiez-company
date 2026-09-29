"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLiveGlass } from "@/components/ui/useGlassSupport";
import { WORDMARK_PATH, WORDMARK_VIEWBOX as VB } from "./wordmark";

/*
 * The footer's giant "Jomiez", cast in liquid glass: each letter is a rounded
 * glass rod laid over the moss, so the scene behind swells through its body,
 * pours around its edges with a rainbow split and catches a sheen on the lit
 * side. The technique is liquid-glass's (github.com/samasante/liquid-glass): a
 * displacement map fed to an SVG filter that bends the live page through
 * backdrop-filter. The library's own maps are rounded rectangles, so the
 * letter-shaped map is built here: a distance field of the outline, domed into a
 * height field whose slope becomes the bend.
 *
 * Chromium with a GPU only, and only while `active` (the footer is on screen);
 * otherwise the solid white wordmark shows, as before.
 */

/* Map resolution cap; the filter stretches the map over the mark. */
const MAX_MAP_W = 1400;

const VIEWBOX = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
const MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" preserveAspectRatio="none"><path d="${WORDMARK_PATH}"/></svg>`,
)}")`;

type GlassWordmarkProps = {
  /** The word to show. The glass letters are cut for "Jomiez"; any other word is drawn solid. */
  text?: string;
  active: boolean;
  className?: string;
  textClassName?: string;
};

export function GlassWordmark({ text = "Jomiez", active, className, textClassName }: GlassWordmarkProps) {
  const live = useLiveGlass();
  const custom = text !== "Jomiez";
  const on = live && active && !custom;
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const map = useMemo(() => (on && width > 0 ? letterMap(Math.min(MAX_MAP_W, Math.round(width))) : null), [on, width]);
  const glass = on && map !== null;

  if (custom) {
    // A renamed company: solid letters in the display face, roughly as wide as the original mark.
    const w = Math.max(300, text.length * 178);
    return (
      <div ref={box} className={className} style={{ position: "relative" }}>
        <svg viewBox={`0 -248 ${w} 254`}>
          <text x="0" y="0" className={textClassName} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 330, letterSpacing: -14 }}>
            {text}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div ref={box} className={className} style={{ position: "relative" }}>
      <svg viewBox={VIEWBOX} style={{ opacity: glass ? 0 : 1, transition: "opacity 0.4s ease" }}>
        <path d={WORDMARK_PATH} className={textClassName} />
      </svg>
      {glass && <GlassLetters map={map} width={width} />}
    </div>
  );
}

function GlassLetters({ map, width }: { map: string; width: number }) {
  const id = `jomiez-word-${useId().replace(/:/g, "")}`;
  const height = (width * VB.h) / VB.w;
  // Bend reach, in px: at most half of this, at the rims.
  const scale = Math.round(width * 0.05);
  const margin = scale;
  const filter = `blur(0.6px) saturate(1.5) brightness(1.06) url(#${id})`;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: filter,
          WebkitBackdropFilter: filter,
          maskImage: MASK,
          WebkitMaskImage: MASK,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          animation: "glass-letters-in 0.6s ease both",
        }}
      >
        <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }}>
          <filter
            id={id}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
            x={-margin}
            y={-margin}
            width={width + margin * 2}
            height={height + margin * 2}
          >
            <feFlood floodColor="rgb(128,128,128)" result="bg" />
            <feImage href={map} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="raw" />
            <feComposite in="raw" in2="bg" operator="over" result="map" />
            {/* Red, green and blue bend by slightly different amounts: the rainbow rim. */}
            <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * 1.18} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * 1.09} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
            <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" result="bent" />
            {/* The map's blue channel is the sheen: lift it to white and add it on. */}
            <feColorMatrix in="map" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1.6 0 ${-128 / 255 * 1.6}`} result="sheen" />
            <feComposite in="sheen" in2="bent" operator="arithmetic" k2="1" k3="1" />
          </filter>
        </svg>
      </div>
      {/* A hairline rim so the letters read as cut glass even over busy moss. */}
      <svg
        aria-hidden="true"
        viewBox={VIEWBOX}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "glass-letters-in 0.6s ease both" }}
      >
        <path d={WORDMARK_PATH} fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

/*
 * The displacement map for the letters, as a PNG data URL. Red and green hold
 * the bend (128 = none), blue the sheen. Inside each stroke: distance to the
 * edge → a circular dome of radius R → its slope pulls the scene inward (a
 * magnifying rod) and lights the edges that face the top-left.
 */
const maps = new Map<number, string>();

function letterMap(w: number): string {
  const cached = maps.get(w);
  if (cached) return cached;

  const h = Math.round((w * VB.h) / VB.w);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const s = w / VB.w;
  ctx.setTransform(s, 0, 0, s, -VB.x * s, -VB.y * s);
  ctx.fill(new Path2D(WORDMARK_PATH));
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  const n = w * h;

  // Chamfer distance (in px) from each inside pixel to the outline.
  const dist = new Float32Array(n);
  for (let i = 0; i < n; i++) dist[i] = px[i * 4 + 3] > 127 ? 1e6 : 0;
  const D1 = 1;
  const D2 = Math.SQRT2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x > 0) d = Math.min(d, dist[i - 1] + D1);
      if (y > 0) {
        d = Math.min(d, dist[i - w] + D1);
        if (x > 0) d = Math.min(d, dist[i - w - 1] + D2);
        if (x < w - 1) d = Math.min(d, dist[i - w + 1] + D2);
      }
      dist[i] = d;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x < w - 1) d = Math.min(d, dist[i + 1] + D1);
      if (y < h - 1) {
        d = Math.min(d, dist[i + w] + D1);
        if (x < w - 1) d = Math.min(d, dist[i + w + 1] + D2);
        if (x > 0) d = Math.min(d, dist[i + w - 1] + D2);
      }
      dist[i] = d;
    }
  }

  // Dome each stroke: height rises in a quarter circle over the first R px.
  const R = Math.max(4, w * 0.026);
  const height = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = Math.min(dist[i] / R, 1);
    height[i] = dist[i] > 0 ? Math.sqrt(1 - (1 - t) * (1 - t)) : 0;
  }

  // Soften the chamfer's facets so the rims pour smoothly.
  blur(height, w, h, 2);
  blur(height, w, h, 2);

  // Slope → bend and sheen. Slopes are scaled by R so a full rim reads as ~1.
  const lx = 0.6;
  const ly = 0.8;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (px[o + 3] < 8) {
        px[o] = px[o + 1] = px[o + 2] = 128;
        px[o + 3] = 255;
        continue;
      }
      const gx = ((x < w - 1 ? height[i + 1] : height[i]) - (x > 0 ? height[i - 1] : height[i])) * 0.5 * R * 0.35;
      const gy = ((y < h - 1 ? height[i + w] : height[i]) - (y > 0 ? height[i - w] : height[i])) * 0.5 * R * 0.35;
      const bx = Math.max(-1, Math.min(1, gx));
      const by = Math.max(-1, Math.min(1, gy));
      const lit = Math.max(0, bx * lx + by * ly);
      const rim = 1 - height[i];
      const sheen = Math.min(1, Math.pow(lit, 1.4) * 0.95 + rim * 0.18);
      px[o] = Math.round(128 + 127 * bx);
      px[o + 1] = Math.round(128 + 127 * by);
      px[o + 2] = Math.round(128 + 127 * sheen);
      px[o + 3] = 255;
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL("image/png");
  maps.set(w, url);
  return url;
}

/* In-place separable box blur of a w x h field. */
function blur(field: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(field.length);
  const span = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += field[row + Math.min(w - 1, Math.max(0, x + k))];
      tmp[row + x] = sum / span;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      field[y * w + x] = sum / span;
    }
  }
}
