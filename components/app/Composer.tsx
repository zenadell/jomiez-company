"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GlassPane } from "./Glass";
import { shrinkPhoto, tap, uploadPhoto } from "./lib";

/*
 * The message box at the bottom: type, attach photos (camera or library: the
 * phone offers both), send. With nothing typed the round button is the
 * microphone (a live voice conversation); while the agent works it's Stop.
 */

type Photo = { key: string; preview: string; id?: string; error?: string };

export function Composer({
  busy,
  disabled,
  onSend,
  onStop,
  onTalk,
  canTalk,
  notice,
}: {
  busy: boolean;
  disabled?: string | null;
  onSend: (text: string, photos: string[]) => void;
  onStop: () => void;
  onTalk?: () => void;
  canTalk: boolean;
  notice?: string | null;
}) {
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const box = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // The conversation keeps its last message clear of the box, however tall the box grows.
  useEffect(() => {
    const el = root.current;
    const screen = el?.parentElement;
    if (!el || !screen) return;
    const ro = new ResizeObserver(() => screen.style.setProperty("--ja-composer-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    // The placeholder changes while it works, and can wrap: measure again then too.
  }, [text, busy]);

  // The previews are local copies of the photos: let them go once they're sent, removed or left behind.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const all = previews.current;
    return () => all.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const drop = (keep: (p: Photo) => boolean) =>
    setPhotos((all) =>
      all.filter((p) => {
        if (keep(p)) return true;
        URL.revokeObjectURL(p.preview);
        previews.current.delete(p.preview);
        return false;
      }),
    );

  const add = async (files: FileList | null) => {
    for (const file of Array.from(files ?? []).slice(0, 4)) {
      const key = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      setPhotos((p) => [...p, { key, preview }]);
      try {
        const { id } = await uploadPhoto(await shrinkPhoto(file));
        setPhotos((p) => p.map((x) => (x.key === key ? { ...x, id } : x)));
      } catch (err) {
        setPhotos((p) => p.map((x) => (x.key === key ? { ...x, error: (err as Error).message } : x)));
      }
    }
  };

  const uploading = photos.some((p) => !p.id && !p.error);
  const ready = photos.filter((p) => p.id).map((p) => p.id!);
  const canSend = !busy && !disabled && !uploading && (text.trim().length > 0 || ready.length > 0);

  const send = () => {
    if (!canSend) return;
    tap();
    onSend(text.trim(), ready);
    setText("");
    drop(() => false);
    box.current?.blur();
  };

  const failed = photos.find((p) => p.error)?.error;

  return (
    <div className="ja-composer" ref={root}>
      {(disabled || notice || failed) && <p className="ja-composer__note">{disabled || failed || notice}</p>}
      <GlassPane className="ja-composer__bar">
        <AnimatePresence initial={false}>
          {photos.length > 0 && (
            <motion.div className="ja-composer__photos" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              {photos.map((p) => (
                <div key={p.key} className={`ja-thumb${p.id ? " is-ready" : p.error ? " is-failed" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local preview */}
                  <img src={p.preview} alt="" />
                  {!p.id && !p.error && <span className="ja-spin ja-spin--sm" />}
                  <button type="button" aria-label="Remove photo" onClick={() => drop((x) => x.key !== p.key)}>
                    ×
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="ja-composer__row">
          <button type="button" className="ja-round ja-round--plain" aria-label="Add a photo" disabled={busy || Boolean(disabled)} onClick={() => picker.current?.click()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <input
            ref={picker}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            ref={box}
            rows={1}
            value={text}
            placeholder={busy ? "Working…" : "Tell it what you'd like done"}
            enterKeyHint="send"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // A hardware keyboard's Enter sends; the phone's own keyboard uses the send button.
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover: hover)").matches) {
                e.preventDefault();
                send();
              }
            }}
          />
          <AnimatePresence mode="popLayout" initial={false}>
            {busy ? (
              <motion.button key="stop" type="button" className="ja-round ja-round--stop" aria-label="Stop" onClick={onStop} {...BUTTON}>
                <span className="ja-stop-square" />
              </motion.button>
            ) : canSend || !canTalk ? (
              <motion.button key="send" type="button" className="ja-round ja-round--send" aria-label="Send" disabled={!canSend} onClick={send} {...BUTTON}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </motion.button>
            ) : (
              <motion.button key="talk" type="button" className="ja-round ja-round--talk" aria-label="Talk to it" onClick={onTalk} {...BUTTON}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </GlassPane>
    </div>
  );
}

const BUTTON = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.4, opacity: 0 },
  whileTap: { scale: 0.88 },
  transition: { type: "spring", stiffness: 520, damping: 28 },
} as const;
