"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TranscriptItem } from "@/cms/agent/events";
import { Markdown } from "./Markdown";
import type { ThreadApi } from "./useAgent";
import { MicIcon } from "./Voice";

/*
 * A conversation with the agent: what was asked, what it said, every step it
 * took (open any step to see exactly what it sent), the approval cards that
 * show the exact change before anything happens, and the message box.
 */

const RISK: Record<string, string> = {
  draft: "Draft",
  live: "Goes live",
  delete: "Deletes",
  email: "Sends email",
  web: "Reads the web",
};

/* What a picture under a step is, so an image it added isn't mistaken for something it saw. */
const PICTURE: Record<string, string> = {
  screenshot: "Screenshot it took",
  upload_image: "The image it added to the media library",
  make_image: "The image it made (added to the media library)",
};

function Step({ item }: { item: Extract<TranscriptItem, { kind: "tool" }> }) {
  const [open, setOpen] = useState(false);
  const state = item.waiting ? "waiting" : item.ok === undefined ? "working" : item.ok ? "ok" : "failed";
  return (
    <div className={`jz-step jz-step--${state}`}>
      <button type="button" className="jz-step__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="jz-step__icon" aria-hidden="true">
          {state === "working" ? <span className="jz-spin" /> : state === "waiting" ? "⏸" : state === "ok" ? "✓" : "!"}
        </span>
        <span className="jz-step__title">{item.title}</span>
        {item.summary && <span className="jz-step__summary">{item.summary}</span>}
      </button>
      {item.image && (
        <a className="jz-step__image" href={item.image} target="_blank" rel="noopener" title="Open full size">
          {/* eslint-disable-next-line @next/next/no-img-element -- a screenshot or upload, any size */}
          <img src={item.image} alt={item.title} loading="lazy" />
          <span className="jz-step__caption">{PICTURE[item.name] ?? "Image"}</span>
        </a>
      )}
      {open && (
        <pre className="jz-step__detail">{JSON.stringify(item.input, null, 2)}</pre>
      )}
    </div>
  );
}

export function Approval({
  item,
  onAnswer,
  disabled,
}: {
  item: Extract<TranscriptItem, { kind: "approval" }>;
  onAnswer: (approved: boolean, note?: string) => void;
  disabled: boolean;
}) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className={`jz-approval${item.decided ? " jz-approval--done" : ""}`}>
      <div className="jz-approval__head">
        <span className={`jz-chip jz-chip--${item.risk}`}>{RISK[item.risk] ?? item.risk}</span>
        <strong>{item.title}</strong>
      </div>
      {item.reason && <p className="jz-approval__reason">{item.reason}</p>}
      {item.changes && item.changes.length > 0 && (
        <div className="jz-diff">
          {item.changes.map((c, i) => (
            <div key={i} className="jz-diff__row">
              <div className="jz-diff__where">{c.where}</div>
              <div className="jz-diff__before">{c.before}</div>
              <div className="jz-diff__after">{c.after}</div>
            </div>
          ))}
        </div>
      )}
      {item.detail && <pre className="jz-approval__detail">{item.detail}</pre>}
      {item.decided ? (
        <p className={`jz-approval__verdict${item.approved ? " is-yes" : " is-no"}`}>
          {item.approved ? "Approved" : "Declined"}
          {item.note && item.note !== "Skipped" ? `: ${item.note}` : item.note === "Skipped" ? " (skipped)" : ""}
        </p>
      ) : declining ? (
        <div className="jz-approval__decline">
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell it why (optional). It will remember."
            onKeyDown={(e) => {
              if (e.key === "Enter") onAnswer(false, note.trim() || undefined);
            }}
          />
          <button type="button" className="jz-btn jz-btn--ghost" onClick={() => setDeclining(false)}>
            Back
          </button>
          <button type="button" className="jz-btn jz-btn--no" disabled={disabled} onClick={() => onAnswer(false, note.trim() || undefined)}>
            Decline
          </button>
        </div>
      ) : (
        <div className="jz-approval__actions">
          <button type="button" className="jz-btn jz-btn--yes" disabled={disabled} onClick={() => onAnswer(true)}>
            Approve
          </button>
          <button type="button" className="jz-btn jz-btn--ghost" disabled={disabled} onClick={() => setDeclining(true)}>
            Decline…
          </button>
        </div>
      )}
    </div>
  );
}

/** What a transcript needs: a typed conversation, or a voice one. */
export type TranscriptApi = Pick<ThreadApi, "items" | "busy" | "answer">;

export function Transcript({
  api,
  empty,
  tail,
  follow = 0,
}: {
  api: TranscriptApi;
  empty?: ReactNode;
  /** Shown after the items (e.g. words being spoken right now). */
  tail?: ReactNode;
  /** Changes whenever the tail grows, to keep it in view. */
  follow?: number;
}) {
  const end = useRef<HTMLDivElement>(null);
  const [showThinking, setShowThinking] = useState(false);
  const count = api.items.length;
  const last = api.items[count - 1];
  const lastLen = last && "text" in last ? last.text.length : 0;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [count, lastLen, follow]);

  if (!count && !api.busy && !tail) return <div className="jz-transcript jz-transcript--empty">{empty}</div>;

  const openApprovals = api.items.filter((i) => i.kind === "approval" && !i.decided) as Extract<TranscriptItem, { kind: "approval" }>[];

  return (
    <div className="jz-transcript">
      {api.items.map((item, n) => {
        switch (item.kind) {
          case "user":
            return (
              <div key={n} className="jz-msg jz-msg--user">
                {item.text}
              </div>
            );
          case "text":
            return (
              <div key={n} className="jz-msg jz-msg--agent">
                <Markdown text={item.text} />
              </div>
            );
          case "reasoning":
            return showThinking ? (
              <div key={n} className="jz-thinking">
                {item.text}
              </div>
            ) : null;
          case "tool":
            return <Step key={n} item={item} />;
          case "approval":
            return (
              <Approval
                key={n}
                item={item}
                disabled={api.busy}
                onAnswer={(approved, note) => void api.answer([{ approvalId: item.approvalId, approved, note }])}
              />
            );
          case "change":
            return (
              <div key={n} className="jz-change">
                <span className="jz-change__dot" aria-hidden="true" />
                <span>
                  {item.action[0].toUpperCase() + item.action.slice(1)} <strong>{item.title}</strong>
                </span>
                <a href={item.admin}>Open</a>
                {item.site && !item.site.includes("every page") && (
                  <a href={item.site} target="_blank" rel="noopener">
                    View ↗
                  </a>
                )}
              </div>
            );
          case "notice":
            return (
              <div key={n} className="jz-notice">
                {item.text}
              </div>
            );
          case "error":
            return (
              <div key={n} className="jz-error">
                {item.message}
              </div>
            );
          default:
            return null;
        }
      })}
      {tail}
      {api.busy && (
        <div className="jz-working">
          <span className="jz-spin" /> Working…
        </div>
      )}
      {openApprovals.length > 1 && !api.busy && (
        <div className="jz-approve-all">
          <button
            type="button"
            className="jz-btn jz-btn--yes"
            onClick={() => void api.answer(openApprovals.map((a) => ({ approvalId: a.approvalId, approved: true })))}
          >
            Approve all {openApprovals.length}
          </button>
        </div>
      )}
      {api.items.some((i) => i.kind === "reasoning") && (
        <button type="button" className="jz-link" onClick={() => setShowThinking((v) => !v)}>
          {showThinking ? "Hide its thinking" : "Show its thinking"}
        </button>
      )}
      <div ref={end} />
    </div>
  );
}

export function Composer({
  api,
  placeholder,
  context,
  disabledReason,
  talk,
  notice,
}: {
  api: ThreadApi;
  placeholder?: string;
  context?: { path?: string; title?: string } | null;
  disabledReason?: string | null;
  /** The microphone button, when voice is available (or why it isn't). */
  talk?: { start: () => void; unavailable?: string | null } | null;
  /** An extra line above the box (e.g. why a voice conversation ended). */
  notice?: string | null;
}) {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const submit = () => {
    const message = text.trim();
    if (!message || api.busy || disabledReason) return;
    setText("");
    void api.send(message, context);
  };

  return (
    <div className="jz-composer">
      {api.error && <p className="jz-composer__error">{api.error}</p>}
      {disabledReason && <p className="jz-composer__error">{disabledReason}</p>}
      {notice && <p className="jz-composer__error">{notice}</p>}
      <div className="jz-composer__box">
        <textarea
          ref={box}
          rows={1}
          value={text}
          placeholder={placeholder ?? "Tell it what you'd like done…"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {talk && !api.busy && (
          <button
            type="button"
            className="jz-talk"
            disabled={Boolean(talk.unavailable)}
            title={talk.unavailable || "Talk to it (live voice)"}
            aria-label="Talk to it"
            onClick={talk.start}
          >
            <MicIcon />
          </button>
        )}
        {api.busy ? (
          <button type="button" className="jz-btn jz-btn--stop" onClick={() => void api.stop()}>
            Stop
          </button>
        ) : (
          <button type="button" className="jz-btn jz-btn--send" disabled={!text.trim() || Boolean(disabledReason)} onClick={submit}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}
