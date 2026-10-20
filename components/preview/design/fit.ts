/*
 * Setting a name as large as the screen allows: split into lines that balance
 * (a long name gets two, a very long one three), sized in vw from the longest
 * so the block spans the width without wrapping. `aspect` is the type's average glyph
 * width in em (capitals and wide faces run wider, condensed faces narrower).
 */
export function fitName(name: string, opts: { maxLine?: number; width?: number; aspect?: number; max?: number } = {}) {
  const maxLine = opts.maxLine ?? 12;
  const width = opts.width ?? 94;
  const aspect = opts.aspect ?? 0.56;
  const words = name.trim().split(/\s+/);
  // The split into lines whose longest is shortest: one line if it fits, else two, three only for a very long name.
  const best = (count: number): string[] => {
    if (count <= 1 || words.length < count) return [words.join(" ")];
    let top: string[] = [words.join(" ")];
    const cut = (from: number, left: number, acc: string[]) => {
      if (left === 1) {
        const lines = [...acc, words.slice(from).join(" ")];
        if (Math.max(...lines.map((l) => l.length)) < Math.max(...top.map((l) => l.length))) top = lines;
        return;
      }
      for (let i = from + 1; i <= words.length - left + 1; i++) cut(i, left - 1, [...acc, words.slice(from, i).join(" ")]);
    };
    cut(0, count, []);
    return top;
  };
  const longestOf = (ls: string[]) => Math.max(...ls.map((l) => l.length));
  let lines = best(1);
  if (longestOf(lines) > maxLine) lines = best(2);
  if (longestOf(lines) > maxLine * 1.6) lines = best(3);
  // Every line is set at one size, from the longest, so the block reads as one name.
  const vw = Math.min(opts.max ?? 24, width / (longestOf(lines) * aspect));
  return { lines, size: `${vw.toFixed(2)}vw` };
}

/** Average glyph width for a type system's display face. */
export function aspectOf(t: { display: { family: string; transform?: string } }) {
  if (/condensed|anton|bebas|big shoulders/i.test(t.display.family)) return 0.42;
  if (/unbounded|panchang|wide/i.test(t.display.family)) return 0.78;
  return t.display.transform === "uppercase" ? 0.66 : 0.56;
}
