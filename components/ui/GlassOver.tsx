"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import Image from "next/image";
import { useGlassSupport } from "@/components/ui/useGlassSupport";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * A liquid-glass panel floating over a photo (github.com/samasante/liquid-glass).
 * The lens refracts a position-matched copy of the photo behind it, which is what
 * lets the bend, the chromatic rim and the sheen render in Chrome, Safari and
 * Firefox alike. The photo must cover the nearest [data-glass-frame] ancestor
 * (object-fit: cover); children render crisp on top of the glass.
 *
 * Where glass can't run smoothly (see useGlassSupport), or while `active` is
 * false, only the children render; the wrapper carries `data-glass` when the
 * lens is on, so a stylesheet can give the plain state a frosted fallback.
 */

/* How far the copied photo extends past the panel, so the rim bend has pixels to pull in. */
const BLEED = 24;

/* Apple-style panel glass: a light frost, a liquid rim bend and a soft sheen. */
export const PANEL_GLASS: Partial<GlassOptics> = {
  mapSize: 256,
  clipToShape: true,
  softEdge: true,
  depth: 1,
  curvature: 0.5,
  dispersion: 0.6,
  strength: 0.17,
  bend: 0.7,
  bendWidth: 0.12,
  frost: 3,
  brightness: 0.12,
  specular: 1.3,
  sheenAngle: 50,
  glow: 0.3,
  glowSpread: 1,
  glowFalloff: 1,
  sheen: 1.3,
  sheenWidth: 3,
};

type GlassOverProps = {
  /** The photo the frame is covered with. */
  src: string;
  /** Same `sizes` as the frame's own <Image>, so the copy reuses the cached file. */
  sizes?: string;
  objectPosition?: string;
  /** CSS filter the frame applies to its photo (e.g. grayscale). */
  imageFilter?: string;
  /** Any CSS background layered over the photo in the frame (a shade gradient). */
  overlay?: string;
  radius: number;
  optics?: Partial<GlassOptics>;
  /** Fill for the thin bleed ring around the copy. */
  behind?: string;
  /** Mount the lens only while this is true (e.g. while its section is on screen). */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function GlassOver({
  src,
  sizes = "100vw",
  objectPosition = "center",
  imageFilter,
  overlay,
  radius,
  optics,
  behind = "#1a1a1a",
  active = true,
  className,
  style,
  children,
}: GlassOverProps) {
  const supported = useGlassSupport();
  const box = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });

  // Lens size follows the panel; the copy is sized to the frame it mirrors.
  useLayoutEffect(() => {
    const el = box.current;
    const frame = el?.closest<HTMLElement>("[data-glass-frame]");
    if (!el || !frame) return;
    const measure = () => {
      setSize((s) =>
        s.w === el.offsetWidth && s.h === el.offsetHeight
          ? s
          : { w: el.offsetWidth, h: el.offsetHeight },
      );
      setFrameSize((s) =>
        s.w === frame.offsetWidth && s.h === frame.offsetHeight
          ? s
          : { w: frame.offsetWidth, h: frame.offsetHeight },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  const on = supported && active && size.w > 0 && size.h > 0 && frameSize.w > 0;

  // Keep the copy registered to the real photo while the panel moves (parallax,
  // entrance animations): only while on screen, and only writing on change.
  useEffect(() => {
    const el = box.current;
    const frame = el?.closest<HTMLElement>("[data-glass-frame]");
    if (!on || !el || !frame) return;
    let raf = 0;
    let last = "";
    let lastEl: HTMLDivElement | null = null;
    const sync = () => {
      const c = copy.current;
      if (c) {
        const a = el.getBoundingClientRect();
        const f = frame.getBoundingClientRect();
        const t = `translate(${Math.round(f.left - a.left + BLEED)}px, ${Math.round(f.top - a.top + BLEED)}px)`;
        if (t !== last || c !== lastEl) {
          c.style.transform = t;
          last = t;
          lastEl = c;
        }
      }
      raf = requestAnimationFrame(sync);
    };
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) raf = requestAnimationFrame(sync);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [on, size.w, frameSize.w]);

  return (
    <div
      ref={box}
      className={className}
      data-glass={on ? "" : undefined}
      style={{ position: "relative", borderRadius: radius, ...style }}
    >
      {on && (
        // Own compositing layer: repaints elsewhere (the pixel arrow ticking, marquees)
        // then don't re-run the glass filter. The transform sits on this wrapper, never
        // on the filtered element itself (Safari drops url() filters on those).
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            willChange: "transform",
            contain: "paint",
          }}
        >
          <Glass
            optics={{ ...PANEL_GLASS, ...optics }}
            brightnessInFilter
            width={size.w}
            height={size.h}
            radius={radius}
            behind={behind}
            refract={
              // Only a panel-sized window of the photo (plus bleed) is copied, so the
              // filter works on a small patch rather than the whole frame.
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -BLEED,
                  top: -BLEED,
                  width: size.w + BLEED * 2,
                  height: size.h + BLEED * 2,
                  overflow: "hidden",
                }}
              >
                <div
                  ref={copy}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: frameSize.w,
                    height: frameSize.h,
                  }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes={sizes}
                    style={{
                      objectFit: "cover",
                      objectPosition,
                      filter: imageFilter,
                    }}
                  />
                  {overlay && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: overlay,
                      }}
                    />
                  )}
                </div>
              </div>
            }
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius,
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <div style={{ position: "relative", height: "100%" }}>{children}</div>
    </div>
  );
}
