"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { AgentStatus } from "@/cms/admin/agent/useAgent";
import { Markdown } from "@/cms/admin/agent/Markdown";
import { GlassPane } from "./Glass";
import { STATUS_TEXT, ago, modeText, type ThreadRow } from "./lib";
import { Orb } from "./Orb";

/*
 * The first screen: the agent and how it's set up, a card for anything waiting
 * for you, the latest briefing, every conversation (filtered like iOS Mail),
 * and a floating dock to start a task or talk. Pull down to refresh.
 */

const FILTERS = [
  ["all", "All"],
  ["waiting", "Needs you"],
  ["routine", "Routines"],
  ["inbox", "Inbox"],
] as const;
type Filter = (typeof FILTERS)[number][0];

const SOURCE: Record<string, string> = { console: "◆", page: "✎", routine: "↻", inbox: "✉", voice: "◉" };

export function Home({
  status,
  threads,
  loading,
  onOpen,
  onNew,
  onTalk,
  onRefresh,
  onModel,
  onSettings,
  onNotices,
  install,
}: {
  status: AgentStatus | null;
  threads: ThreadRow[];
  loading: boolean;
  onOpen: (id: number) => void;
  onNew: () => void;
  onTalk: (() => void) | null;
  onRefresh: () => Promise<void>;
  onModel: () => void;
  onSettings: () => void;
  onNotices: () => void;
  install: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const name = status?.name ?? "Agent";
  const waiting = threads.filter((t) => t.status === "waiting");
  const shown = threads.filter((t) => (filter === "all" ? true : filter === "waiting" ? t.status === "waiting" : t.source === filter));

  // The large title shrinks into the bar as the list scrolls, as on iOS.
  const scrolled = useMotionValue(0);
  const barOpacity = useTransform(scrolled, [40, 80], [0, 1]);
  const titleScale = useTransform(scrolled, [-80, 0], [1.12, 1]);

  // Pull to refresh.
  const pull = useMotionValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  const spinnerOpacity = useTransform(pull, [0, 70], [0, 1]);
  const spinnerRotate = useTransform(pull, [0, 70], [0, 270]);

  const touchStart = (e: React.TouchEvent) => {
    start.current = scroller.current && scroller.current.scrollTop <= 0 ? e.touches[0].clientY : null;
  };
  const touchMove = (e: React.TouchEvent) => {
    if (start.current === null || refreshing) return;
    const d = e.touches[0].clientY - start.current;
    pull.set(d > 0 ? Math.min(110, d * 0.5) : 0);
  };
  const touchEnd = async () => {
    if (start.current === null) return;
    start.current = null;
    if (pull.get() >= 70 && !refreshing) {
      setRefreshing(true);
      pull.set(56);
      await onRefresh().catch(() => {});
      setRefreshing(false);
    }
    pull.set(0);
  };

  const orbState = status?.working ? "working" : status?.waiting ? "waiting" : "idle";
  const subtitle = !status
    ? "…"
    : !status.ready
      ? "Not set up yet"
      : `${status.model}${status.mode ? ` · ${modeText(status.mode)}` : ""}`;

  return (
    <section className="ja-screen ja-home">
      <motion.header className="ja-bar ja-bar--home" style={{ opacity: barOpacity }}>
        <GlassPane className="ja-bar__glass" />
        <span className="ja-bar__title">{name}</span>
      </motion.header>
      <div className="ja-bar-tools">
        <button type="button" className="ja-icon-btn" aria-label="What it did on its own" onClick={onNotices}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <AnimatePresence>
            {status?.unread ? (
              <motion.span className="ja-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 18 }}>
                {status.unread}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>
        <button type="button" className="ja-icon-btn" aria-label="Settings" onClick={onSettings}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <motion.div className="ja-pull" style={{ opacity: spinnerOpacity, y: pull }} aria-hidden="true">
        <motion.span className={`ja-pull__ring${refreshing ? " is-spinning" : ""}`} style={{ rotate: spinnerRotate }} />
      </motion.div>

      <motion.div
        ref={scroller}
        className="ja-scroll"
        style={{ y: pull }}
        onScroll={(e) => scrolled.set((e.target as HTMLElement).scrollTop)}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={() => void touchEnd()}
      >
        <div className="ja-hero">
          <Orb state={orbState} size={56} />
          <motion.h1 className="ja-large-title" style={{ scale: titleScale, originX: 0 }}>
            {name}
          </motion.h1>
          {status?.canConfigure ? (
            <button type="button" className="ja-model-pill" onClick={onModel}>
              <span>{subtitle}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          ) : (
            <p className="ja-hero__sub">{subtitle}</p>
          )}
        </div>

        {install}

        {status && !status.ready && (
          <GlassPane tone="thick" className="ja-card ja-card--setup">
            <strong>{status.canConfigure ? "Give it a mind first" : "Not set up yet"}</strong>
            <p>{status.setup}</p>
            {status.canConfigure && (
              <Link className="ja-btn ja-btn--primary" href="/admin/globals/agent">
                Open Agent settings
              </Link>
            )}
          </GlassPane>
        )}

        <AnimatePresence initial={false}>
          {waiting.length > 0 && (
            <motion.button
              type="button"
              className="ja-card ja-card--waiting"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => (waiting.length === 1 ? onOpen(waiting[0].id) : setFilter("waiting"))}
            >
              <span className="ja-card__pulse" aria-hidden="true" />
              <span>
                <strong>{waiting.length === 1 ? "1 thing needs you" : `${waiting.length} things need you`}</strong>
                <small>{waiting.length === 1 ? waiting[0].title : "Approvals waiting: tap to see them"}</small>
              </span>
              <span className="ja-chevron" aria-hidden="true">
                ›
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {status?.briefing && (
          <GlassPane tone="thick" className={`ja-card ja-card--briefing${briefingOpen ? " is-open" : ""}`}>
            <button type="button" className="ja-card__head" onClick={() => setBriefingOpen((v) => !v)} aria-expanded={briefingOpen}>
              <span className="ja-eyebrow">Latest briefing · {ago(status.briefing.at)}</span>
              <strong>{status.briefing.title}</strong>
            </button>
            <div className="ja-card__body">
              <Markdown text={status.briefing.body} />
            </div>
          </GlassPane>
        )}

        <div className="ja-segments" role="tablist" aria-label="Show">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? "is-on" : ""} onClick={() => setFilter(id)}>
              {filter === id && <motion.span layoutId="ja-seg" className="ja-segments__thumb" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="ja-segments__label">
                {label}
                {id === "waiting" && waiting.length > 0 ? ` ${waiting.length}` : ""}
              </span>
            </button>
          ))}
        </div>

        <ul className="ja-list">
          {loading && threads.length === 0 && (
            <>
              <li className="ja-row is-skeleton" />
              <li className="ja-row is-skeleton" />
              <li className="ja-row is-skeleton" />
            </>
          )}
          {!loading && shown.length === 0 && (
            <li className="ja-empty">{filter === "all" ? "No conversations yet. Start one below." : "Nothing here."}</li>
          )}
          <AnimatePresence initial={false}>
            {shown.map((t) => (
              <motion.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                <motion.button type="button" className="ja-row" whileTap={{ scale: 0.985, backgroundColor: "rgba(255,255,255,0.06)" }} onClick={() => onOpen(t.id)}>
                  <span className={`ja-row__icon is-${t.source}`} aria-hidden="true">
                    {SOURCE[t.source] ?? "◆"}
                  </span>
                  <span className="ja-row__main">
                    <span className="ja-row__title">{t.title || "Untitled"}</span>
                    <span className={`ja-row__meta is-${t.status}`}>{STATUS_TEXT[t.status] ?? t.status}</span>
                  </span>
                  <span className="ja-row__time">{ago(t.updatedAt)}</span>
                  <span className="ja-chevron" aria-hidden="true">
                    ›
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {status && (
          <p className="ja-usage">
            Today: {status.usage.runs} of {status.limits.runs} tasks · {Math.round(status.usage.tokens / 1000)}k of {Math.round(status.limits.tokens / 1000)}k tokens
          </p>
        )}
      </motion.div>

      <div className="ja-dock">
        <GlassPane className="ja-dock__glass">
          <motion.button type="button" className="ja-dock__new" whileTap={{ scale: 0.95 }} onClick={onNew} disabled={!status?.ready}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New task
          </motion.button>
          {onTalk && (
            <motion.button type="button" className="ja-dock__talk" whileTap={{ scale: 0.9 }} onClick={onTalk} aria-label={`Talk to ${name}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </motion.button>
          )}
        </GlassPane>
      </div>
    </section>
  );
}
