/*
 * When a routine runs next, in its own time zone ("every weekday at 08:00,
 * Africa/Lagos"). Computed without a date library: walk forward to the next
 * matching local day, then convert that local time to UTC.
 */

export type Schedule = {
  schedule?: string | null;
  time?: string | null;
  weekday?: string | null;
  timezone?: string | null;
};

function zoned(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    h: Number(get("hour")),
    min: Number(get("minute")),
    s: Number(get("second")),
    wd: weekdays.indexOf(get("weekday")),
  };
}

/** The UTC instant of a wall-clock time in a time zone. */
function fromZoned(y: number, m: number, d: number, h: number, min: number, timeZone: string): Date {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const z = zoned(new Date(guess), timeZone);
  const offset = Date.UTC(z.y, z.m - 1, z.d, z.h, z.min) - guess;
  return new Date(guess - offset);
}

function validZone(tz: string | null | undefined) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC" });
    return tz || "UTC";
  } catch {
    return "UTC";
  }
}

export function nextRunAt(s: Schedule, from: Date): Date {
  const tz = validZone(s.timezone);
  if (s.schedule === "hourly") {
    const next = new Date(from);
    next.setUTCMinutes(0, 0, 0);
    next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }
  const [hh, mm] = (s.time && /^\d{2}:\d{2}$/.test(s.time) ? s.time : "08:00").split(":").map(Number);
  const now = zoned(from, tz);
  for (let add = 0; add < 40; add++) {
    const day = new Date(Date.UTC(now.y, now.m - 1, now.d + add));
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    const wd = day.getUTCDay();
    const ok =
      s.schedule === "weekdays"
        ? wd >= 1 && wd <= 5
        : s.schedule === "weekly"
          ? wd === Number(s.weekday ?? 1)
          : s.schedule === "monthly"
            ? d === 1
            : true;
    if (!ok) continue;
    const at = fromZoned(y, m, d, hh, mm, tz);
    if (at.getTime() > from.getTime() + 30_000) return at;
  }
  return new Date(from.getTime() + 24 * 3600_000);
}
