import { techLogos } from "./techLogos";

/* The logo glyph for a tech-stack name (22px, current colour); nothing if we have no logo for it. */
export function TechMark({ name, size = 22 }: { name: string; size?: number }) {
  const logo = techLogos[name];
  if (!logo) return null;
  if ("mask" in logo) {
    const mask = `url(${logo.mask}) center / contain no-repeat`;
    return (
      <span
        aria-hidden="true"
        style={{ display: "block", flex: "none", width: size, height: size, background: "currentColor", mask, WebkitMask: mask }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <path d={logo.path} fill="currentColor" />
    </svg>
  );
}
