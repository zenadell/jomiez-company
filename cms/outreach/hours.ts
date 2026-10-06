/*
 * Opening hours from a map listing (OpenStreetMap's opening_hours, e.g.
 * "Mo-Fr 09:00-18:00; Sa 10:00-16:00"), for the week table and the "Open now"
 * badge on previews. Only the common forms are read; anything else is left
 * out rather than guessed.
 */

export type Week = { day: number; ranges: [number, number][] }[]; // day 0 = Monday, minutes from midnight

const DAY = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const minutes = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

function days(spec: string): number[] | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.trim().split("-");
    const i = DAY.indexOf(a);
    if (i < 0) return null;
    if (!b) out.add(i);
    else {
      const j = DAY.indexOf(b);
      if (j < 0) return null;
      for (let k = i; ; k = (k + 1) % 7) {
        out.add(k);
        if (k === j) break;
      }
    }
  }
  return [...out];
}

export function parseHours(raw?: string | null): Week | null {
  if (!raw) return null;
  const text = raw.trim();
  if (text === "24/7") return DAY.map((_, day) => ({ day, ranges: [[0, 24 * 60]] }));
  const week: Week = DAY.map((_, day) => ({ day, ranges: [] }));
  let any = false;
  for (const rule of text.split(/\s*;\s*/)) {
    if (!rule || /^(PH|SH)\b/.test(rule)) continue;
    const m = /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(.*)$/.exec(rule);
    if (!m) return null;
    const which = m[1] ? days(m[1]) : DAY.map((_, i) => i);
    if (!which) return null;
    const times = m[2].trim();
    if (/^(off|closed)$/i.test(times)) {
      for (const d of which) week[d].ranges = [];
      continue;
    }
    const ranges: [number, number][] = [];
    for (const span of times.split(/\s*,\s*/)) {
      const [a, b] = span.split("-");
      const from = minutes(a ?? "");
      const to = minutes(b ?? "");
      if (Number.isNaN(from) || Number.isNaN(to)) return null;
      ranges.push([from, to <= from ? to + 24 * 60 : to]);
    }
    for (const d of which) week[d].ranges = ranges;
    any = true;
  }
  return any ? week : null;
}

const hhmm = (n: number) => `${String(Math.floor((n % 1440) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** "Mon–Fri 09:00–18:00", days with the same hours grouped. */
export function hoursLines(week: Week): { days: string; hours: string }[] {
  const text = (r: [number, number][]) => (r.length ? r.map(([a, b]) => `${hhmm(a)}–${hhmm(b)}`).join(", ") : "Closed");
  const out: { days: string; hours: string; from: number; to: number }[] = [];
  for (const { day, ranges } of week) {
    const h = text(ranges);
    const last = out.at(-1);
    if (last && last.hours === h && last.to === day - 1) last.to = day;
    else out.push({ days: "", hours: h, from: day, to: day });
  }
  return out.map((g) => ({ days: g.from === g.to ? DAY_NAMES[g.from] : `${DAY_NAMES[g.from]}–${DAY_NAMES[g.to]}`, hours: g.hours }));
}
