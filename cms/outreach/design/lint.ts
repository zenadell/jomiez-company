/*
 * The words of a preview, checked for the things that make a page read as
 * generated (Taste Skill's copy tells, github.com/Leonxlnx/taste-skill, MIT):
 * the genre's verbs and adjectives, "not just X, it's Y", exclamation marks,
 * shouting capitals, middle-dot labels, em dashes everywhere, a headline that
 * is really a paragraph. `problems` lists what's wrong (sent back to the model
 * once); `tidy` fixes what can be fixed mechanically, so whatever is left is
 * never worse than what came in.
 */

/** Words and phrases that mark copy as written by a machine (or a tired agency). */
const STOCK = [
  "unlock", "unleash", "elevate", "elevating", "supercharge", "seamless", "seamlessly", "effortless", "effortlessly", "cutting-edge", "state-of-the-art", "world-class",
  "top-notch", "best-in-class", "game-changer", "game-changing", "next-level", "revolutionary", "revolutionize", "transform your", "unparalleled", "unmatched",
  "one-stop shop", "one stop shop", "look no further", "we've got you covered", "we have got you covered", "nestled", "in the heart of", "tapestry", "embark",
  "journey", "delve", "testament", "beacon", "realm", "synergy", "curated experience", "premier", "bespoke solutions", "tailored solutions", "your go-to",
  "second to none", "like never before", "experience the difference", "take it to the next level", "discover the magic", "where quality meets",
];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export type Copy = {
  headline: string;
  sub: string;
  cta: string;
  statement: string;
  services: { title: string; text: string }[];
  about: string;
  highlights: { title: string; text: string }[];
  closing: string;
};

function all(c: Copy): [string, string][] {
  return [
    ["headline", c.headline],
    ["sub", c.sub],
    ["cta", c.cta],
    ["statement", c.statement],
    ["about", c.about],
    ["closing", c.closing],
    ...c.services.flatMap((s, i): [string, string][] => [[`services[${i}].title`, s.title], [`services[${i}].text`, s.text]]),
    ...c.highlights.flatMap((h, i): [string, string][] => [[`highlights[${i}].title`, h.title], [`highlights[${i}].text`, h.text]]),
  ];
}

/** What a writer should fix, in plain words. Empty when the copy is clean. */
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** Five-word runs that appear in three or more parts of the copy: the same fact said over and over. */
function repeated(c: Copy): string[] {
  const seen = new Map<string, Set<string>>();
  for (const [field, text] of all(c)) {
    const ws = norm(text).split(" ");
    for (let i = 0; i + 5 <= ws.length; i++) {
      const run = ws.slice(i, i + 5).join(" ");
      const where = seen.get(run) ?? new Set<string>();
      where.add(field.replace(/\[\d+\].*/, ""));
      seen.set(run, where);
    }
  }
  return [...seen].filter(([, where]) => where.size >= 3).map(([run]) => run);
}

export function problems(c: Copy, opts: { maxHeadlineWords?: number; name?: string } = {}): string[] {
  const out: string[] = [];
  const maxH = opts.maxHeadlineWords ?? 7;
  if (opts.name) {
    const h = norm(c.headline).replace(/\b(s|the|at|by)\b/g, "").replace(/\s+/g, " ").trim();
    const n = norm(opts.name).replace(/\b(s|the|at|by)\b/g, "").replace(/\s+/g, " ").trim();
    if (h === n || (h.includes(n) && words(h) - words(n) <= 1)) out.push("headline only repeats their name (the layout already shows it): say something about them instead");
  }
  const again = repeated(c);
  if (again.length) out.push(`the same words appear in three or more sections ("${again[0]}"): say each thing once`);
  if (words(c.headline) > maxH) out.push(`headline has ${words(c.headline)} words; at most ${maxH}`);
  if (/[.!?]\s+\S/.test(c.headline)) out.push("headline is more than one sentence");
  if (words(c.sub) > 26) out.push(`sub has ${words(c.sub)} words; at most 26`);
  if (words(c.cta) > 4) out.push("cta is longer than four words");
  if (/^(get started|learn more|click here|submit|discover more)$/i.test(c.cta.trim())) out.push(`cta "${c.cta}" says nothing about what happens; name the action (Book a visit, Order on WhatsApp)`);
  let dashes = 0;
  for (const [field, text] of all(c)) {
    const lower = text.toLowerCase();
    for (const w of STOCK) if (new RegExp(`(^|[^a-z])${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`).test(lower)) out.push(`${field} uses "${w}": say what they actually do instead`);
    if (/\bnot (just|only|simply) [^.,;]{1,40}[,;—-]\s*(it'?s|we'?re|but)\b/i.test(text)) out.push(`${field} uses the "not just X, it's Y" pattern`);
    if (text.includes("!")) out.push(`${field} has an exclamation mark`);
    if (/\b[A-Z]{4,}\b/.test(text.replace(/\b(WhatsApp|OK)\b/g, ""))) out.push(`${field} has a word in capitals`);
    if (/\s·\s/.test(text)) out.push(`${field} joins things with middle dots`);
    if (/\b(website|web site|online presence)\b/i.test(text)) out.push(`${field} talks about websites: this IS their website, write about the business`);
    if (field !== "cta" && field !== "closing" && /\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b\d{1,2}:\d{2}\b|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday) (to|-|through) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text))
      out.push(`${field} gives opening hours: they're shown in the visit section already, leave them out of the copy`);
    dashes += (text.match(/—|–| - /g) ?? []).length;
  }
  if (dashes > 2) out.push(`${dashes} dashes in the copy; use commas and full stops`);
  return [...new Set(out)];
}

/** Sentence case for a headline written In Title Case Like This (proper names keep their capitals). */
function sentenceCase(s: string, keep: string[]) {
  const ws = s.split(/(\s+)/);
  const capped = ws.filter((w) => /^[A-Z][a-z]/.test(w)).length;
  const real = ws.filter((w) => /\w/.test(w)).length;
  if (real < 4 || capped < real * 0.7) return s;
  const names = new Set(keep.flatMap((k) => k.split(/\s+/)).map((w) => w.toLowerCase()));
  let first = true;
  return ws
    .map((w) => {
      if (!/\w/.test(w)) return w;
      const out = first || names.has(w.toLowerCase().replace(/[^a-z']/g, "")) ? w : w.toLowerCase();
      first = false;
      return out;
    })
    .join("");
}

/** The mechanical fixes: always safe, never changes meaning. */
export function tidy<T extends Copy>(c: T, keep: string[] = []): T {
  const fix = (s: string) =>
    s
      .replace(/!+/g, ".")
      .replace(/\.\./g, ".")
      .replace(/\s+·\s+/g, ", ")
      .replace(/\s*—\s*/g, ", ")
      .replace(/\s+–\s+/g, ", ")
      .replace(/\s{2,}/g, " ")
      .trim();
  const headline = sentenceCase(fix(c.headline).replace(/[.,;:]+$/, ""), keep);
  return {
    ...c,
    headline,
    sub: fix(c.sub),
    cta: fix(c.cta).replace(/[.,;:]+$/, ""),
    statement: fix(c.statement),
    about: fix(c.about),
    closing: sentenceCase(fix(c.closing).replace(/[.,;:]+$/, ""), keep),
    services: c.services.map((s) => ({ title: fix(s.title).replace(/[.,;:]+$/, ""), text: fix(s.text) })),
    highlights: c.highlights.map((h) => ({ title: fix(h.title).replace(/[.,;:]+$/, ""), text: fix(h.text) })),
  };
}
