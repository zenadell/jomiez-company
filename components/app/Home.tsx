"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import type { AgentStatus } from "@/cms/admin/agent/useAgent";
import { Markdown } from "@/cms/admin/agent/Markdown";
import { STATUS_TEXT, ago, modeText, type ThreadRow } from "./lib";

/*
 * The first screen's content (its glass controls float above, in JomiezApp):
 * the agent and how it's set up, anything waiting for you, the latest
 * briefing, and every conversation in one list, filtered like iOS Mail.
 * Pull down to refresh.
 */

const FILTERS = [
  ["all", "All"],
  ["waiting", "Needs you"],
  ["routine", "Routines"],
  ["inbox", "Inbox"],
] as const;
type Filter = (typeof FILTERS)[number][0];

// Rises in with a spring, never a fade: a frosted platter that fades can't frost the wallpaper meanwhile.
const RISE = (i: number) => ({ initial: { y: 40, scale: 0.96 }, animate: { y: 0, scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 24, delay: 0.04 * i } }) as const;

function SourceIcon({ source }: { source: string }) {
  const path =
    source === "routine"
      ? "M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"
      : source === "inbox"
        ? "M4 6h16v12H4zM4 7l8 6 8-6"
        : source === "voice"
          ? "M9 3h6v11H9zM5 11a7 7 0 0 0 14 0M12 18v3"
          : source === "page"
            ? "M4 20h4L19 9l-4-4L4 16zM14 6l4 4"
            : "M12 3l2.6 5.8L21 9.7l-4.6 4.4 1.1 6.4L12 17.5 6.5 20.5l1.1-6.4L3 9.7l6.4-.9z";
  return (
    <span className={`ja-row__icon is-${source}`} aria-hidden="true">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

export function HomeContent({
  status,
  threads,
  loading,
  onOpen,
  onRefresh,
  onModel,
  install,
}: {
  status: AgentStatus | null;
  threads: ThreadRow[];
  loading: boolean;
  onOpen: (id: number) => void;
  onRefresh: () => Promise<void>;
  onModel: () => void;
  install: ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const name = status?.name ?? "Keeper";
  const waiting = threads.filter((t) => t.status === "waiting");
  const shown = threads.filter((t) => (filter === "all" ? true : filter === "waiting" ? t.status === "waiting" : t.source === filter));

  // Pull to refresh.
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const touchStart = (e: React.TouchEvent) => {
    start.current = scroller.current && scroller.current.scrollTop <= 0 ? e.touches[0].clientY : null;
    setDragging(start.current !== null);
  };
  const touchMove = (e: React.TouchEvent) => {
    if (start.current === null || refreshing) return;
    const d = e.touches[0].clientY - start.current;
    setPull(d > 0 ? Math.min(100, d * 0.45) : 0);
  };
  const touchEnd = async () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (pull >= 64 && !refreshing) {
      setRefreshing(true);
      setPull(48);
      await onRefresh().catch(() => {});
      setRefreshing(false);
    }
    setPull(0);
  };

  const dot = !status ? "off" : !status.ready ? "off" : status.working ? "working" : status.waiting ? "waiting" : "ready";
  const line = !status ? "…" : !status.ready ? "Not set up yet" : status.working ? `Working · ${status.model}` : `Ready · ${status.model}`;

  return (
    <div
      ref={scroller}
      className="ja-scroll"
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={() => void touchEnd()}
      style={{ transform: pull ? `translateY(${pull}px)` : undefined, transition: dragging ? "none" : "transform .5s cubic-bezier(.34,1.56,.64,1)" }}
    >
      {(pull > 8 || refreshing) && <span className={`ja-pull${refreshing ? " is-spinning" : ""}`} style={{ opacity: Math.min(1, pull / 64), transform: `translateY(${-pull - 6}px) rotate(${pull * 4}deg)` }} />}

      <motion.header className="ja-hero" {...RISE(0)}>
        <h1 className="ja-large">{name}</h1>
        <button type="button" className="ja-hero__status" onClick={onModel} disabled={!status?.canConfigure} title={status?.mode ? modeText(status.mode) : undefined}>
          <span className={`ja-dot is-${dot}`} />
          {line}
          {status?.canConfigure && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>
      </motion.header>

      {install}

      {status && !status.ready && (
        <motion.div className="ja-card ja-platter" {...RISE(1)}>
          <span className="ja-card__text">
            <strong>{status.canConfigure ? "Give it a mind first" : "Not set up yet"}</strong>
            <p>{status.setup}</p>
          </span>
          {status.canConfigure && (
            <Link className="ja-btn ja-btn--primary ja-btn--small" href="/admin/globals/agent" style={{ marginTop: 12 }}>
              Open Agent settings
            </Link>
          )}
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {waiting.length > 0 && (
          <motion.button
            key="waiting"
            type="button"
            className="ja-card ja-platter ja-card--waiting"
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.6 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            onClick={() => (waiting.length === 1 ? onOpen(waiting[0].id) : setFilter("waiting"))}
          >
            <span className="ja-card__pulse" aria-hidden="true" />
            <span className="ja-card__text">
              <strong>{waiting.length === 1 ? "1 thing needs you" : `${waiting.length} things need you`}</strong>
              <small>{waiting.length === 1 ? waiting[0].title : "Approvals are waiting"}</small>
            </span>
            <span className="ja-chevron" aria-hidden="true">
              ›
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {status?.briefing && (
        <motion.div className={`ja-card ja-platter ja-card--briefing${briefingOpen ? " is-open" : ""}`} {...RISE(2)}>
          <button type="button" className="ja-card__head" onClick={() => setBriefingOpen((v) => !v)} aria-expanded={briefingOpen}>
            <span className="ja-eyebrow">Briefing · {ago(status.briefing.at)}</span>
            <strong style={{ fontSize: 17 }}>{status.briefing.title}</strong>
          </button>
          <div className="ja-card__body">
            <Markdown text={status.briefing.body} />
          </div>
        </motion.div>
      )}

      <motion.div className="ja-segments ja-platter" role="tablist" aria-label="Show" {...RISE(3)}>
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? "is-on" : ""} onClick={() => setFilter(id)}>
            {filter === id && <motion.span layoutId="ja-seg" className="ja-segments__thumb" transition={{ type: "spring", stiffness: 480, damping: 34 }} />}
            <span className="ja-segments__label">
              {label}
              {id === "waiting" && waiting.length > 0 ? ` ${waiting.length}` : ""}
            </span>
          </button>
        ))}
      </motion.div>

      <motion.ul className="ja-list ja-platter" {...RISE(4)}>
        {loading && threads.length === 0 && [0, 1, 2].map((i) => <li key={i} className="ja-row is-skeleton" />)}
        {!loading && shown.length === 0 && <li className="ja-empty">{filter === "all" ? `Nothing yet. Ask ${name} something below.` : "Nothing here."}</li>}
        <AnimatePresence initial={false}>
          {shown.map((t) => (
            <motion.li key={t.id} layout="position" transition={{ type: "spring", stiffness: 500, damping: 40 }}>
              <button type="button" className="ja-row" onClick={() => onOpen(t.id)}>
                <SourceIcon source={t.source} />
                <span className="ja-row__main">
                  <span className="ja-row__title">{t.title || "Untitled"}</span>
                  <span className={`ja-row__meta is-${t.status}`}>{STATUS_TEXT[t.status] ?? t.status}</span>
                </span>
                <span className="ja-row__time">{ago(t.updatedAt)}</span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {status && (
        <p className="ja-usage">
          Today: {status.usage.runs} of {status.limits.runs} tasks · {Math.round(status.usage.tokens / 1000)}k of {Math.round(status.limits.tokens / 1000)}k tokens
        </p>
      )}
    </div>
  );
}
