"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TranscriptItem } from "@/cms/agent/events";
import { Markdown } from "@/cms/admin/agent/Markdown";
import type { TranscriptApi } from "@/cms/admin/agent/Chat";
import { PHOTO_LINE, tap } from "./lib";

/*
 * A conversation, phone-sized: your messages and photos on the right, the
 * agent's answers on the left, each step it takes as a quiet line (open one
 * to see what it sent), screenshots you can open full screen, and approval
 * cards with the exact change and two big buttons.
 */

const RISK: Record<string, string> = { draft: "Draft", live: "Goes live", delete: "Deletes", email: "Sends email", web: "Reads the web" };
const PICTURE: Record<string, string> = {
  screenshot: "Screenshot it took",
  upload_image: "Added to the media library",
  make_image: "The image it made",
};

const POP = { initial: { opacity: 0, y: 12, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: "spring", stiffness: 420, damping: 32 } } as const;

/** Splits "📷 Photo s…" lines (photos attached from the phone) out of a message. */
export function splitPhotos(text: string) {
  const photos: string[] = [];
  const rest = text
    .split("\n")
    .filter((line) => {
      const m = PHOTO_LINE.exec(line.trim());
      if (m) photos.push(m[1]);
      return !m;
    })
    .join("\n")
    .trim();
  return { text: rest, photos };
}

function Viewer({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.button type="button" className="ja-viewer" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Close">
          <motion.img src={src} alt="" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Step({ item, onImage }: { item: Extract<TranscriptItem, { kind: "tool" }>; onImage: (src: string) => void }) {
  const [open, setOpen] = useState(false);
  const state = item.waiting ? "waiting" : item.ok === undefined ? "working" : item.ok ? "ok" : "failed";
  return (
    <motion.div className={`ja-step is-${state}`} {...POP}>
      <button type="button" className="ja-step__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="ja-step__icon" aria-hidden="true">
          {state === "working" ? <span className="ja-spin ja-spin--sm" /> : state === "waiting" ? "⏸" : state === "ok" ? "✓" : "!"}
        </span>
        <span className="ja-step__title">{item.title}</span>
      </button>
      {item.summary && (state === "failed" || open) && <p className="ja-step__summary">{item.summary}</p>}
      {item.image && (
        <button type="button" className="ja-step__image" onClick={() => onImage(item.image!)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a screenshot or upload, any size */}
          <img src={item.image} alt={item.title} loading="lazy" />
          <span>{PICTURE[item.name] ?? "Image"}</span>
        </button>
      )}
      {open && <pre className="ja-step__detail">{JSON.stringify(item.input, null, 2)}</pre>}
    </motion.div>
  );
}

function Approval({ item, busy, onAnswer }: { item: Extract<TranscriptItem, { kind: "approval" }>; busy: boolean; onAnswer: (approved: boolean, note?: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  return (
    <motion.div className={`ja-approval${item.decided ? " is-done" : ""}`} {...POP}>
      <div className="ja-approval__head">
        <span className={`ja-chip ja-chip--${item.risk}`}>{RISK[item.risk] ?? item.risk}</span>
        <strong>{item.title}</strong>
      </div>
      {item.reason && <p className="ja-approval__reason">{item.reason}</p>}
      {item.changes && item.changes.length > 0 && (
        <div className="ja-diff">
          {item.changes.map((c, i) => (
            <div key={i} className="ja-diff__row">
              <div className="ja-diff__where">{c.where}</div>
              {c.before && <div className="ja-diff__before">{c.before}</div>}
              <div className="ja-diff__after">{c.after}</div>
            </div>
          ))}
        </div>
      )}
      {item.detail && <pre className="ja-approval__detail">{item.detail}</pre>}
      {item.decided ? (
        <p className={`ja-approval__verdict ${item.approved ? "is-yes" : "is-no"}`}>
          {item.approved ? "✓ Approved" : "✕ Declined"}
          {item.note && item.note !== "Skipped" ? `: ${item.note}` : item.note === "Skipped" ? " (skipped)" : ""}
        </p>
      ) : declining ? (
        <div className="ja-approval__decline">
          <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell it why (optional)" enterKeyHint="send" onKeyDown={(e) => e.key === "Enter" && onAnswer(false, note.trim() || undefined)} />
          <div className="ja-approval__actions">
            <button type="button" className="ja-btn ja-btn--ghost" onClick={() => setDeclining(false)}>
              Back
            </button>
            <motion.button type="button" whileTap={{ scale: 0.96 }} className="ja-btn ja-btn--danger" disabled={busy} onClick={() => onAnswer(false, note.trim() || undefined)}>
              Decline
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="ja-approval__actions">
          <motion.button type="button" whileTap={{ scale: 0.96 }} className="ja-btn ja-btn--ghost" disabled={busy} onClick={() => setDeclining(true)}>
            Decline
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="ja-btn ja-btn--approve"
            disabled={busy}
            onClick={() => {
              tap(14);
              onAnswer(true);
            }}
          >
            Approve
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export function AppTranscript({ api, empty, tail, follow = 0 }: { api: TranscriptApi; empty?: ReactNode; tail?: ReactNode; follow?: number }) {
  const end = useRef<HTMLDivElement>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const count = api.items.length;
  const last = api.items[count - 1];
  const lastLen = last && "text" in last ? last.text.length : 0;
  const first = useRef(true);
  // Follow the newest message: only the conversation scrolls (scrollIntoView would move the whole app
  // to show it), and all the way down, past the padding that keeps it clear of the message box.
  useEffect(() => {
    const box = end.current?.closest<HTMLElement>(".ja-scroll, .ja-voice__log");
    box?.scrollTo({ top: box.scrollHeight, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [count, lastLen, follow, api.busy]);

  if (!count && !api.busy && !tail) return <div className="ja-transcript is-empty">{empty}</div>;
  const open = api.items.filter((i) => i.kind === "approval" && !i.decided) as Extract<TranscriptItem, { kind: "approval" }>[];

  return (
    <div className="ja-transcript">
      {api.items.map((item, n) => {
        switch (item.kind) {
          case "user": {
            const { text, photos } = splitPhotos(item.text);
            return (
              <motion.div key={n} className="ja-you" {...POP}>
                {photos.length > 0 && (
                  <div className="ja-you__photos">
                    {photos.map((id) => (
                      <button key={id} type="button" onClick={() => setViewing(`/api/agent/shot?id=${id}`)}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- a photo from the phone */}
                        <img
                          src={`/api/agent/shot?id=${id}`}
                          alt="Your photo"
                          onError={(e) => {
                            (e.currentTarget.parentElement as HTMLElement).dataset.gone = "";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                {text && <div className="ja-bubble ja-bubble--you">{text}</div>}
              </motion.div>
            );
          }
          case "text":
            return (
              <motion.div key={n} className="ja-bubble ja-bubble--agent" {...POP}>
                <Markdown text={item.text} />
              </motion.div>
            );
          case "reasoning":
            return thinking ? (
              <div key={n} className="ja-thinking">
                {item.text}
              </div>
            ) : null;
          case "tool":
            return <Step key={n} item={item} onImage={setViewing} />;
          case "approval":
            return <Approval key={n} item={item} busy={api.busy} onAnswer={(approved, note) => void api.answer([{ approvalId: item.approvalId, approved, note }])} />;
          case "change":
            return (
              <motion.div key={n} className="ja-change" {...POP}>
                <span className="ja-change__dot" aria-hidden="true" />
                <span className="ja-change__text">
                  {item.action[0].toUpperCase() + item.action.slice(1)} <strong>{item.title}</strong>
                </span>
                {item.site && !item.site.includes("every page") && (
                  <a href={item.site} target="_blank" rel="noopener">
                    View ↗
                  </a>
                )}
              </motion.div>
            );
          case "notice":
            return (
              <div key={n} className="ja-note">
                {item.text}
              </div>
            );
          case "error":
            return (
              <div key={n} className="ja-error">
                {item.message}
              </div>
            );
          default:
            return null;
        }
      })}
      {tail}
      {api.busy && (
        <div className="ja-typing" aria-label="Working">
          <span />
          <span />
          <span />
        </div>
      )}
      {open.length > 1 && !api.busy && (
        <motion.button
          type="button"
          className="ja-btn ja-btn--approve ja-approve-all"
          whileTap={{ scale: 0.97 }}
          {...POP}
          onClick={() => {
            tap(14);
            void api.answer(open.map((a) => ({ approvalId: a.approvalId, approved: true })));
          }}
        >
          Approve all {open.length}
        </motion.button>
      )}
      {api.items.some((i) => i.kind === "reasoning") && (
        <button type="button" className="ja-link" onClick={() => setThinking((v) => !v)}>
          {thinking ? "Hide its thinking" : "Show its thinking"}
        </button>
      )}
      <div ref={end} className="ja-transcript__end" />
      <Viewer src={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
