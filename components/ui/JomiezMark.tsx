import Image from "@/components/ui/Image";

/*
 * The Jomiez "Z", redrawn as a vector from the master logo
 * (scripts/brand/jomiez-logo.webp). The single-colour mark takes the place the
 * template gives its own logo in section labels, tickers, cards and chips;
 * JomiezIcon below is the full-colour app icon for the nav and footer.
 */
const D =
  "M29 104L129.5 3.5A12 12 0 0 1 138 0L382 0A70 70 0 0 1 452 70L452 86A147 147 0 0 1 409 190L262 337L417 337A30 30 0 0 1 447 367L447 407A34 34 0 0 1 413 441L97 441A97 97 0 0 1 0 344L0 331A111 111 0 0 1 107 220Q110 220 110 224L110 328A9.5 9.5 0 0 0 126 335L340.7 120.3A9.5 9.5 0 0 0 334 104Z";
const VB_W = 452;
const VB_H = 441;

type JomiezMarkProps = {
  /** Rendered height in px; width follows the mark's proportions. */
  size?: number;
  /** Outline instead of solid. */
  outline?: boolean;
  className?: string;
  title?: string;
};

export function JomiezMark({ size = 20, outline = false, className, title }: JomiezMarkProps) {
  const width = Math.round(((size * VB_W) / VB_H) * 100) / 100;
  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox={outline ? `-4 -4 ${VB_W + 8} ${VB_H + 8}` : `0 0 ${VB_W} ${VB_H}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: "block", flex: "none" }}
    >
      {outline ? (
        <path d={D} fill="none" stroke="currentColor" strokeWidth={8} />
      ) : (
        <path d={D} fill="currentColor" />
      )}
    </svg>
  );
}

/* The full-colour Jomiez app icon: the white "Z" on its dark-to-orange rounded square. */
export function JomiezIcon({ size = 32, className, alt = "" }: { size?: number; className?: string; alt?: string }) {
  return (
    <Image
      src="/media/brand/jomiez-icon.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flex: "none" }}
    />
  );
}
