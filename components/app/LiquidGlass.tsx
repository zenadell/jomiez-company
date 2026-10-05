"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/*
 * Liquid glass for the phone app, the way Apple's is made (WWDC25, "Meet Liquid
 * Glass"): it lenses what's behind it, bending and concentrating light at the
 * rim, with a bright specular edge, and lights up from inside under your finger.
 *
 * iPhone Safari can't bend the live page (backdrop-filter: url() is Chromium
 * only), so every pane bends a copy of the app's wallpaper instead, lined up
 * exactly with the real one behind it (the library's "refract a copy" mode,
 * which works in Safari, Chrome and Firefox alike). The wallpaper never moves,
 * so the copy is always right.
 */

export const WALLPAPER = "/app/wallpaper.webp";
export const WALLPAPER_CSS = `url(${WALLPAPER}) center bottom / cover no-repeat, #0b1a12`;

/* ---------- The wallpaper, and where it is ---------- */

type Frame = { el: HTMLElement | null; w: number; h: number; tick: number };
const FrameContext = createContext<Frame>({ el: null, w: 0, h: 0, tick: 0 });

/** The app's frame: holds the wallpaper, and tells every pane its size. */
export function WallpaperFrame({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame>({ el: null, w: 0, h: 0, tick: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFrame((f) => ({ el, w: el.clientWidth, h: el.clientHeight, tick: f.tick + 1 }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Anything that moves panes without resizing them (the keyboard, a screen change) says so.
    window.addEventListener("ja-layout", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("ja-layout", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <div ref={ref} className={`lg-frame ${className}`}>
      <div className="lg-wallpaper" aria-hidden="true" />
      <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
    </div>
  );
}

/** The wallpaper again, as a screen's own background (it moves and scales with the screen, like the glass on it). */
export const Wallpaper = ({ className = "" }: { className?: string }) => <div className={`lg-wallpaper ${className}`} aria-hidden="true" />;

/** Tells the panes something moved (call after a layout change that resizes nothing). */
export const relayout = () => window.dispatchEvent(new Event("ja-layout"));

/* ---------- The material ---------- */

/** Regular: controls and bars. Thick: sheets and big panels (deeper lensing, softer, more frost). */
const OPTICS: Record<"regular" | "thick" | "drop" | "tint", Partial<GlassOptics>> = {
  regular: {
    mapSize: 256,
    clipToShape: true,
    softEdge: true,
    depth: 1,
    curvature: 0.42,
    bend: 0.85,
    bendWidth: 0.2,
    strength: 0.14,
    dispersion: 0.5,
    frost: 3.5,
    brightness: 0.08,
    specular: 1.4,
    sheenAngle: 45,
    sheen: 1.4,
    sheenWidth: 2.5,
    sheenFalloff: 1.3,
    glow: 0.3,
    glowSpread: 0.9,
    glowFalloff: 1,
  },
  thick: {
    mapSize: 256,
    clipToShape: true,
    softEdge: true,
    depth: 0.5,
    curvature: 0.25,
    bend: 0.9,
    bendWidth: 0.08,
    strength: 0.06,
    dispersion: 0.45,
    frost: 24,
    brightness: 0.06,
    specular: 1.2,
    sheenAngle: 45,
    sheen: 1.2,
    sheenWidth: 2.5,
    sheenFalloff: 1.3,
    glow: 0.2,
    glowSpread: 0.6,
    glowFalloff: 1,
  },
  // Tinted: the colour is the CSS veil over it (glass.css); the lens just gives it a rim.
  tint: {
    mapSize: 256,
    clipToShape: true,
    softEdge: true,
    depth: 1,
    curvature: 0.5,
    bend: 0.8,
    bendWidth: 0.22,
    strength: 0.12,
    dispersion: 0.3,
    frost: 3,
    brightness: 0,
    specular: 1.6,
    sheenAngle: 45,
    sheen: 1.4,
    sheenWidth: 2.5,
    sheenFalloff: 1.3,
    glow: 0.25,
    glowSpread: 0.9,
    glowFalloff: 1,
  },
  // A droplet: a full dome that magnifies what's under it (the agent's presence).
  drop: {
    mapSize: 256,
    clipToShape: true,
    softEdge: true,
    depth: 1,
    curvature: 1,
    bend: 0.6,
    bendWidth: 0.18,
    strength: 0.3,
    dispersion: 0.7,
    frost: 0.5,
    brightness: 0.16,
    specular: 2,
    sheenAngle: 40,
    sheen: 1.6,
    sheenWidth: 3,
    sheenFalloff: 1.2,
    glow: 0.45,
    glowSpread: 1,
    glowFalloff: 0.8,
  },
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * A pane of liquid glass. Size and place it with CSS like any element; its
 * children sit crisp on top. `press` makes it a control: it flexes and lights
 * up from inside where it's touched.
 */
export function LiquidGlass({
  children,
  className = "",
  style,
  radius,
  material = "regular",
  optics,
  press = false,
  as: Tag = "div",
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Corner radius in px; omit for a pill (half the height). */
  radius?: number;
  material?: "regular" | "thick" | "drop" | "tint";
  optics?: Partial<GlassOptics>;
  press?: boolean;
  as?: "div" | "button" | "section" | "header" | "nav" | "form";
} & Record<string, unknown>) {
  const frame = useContext(FrameContext);
  const ref = useRef<HTMLElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  // Where the pane sits over the wallpaper, from the layout itself (offsets), so
  // passing motion (a press, a screen sliding, the app settling back behind a
  // sheet) moves pane and wallpaper together and the copy stays lined up.
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || !frame.el) return;
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== frame.el) {
      x += node.offsetLeft;
      y += node.offsetTop;
      const parent = node.offsetParent as HTMLElement | null;
      if (parent && parent !== frame.el) {
        x -= parent.scrollLeft;
        y -= parent.scrollTop;
      }
      node = parent;
    }
    if (node !== frame.el) return;
    const next = { x, y, w: el.offsetWidth, h: el.offsetHeight };
    setRect((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next));
  }, [frame.el]);

  useLayoutEffect(() => {
    measure();
  }, [measure, frame.tick, frame.w, frame.h]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Entering with a spring: measure again as it settles (a measure that finds nothing new costs nothing).
    const late = [300, 700, 1300].map((ms) => window.setTimeout(measure, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => window.clearTimeout(t));
    };
  }, [measure]);

  // Light from inside, starting under the finger.
  const onPointerDown = press
    ? (e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--lg-x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--lg-y", `${e.clientY - r.top}px`);
      }
    : undefined;

  const r = radius ?? (rect ? rect.h / 2 : 999);
  const El = Tag as "div";
  return (
    <El
      ref={ref as React.Ref<HTMLDivElement>}
      className={`lg lg--${material}${press ? " lg--press" : ""} ${className}`}
      style={{ borderRadius: r, ...style }}
      onPointerDown={onPointerDown}
      {...rest}
    >
      {rect && rect.w > 0 && rect.h > 0 && frame.w > 0 && (
        <Glass
          className="lg__lens"
          optics={{ ...OPTICS[material], ...optics }}
          brightnessInFilter
          width={rect.w}
          height={rect.h}
          radius={r}
          behind="#0d2217"
          refract={
            <div
              aria-hidden="true"
              style={{ position: "absolute", left: -rect.x, top: -rect.y, width: frame.w, height: frame.h, background: WALLPAPER_CSS }}
            />
          }
        />
      )}
      <span className="lg__light" aria-hidden="true" />
      {children}
    </El>
  );
}
