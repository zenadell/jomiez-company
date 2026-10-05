"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import type { CSSProperties, ReactNode } from "react";
import { useLiveGlass } from "@/components/ui/useGlassSupport";

/*
 * The app's glass: a frosted, edge-lit pane everywhere (iPhone, Android,
 * desktop), and where the browser can bend the live page (Chrome on Android,
 * with a GPU), the same deep liquid glass as the site's nav underneath it.
 */

const OPTICS: Partial<GlassOptics> = {
  mapSize: 256,
  strength: 0.08,
  depth: 0.9,
  curvature: 0.55,
  bend: 0.9,
  bendWidth: 0.3,
  dispersion: 0.35,
  frost: 3,
  saturate: 1.5,
  specular: 1.3,
  sheenAngle: 40,
  sheen: 1.1,
  sheenWidth: 2.5,
  sheenFalloff: 1.4,
  glow: 0.16,
  glowSpread: 1,
  glowFalloff: 0.6,
};

export function GlassPane({
  className = "",
  children,
  optics,
  style,
  tone = "clear",
}: {
  className?: string;
  children?: ReactNode;
  optics?: Partial<GlassOptics>;
  style?: CSSProperties;
  /** clear: see-through; thick: for sheets and cards with a lot of text. */
  tone?: "clear" | "thick";
}) {
  const live = useLiveGlass();
  return (
    <div className={`ja-glass ja-glass--${tone} ${className}`} data-live={live ? "" : undefined} style={style}>
      {live && (
        <Glass optics={{ ...OPTICS, ...optics }} className="ja-glass__lens">
          <span />
        </Glass>
      )}
      {children}
    </div>
  );
}
