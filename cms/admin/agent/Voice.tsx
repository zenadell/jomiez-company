"use client";

import { useState } from "react";
import type { VoiceApi } from "./useVoice";

/*
 * The live voice conversation's controls: an orb that moves with whoever is
 * speaking, what's happening right now, mute, end, and a box for typing a
 * word or two mid-conversation. The words being spoken show as live captions
 * at the end of the transcript.
 */

const LABEL: Record<string, string> = {
  starting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  working: "Working on it",
  reconnecting: "Reconnecting…",
};

export function MicIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/** What's being said right now, as it's heard. */
export function VoiceCaptions({ voice }: { voice: VoiceApi }) {
  const { you, agent } = voice.state;
  return (
    <>
      {you && <div className="jz-msg jz-msg--user is-live">{you}</div>}
      {agent && <div className="jz-msg jz-msg--agent is-live">{agent}</div>}
    </>
  );
}

/** The empty conversation, before anyone has spoken. */
export function VoiceHello({ voice, name }: { voice: VoiceApi; name: string }) {
  const { state, bindOrb } = voice;
  return (
    <div className="jz-voice-hello">
      <span className="jz-voice__orb jz-voice__orb--big" ref={bindOrb} aria-hidden="true" />
      <p>{state.phase === "starting" ? `Connecting to ${name}…` : `Say what you'd like done. ${name} acts while you talk.`}</p>
    </div>
  );
}

export function VoiceBar({ voice, name }: { voice: VoiceApi; name: string }) {
  const { state, bindOrb, toggleMute, end, type } = voice;
  const [text, setText] = useState("");
  const label = state.muted && state.phase !== "starting" ? "Muted" : (LABEL[state.phase] ?? "");
  const hint =
    state.phase === "working"
      ? (state.doing ?? "Running an action…")
      : state.phase === "starting"
        ? "Allow the microphone if asked."
        : state.phase === "reconnecting"
          ? "Keeping the conversation going."
          : state.muted
            ? "It can't hear you. Unmute to talk."
            : state.phase === "speaking"
              ? "Talk over it to interrupt."
              : "Speak naturally.";
  return (
    <div className={`jz-voice is-${state.phase}${state.muted ? " is-muted" : ""}`}>
      <div className="jz-voice__main">
        <span className="jz-voice__orb" ref={bindOrb} aria-hidden="true" />
        <div className="jz-voice__state" aria-live="polite">
          <strong>{label}</strong>
          <span>{hint}</span>
        </div>
        <button
          type="button"
          className="jz-voice__mute"
          aria-pressed={state.muted}
          title={state.muted ? "Unmute" : "Mute"}
          aria-label={state.muted ? "Unmute" : "Mute"}
          onClick={toggleMute}
        >
          <MicIcon off={state.muted} />
        </button>
        <button type="button" className="jz-voice__end" onClick={() => void end()}>
          End
        </button>
      </div>
      <form
        className="jz-voice__type"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          type(text);
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Or type to ${name}…`} disabled={state.phase === "starting"} />
      </form>
    </div>
  );
}
