/*
 * Setting a name as large as the screen allows: split into lines that balance
 * (a long name gets two or three), each sized in vw from its own length so it
 * spans the width without wrapping. `aspect` is the type's average glyph
 * width in em (capitals and wide faces run wider, condensed faces narrower).
 */
export function fitName(name: string, opts: { maxLine?: number; width?: number; aspect?: number; max?: number } = {}) {
  const maxLine = opts.maxLine ?? 12;
  const width = opts.width ?? 94;
  const aspect = opts.aspect ?? 0.56;
  const words = name.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > maxLine) {
      lines.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  // Every line is set at one size, from the longest, so the block reads as one name.
  const longest = Math.max(...lines.map((l) => l.length));
  const vw = Math.min(opts.max ?? 24, width / (longest * aspect));
  return { lines, size: `${vw.toFixed(2)}vw` };
}

/** Average glyph width for a type system's display face. */
export function aspectOf(t: { display: { family: string; transform?: string } }) {
  if (/condensed|anton|bebas|big shoulders/i.test(t.display.family)) return 0.42;
  if (/unbounded|panchang|wide/i.test(t.display.family)) return 0.78;
  return t.display.transform === "uppercase" ? 0.66 : 0.56;
}
