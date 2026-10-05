"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AgentStatus, ThreadApi } from "@/cms/admin/agent/useAgent";
import { Composer } from "./Composer";
import { GlassPane } from "./Glass";
import { STATUS_TEXT, tap } from "./lib";
import { Orb } from "./Orb";
import { Sheet } from "./Sheet";
import { AppTranscript } from "./Transcript";

/*
 * One conversation: a glass bar with the way back, what it's about and what
 * it's doing; the conversation; the message box. ⋯ opens its plan and every
 * change it made, each one undoable.
 */

const SUGGESTIONS = [
  { title: "Check the whole site", text: "Audit the whole site (SEO, image descriptions, broken links, placeholder text) and fix what you safely can as drafts. Then list what needs my decision." },
  { title: "Write a journal post", text: "Write a journal post in the site's voice about something we've built recently. Save it as a draft with a search title and description." },
  { title: "Sort the inbox", text: "Go through the inbox: mark spam, summarise each real message in its notes, and draft replies for the promising leads." },
  { title: "How does the home page look?", text: "Take a phone-sized screenshot of the home page, look at it and tell me what you'd improve." },
];

export function ChatScreen({
  api,
  status,
  onBack,
  onTalk,
  voiceNotice,
}: {
  api: ThreadApi;
  status: AgentStatus | null;
  onBack: () => void;
  onTalk: (() => void) | null;
  voiceNotice?: string | null;
}) {
  const [more, setMore] = useState(false);
  const [undoResult, setUndoResult] = useState<string[] | null>(null);
  const name = status?.name ?? "Agent";
  const disabled = status && !status.ready ? status.setup || "The agent is switched off." : null;

  // Opened while it's still working (from a notification, or after the phone slept): follow along.
  useEffect(() => {
    if (api.state !== "running" || api.busy || !api.threadId) return;
    const id = api.threadId;
    const t = setInterval(() => void api.load(id), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.state, api.busy, api.threadId]);

  const send = (text: string, photos: string[]) => {
    const lines = photos.map((id) => `📷 Photo ${id}`);
    const message = [text || (photos.length ? (photos.length === 1 ? "Here's a photo." : "Here are some photos.") : ""), ...lines].join("\n").trim();
    void api.send(message);
  };

  const state = api.busy ? "running" : api.state;
  const live = api.changes.filter((c) => !c.undone);

  const hello = (
    <div className="ja-hello">
      <Orb size={84} state="idle" />
      <h2>What shall we grow today?</h2>
      <p>{name} can change anything on jomiez.com, look after the inbox and research the web. It asks before anything you haven&apos;t allowed.</p>
      <div className="ja-suggest">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            disabled={Boolean(disabled)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.05 * i }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              tap();
              void api.send(s.text);
            }}
          >
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="ja-screen ja-chat">
      <header className="ja-bar">
        <GlassPane className="ja-bar__glass" />
        <button type="button" className="ja-back" onClick={onBack} aria-label="Back to conversations">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 2 2 10l8 8" />
          </svg>
          <span>Tasks</span>
        </button>
        <div className="ja-bar__center">
          <span className="ja-bar__title">{api.title || "New task"}</span>
          {(api.threadId || api.busy) && (
            <span className={`ja-bar__status is-${state}`}>
              {state === "running" && <Orb size={8} state="working" />}
              {STATUS_TEXT[state] ?? state}
            </span>
          )}
        </div>
        <button type="button" className="ja-icon-btn" aria-label="Plan and changes" disabled={!api.threadId} onClick={() => setMore(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
          {live.length > 0 && <span className="ja-badge ja-badge--soft">{live.length}</span>}
        </button>
      </header>

      <div className="ja-scroll ja-scroll--chat">
        <AppTranscript key={api.threadId ?? "new"} api={api} empty={hello} />
      </div>

      <Composer
        busy={api.busy}
        disabled={disabled}
        notice={api.error || voiceNotice}
        canTalk={Boolean(onTalk)}
        onTalk={onTalk ?? undefined}
        onSend={send}
        onStop={() => void api.stop()}
      />

      <Sheet open={more} onClose={() => setMore(false)} title="This conversation" tall>
        {api.plan.length > 0 && (
          <section className="ja-sheet-section">
            <p className="ja-eyebrow">Plan</p>
            <ol className="ja-plan">
              {api.plan.map((s, i) => (
                <li key={i} className={s.done ? "is-done" : ""}>
                  {s.title}
                </li>
              ))}
            </ol>
          </section>
        )}
        <section className="ja-sheet-section">
          <p className="ja-eyebrow">Changes it made</p>
          {api.changes.length === 0 && <p className="ja-muted">None yet.</p>}
          <ul className="ja-changes">
            {api.changes.map((c, i) => (
              <li key={i} className={c.undone ? "is-undone" : ""}>
                <span>
                  <em>{c.action === "update" ? "changed" : c.action}</em> {c.title}
                </span>
                {!c.undone && (
                  <button
                    type="button"
                    className="ja-btn ja-btn--small"
                    disabled={api.busy}
                    onClick={async () => {
                      if (!window.confirm(`Undo “${c.action === "update" ? "changed" : c.action} ${c.title}”?`)) return;
                      setUndoResult(await api.undo(c.runId));
                    }}
                  >
                    Undo
                  </button>
                )}
              </li>
            ))}
          </ul>
          {live.length > 1 && (
            <button
              type="button"
              className="ja-btn ja-btn--ghost ja-btn--block"
              disabled={api.busy}
              onClick={async () => {
                if (!window.confirm(`Undo all ${live.length} changes from this conversation?`)) return;
                setUndoResult(await api.undo());
              }}
            >
              Undo all {live.length}
            </button>
          )}
          {undoResult && <p className="ja-muted">{undoResult.join(" · ")}</p>}
        </section>
        {api.busy && (
          <button type="button" className="ja-btn ja-btn--danger ja-btn--block" onClick={() => void api.stop()}>
            Stop working
          </button>
        )}
        {api.threadId && (
          <a className="ja-btn ja-btn--ghost ja-btn--block" href={`/admin/agent?thread=${api.threadId}`}>
            Open in the full admin
          </a>
        )}
      </Sheet>
    </section>
  );
}
