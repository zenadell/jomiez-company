import type { CSSProperties } from "react";

/*
 * Framer's progressive blur: eight stacked backdrop-filter layers whose blur
 * doubles each step, each masked to its own band so the blur ramps smoothly.
 */
const STEPS = [0.0390625, 0.078125, 0.15625, 0.3125, 0.625, 1.25, 2.5, 5];

type Props = {
  direction?: "down" | "up";
  className?: string;
  style?: CSSProperties;
  strength?: number;
};

export function ProgressiveBlur({ direction = "down", className, style, strength = 1 }: Props) {
  // "down": strongest at the top edge (nav bar). "up": strongest at the bottom edge (hero footer).
  const angle = direction === "down" ? "to top" : "to bottom";
  return (
    <div className={className} style={{ pointerEvents: "none", overflow: "hidden", ...style }} aria-hidden="true">
      {STEPS.map((blur, i) => {
        const start = i * 12.5;
        const mask = `linear-gradient(${angle}, rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${start + 12.5}%, rgba(0,0,0,1) ${start + 25}%, rgba(0,0,0,0) ${start + 37.5}%)`;
        return (
          <div
            key={blur}
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: `blur(${blur * strength}px)`,
              WebkitBackdropFilter: `blur(${blur * strength}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
