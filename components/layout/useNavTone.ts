"use client";

import { useEffect, type RefObject } from "react";

/*
 * Clear glass nav, readable text: each nav item ([data-tone-target]) looks at
 * what the page shows right behind it and gets data-tone="dark" (switch to
 * white text) or "light" (dark text). The shade comes from the elements under
 * the item's centre: solid backgrounds by colour, photos by sampling the image
 * pixel actually shown there (object-fit and object-position respected).
 * Re-checked about ten times a second while scrolling, and now and then for
 * anything that moves on its own.
 */

type Pixels = { w: number; h: number; data: Uint8ClampedArray } | null;
const images = new Map<string, Pixels>();

/* The image, shrunk to at most 96px wide, as raw pixels (null if unreadable). */
function pixels(img: HTMLImageElement): Pixels {
  const src = img.currentSrc || img.src;
  if (images.has(src)) return images.get(src) ?? null;
  if (!img.complete || !img.naturalWidth) return null;
  let out: Pixels = null;
  try {
    const w = Math.min(96, img.naturalWidth);
    const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, w, h);
      out = { w, h, data: ctx.getImageData(0, 0, w, h).data };
    }
  } catch {
    out = null;
  }
  images.set(src, out);
  return out;
}

const luma = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/* Where along an axis the image sits, from one object-position token. */
function offset(token: string | undefined, free: number): number {
  if (!token || token === "center") return free / 2;
  if (token === "left" || token === "top") return 0;
  if (token === "right" || token === "bottom") return free;
  if (token.endsWith("%")) return (free * parseFloat(token)) / 100;
  return parseFloat(token) || 0;
}

/* Luminance (0-1) of an image at a viewport point, or null. */
function imageLuma(img: HTMLImageElement, x: number, y: number): number | null {
  const px = pixels(img);
  if (!px) return null;
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const fit = cs.objectFit;
  let sx = r.width / img.naturalWidth;
  let sy = r.height / img.naturalHeight;
  if (fit === "cover") sx = sy = Math.max(sx, sy);
  else if (fit === "contain" || fit === "scale-down") sx = sy = Math.min(sx, sy);
  const [px0, py0] = cs.objectPosition.split(" ");
  const ox = offset(px0, r.width - img.naturalWidth * sx);
  const oy = offset(py0, r.height - img.naturalHeight * sy);
  const u = (x - r.left - ox) / (img.naturalWidth * sx);
  const v = (y - r.top - oy) / (img.naturalHeight * sy);
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const i = (Math.min(px.h - 1, Math.floor(v * px.h)) * px.w + Math.min(px.w - 1, Math.floor(u * px.w))) * 4;
  if (px.data[i + 3] < 128) return null;
  return luma(px.data[i], px.data[i + 1], px.data[i + 2]);
}

const RGBA = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/;

/* Luminance of the page at a point, looking through everything in `skip`. */
function lumaAt(x: number, y: number, skip: (el: Element) => boolean): number {
  let lum = 0;
  let cover = 0; // how much of the pixel is already decided, 0-1
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip(el)) continue;
    if (el instanceof HTMLImageElement) {
      const l = imageLuma(el, x, y);
      if (l !== null) {
        lum += (1 - cover) * l;
        return lum;
      }
      continue;
    }
    const m = RGBA.exec(getComputedStyle(el).backgroundColor);
    if (!m) continue;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (a <= 0.02) continue;
    lum += (1 - cover) * a * luma(+m[1], +m[2], +m[3]);
    cover += (1 - cover) * a;
    if (cover > 0.98) return lum;
  }
  return lum + (1 - cover); // nothing opaque: the white page
}

export function useNavTone(active: boolean, roots: RefObject<HTMLElement | null>[], key: string) {
  useEffect(() => {
    if (!active) return;
    const skip = (el: Element) => roots.some((r) => r.current?.contains(el));

    const check = () => {
      for (const { current: root } of roots) {
        if (!root) continue;
        const targets = [...root.querySelectorAll<HTMLElement>("[data-tone-target]")];
        if (root.matches("[data-tone-target]")) targets.push(root);
        targets.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width) return;
          const l = lumaAt(r.left + r.width / 2, r.top + r.height / 2, skip);
          // A little hysteresis so mid-tones don't flicker.
          const was = el.dataset.tone;
          const tone = l < (was === "dark" ? 0.58 : 0.48) ? "dark" : "light";
          if (tone !== was) el.dataset.tone = tone;
        });
      }
    };

    let timer = 0;
    let last = 0;
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        last = performance.now();
        check();
      }, Math.max(0, 90 - (performance.now() - last)));
    };

    check();
    const settle = window.setTimeout(check, 700);
    const every = window.setInterval(check, 1500);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
      clearInterval(every);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // `roots` are stable refs; `key` re-runs the check on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key]);
}
