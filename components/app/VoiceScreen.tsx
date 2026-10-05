"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { VoiceApi } from "@/cms/admin/agent/useVoice";
import { Droplet } from "./Droplet";
import { LiquidGlass } from "./LiquidGlass";
import { AppTranscript } from "./Transcript";

/*
 * Talking to the agent, like a call: a big drop of glass that swells with
 * whoever is speaking, the words as they're said, what it does below, and
 * three glass buttons: mute, type a word, end.
 */

const LABEL: Record<string, string> = {
  starting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  working: "Working on it",
  reconnecting: "Reconnecting…",
};

export function VoiceScreen({ voice, name }: { voice: VoiceApi; name: string }) {
  const { state, bindOrb, toggleMute, end, type } = voice;
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const label = state.muted && state.phase !== "starting" ? "Muted" : (LABEL[state.phase] ?? "");
  const hint =
    state.phase === "working"
      ? (state.doing ?? "Running an action…")
      : state.phase === "starting"
        ? "Allow the microphone if asked."
        : state.muted
          ? "It can't hear you."
          : state.phase === "speaking"
            ? "Talk over it to interrupt."
            : `Say what you'd like done. ${name} acts while you talk.`;

  return (
    <motion.section
      className={`ja-voice is-${state.phase}${state.muted ? " is-muted" : ""}`}
      initial={{ y: 40, scale: 0.98 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: 60, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* Only the shade fades: a fading section would stop the platters inside frosting the wallpaper. */}
      <motion.div className="ja-voice__shade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />
      <div className="ja-voice__top">
        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
          <span className="ja-voice__wobble" ref={bindOrb}>
            <Droplet size={168} state={state.phase === "working" || state.phase === "starting" ? "working" : "voice"} />
          </span>
        </motion.span>
        <div className="ja-voice__label" aria-live="polite">
          <strong>{label}</strong>
          <span>{hint}</span>
        </div>
      </div>

      <div className="ja-voice__log">
        <AppTranscript
          api={voice.api}
          follow={state.you.length + state.agent.length}
          tail={
            <>
              {state.you && <div className="ja-bubble ja-bubble--you is-live">{state.you}</div>}
              {state.agent && <div className="ja-bubble ja-bubble--agent is-live">{state.agent}</div>}
            </>
          }
        />
      </div>

      {state.error && <p className="ja-composer__note" style={{ margin: "0 16px 10px" }}>{state.error}</p>}

      {typing && (
        <form
          className="ja-voice__type"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            type(text);
            setText("");
          }}
        >
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`Type to ${name}…`} enterKeyHint="send" />
        </form>
      )}

      <div className="ja-voice__controls">
        <button type="button" className={`ja-call${state.muted ? " is-on" : ""}`} aria-pressed={state.muted} onClick={toggleMute}>
          <LiquidGlass press>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              {state.muted && <path d="M4 4l16 16" />}
            </svg>
          </LiquidGlass>
          {state.muted ? "Unmute" : "Mute"}
        </button>
        <button type="button" className={`ja-call${typing ? " is-on" : ""}`} onClick={() => setTyping((v) => !v)}>
          <LiquidGlass press>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2.5" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            </svg>
          </LiquidGlass>
          Type
        </button>
        <button type="button" className="ja-call ja-call--end" onClick={() => void end()}>
          <LiquidGlass press material="tint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
          </LiquidGlass>
          End
        </button>
      </div>
    </motion.section>
  );
}
