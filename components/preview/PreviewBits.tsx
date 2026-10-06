"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/*
 * The moving parts of a homepage preview (app/(preview)): sections that rise
 * in as they come into view, an "Open now" badge worked out in the business's
 * own time zone, the call / WhatsApp / directions bar on phones, and the
 * Jomiez ribbon, which can be put away to see the site on its own, and a
 * statement that lights up word by word as it scrolls by.
 */

export function Reveal({ children, className = "", as: Tag = "div", style }: { children: ReactNode; className?: string; as?: "div" | "section" | "p" | "ul" | "header"; style?: CSSProperties }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`pv-reveal${shown ? " is-in" : ""} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/**
 * A statement whose words light up one by one as it scrolls through the
 * screen: one CSS variable (--p, 0 to 1) moved on scroll; each word's
 * opacity is worked out from it in CSS (preview.css, .pv-words).
 */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let lit = 0;
    const on = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when its top reaches 85% of the screen, 1 when its bottom reaches 55%; words once lit stay lit.
        lit = Math.max(lit, Math.min(1, (vh * 0.85 - r.top) / Math.max(1, r.height + vh * 0.3)));
        el.style.setProperty("--p", String(lit));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p ref={ref} className={`pv-words ${className}`} style={{ "--n": words.length } as CSSProperties}>
      {words.map((w, i) => (
        <span key={i} style={{ "--i": i } as CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

/** Minutes past midnight and the day (0 = Monday) in a time zone. */
function nowIn(tz: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

const hhmm = (n: number) => `${String(Math.floor((n % 1440) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export function OpenNow({ week, tz }: { week: { day: number; ranges: [number, number][] }[]; tz: string }) {
  const [text, setText] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => {
    const work = () => {
      const { day, min } = nowIn(tz);
      if (day < 0) return setText(null);
      const today = week[day]?.ranges ?? [];
      const yesterday = week[(day + 6) % 7]?.ranges ?? [];
      const open = today.find(([a, b]) => min >= a && min < b) ?? yesterday.map(([a, b]) => [a - 1440, b - 1440] as [number, number]).find(([a, b]) => min >= a && min < b);
      if (open) return setText({ open: true, label: `Open now · until ${hhmm(open[1])}` });
      const later = today.find(([a]) => a > min);
      setText({ open: false, label: later ? `Opens today at ${hhmm(later[0])}` : "Closed now" });
    };
    work();
    const t = setInterval(work, 60_000);
    return () => clearInterval(t);
  }, [week, tz]);
  if (!text) return null;
  return (
    <span className={`pv-open${text.open ? " is-open" : ""}`}>
      <i aria-hidden="true" />
      {text.label}
    </span>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <div className={`pv-bar${shown ? " is-shown" : ""}`}>{children}</div>;
}

export function Ribbon({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <aside className="pv-ribbon" aria-label="About this preview">
      {children}
      <button type="button" className="pv-ribbon__close" aria-label="Hide this note" onClick={() => setOpen(false)}>
        ×
      </button>
    </aside>
  );
}

/** The header turns solid once the page scrolls past the top. */
export function Header({ children }: { children: ReactNode }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <header className={`pv-head${solid ? " is-solid" : ""}`}>{children}</header>;
}
