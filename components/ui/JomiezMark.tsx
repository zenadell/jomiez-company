/*
 * The Jomiez mark: two interlocking hooks forming a pixel "Z", redrawn as a
 * vector from the logo on jomiez.com. It takes the place the template gives
 * its own pill logo (nav, section labels, tickers, cards, footer).
 */
const D =
  "M0 99.6Q0 93.6 5.98 93.06L85.02 85.94Q91 85.4 91 91.4L91 107.6Q91 113.6 85.12 114.78L41.88 123.42Q36 124.6 36 130.6L36 148Q36 154 42 154L160 154Q166 154 166 148L166 127Q166 121 172 121L195 121Q201 121 201 127L201 152Q201 158 195 158L177 158Q171 158 171 164L171 185Q171 191 165 191L38 191Q32 191 32 185L32 164Q32 158 26 158L6 158Q0 158 0 152ZM201 91.4Q201 97.4 195.02 97.94L115.98 105.06Q110 105.6 110 99.6L110 83.4Q110 77.4 115.88 76.22L159.12 67.58Q165 66.4 165 60.4L165 43Q165 37 159 37L41 37Q35 37 35 43L35 64Q35 70 29 70L6 70Q0 70 0 64L0 39Q0 33 6 33L24 33Q30 33 30 27L30 6Q30 0 36 0L163 0Q169 0 169 6L169 27Q169 33 175 33L195 33Q201 33 201 39Z";

type JomiezMarkProps = {
  /** Rendered height in px; width follows the mark's 201:191 proportions. */
  size?: number;
  /** Outline instead of solid, like the linework logo on jomiez.com. */
  outline?: boolean;
  className?: string;
  title?: string;
};

export function JomiezMark({ size = 20, outline = false, className, title }: JomiezMarkProps) {
  const width = Math.round((size * 201) / 191 * 100) / 100;
  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox={outline ? "-2 -2 205 195" : "0 0 201 191"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: "block", flex: "none" }}
    >
      {outline ? (
        <path d={D} fill="none" stroke="currentColor" strokeWidth={4} />
      ) : (
        <path d={D} fill="currentColor" />
      )}
    </svg>
  );
}
