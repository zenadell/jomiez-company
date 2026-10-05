"use client";

import type { LiveConnectConfig, LiveServerMessage, Session } from "@google/genai";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fold, type AgentEvent, type TranscriptItem } from "@/cms/agent/events";

/*
 * Talking with the agent (Gemini Live), in the browser.
 *
 * The microphone is turned into 16 kHz audio and streamed to Gemini; its
 * spoken answers (24 kHz) are played back as they arrive, and stop the moment
 * you talk over them. When it wants to act, the call goes to the server, which
 * runs it under the same rules as typed requests; approvals show as cards here.
 * What you both say is transcribed live and kept as a conversation. Gemini
 * moves long sessions to a new connection every few minutes; that hand-over
 * happens between turns, with the conversation carried across.
 */

export type VoicePhase = "off" | "starting" | "listening" | "speaking" | "working" | "reconnecting";

export type VoiceState = {
  phase: VoicePhase;
  threadId: string | null;
  items: TranscriptItem[];
  /** What you're saying, as it's heard. */
  you: string;
  /** What it's saying, as it speaks. */
  agent: string;
  muted: boolean;
  busy: boolean;
  error: string | null;
  /** The latest action it's working on, for the status line. */
  doing: string | null;
};

type SessionInfo = { token: string; model: string; config: LiveConnectConfig; threadId: number; name: string; baseUrl: string | null };
type Line = { who: "you" | "agent"; text: string };
type Decision = { approvalId: string; approved: boolean; note?: string };
type ChangeEvent = Extract<AgentEvent, { t: "change" }>;

const GREETING = "[The owner just opened a voice conversation with you. Greet them in a few words and ask what they'd like done.]";

/* Runs on the audio thread: averages the microphone down to 16 kHz, 16-bit, in 40 ms chunks. */
const WORKLET = `
class JzMic extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0; this.acc = 0; this.cnt = 0; this.sq = 0;
    this.buf = new Int16Array(640); this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i]; this.cnt++; this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.acc / this.cnt));
        this.acc = 0; this.cnt = 0; this.sq += v * v;
        this.buf[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.n === this.buf.length) {
          const level = Math.sqrt(this.sq / this.n);
          this.port.postMessage({ pcm: this.buf.buffer, level }, [this.buf.buffer]);
          this.buf = new Int16Array(640); this.n = 0; this.sq = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("jz-mic", JzMic);
`;

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const rateOf = (mime?: string) => Number(/rate=(\d+)/.exec(mime ?? "")?.[1]) || 24000;

async function post<T>(action: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/agent/${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw Object.assign(new Error(out.error || `The server answered ${res.status}.`), { body: out });
  return out as T;
}

const changed = () => window.dispatchEvent(new Event("jomiez-agent-changed"));

const INITIAL: VoiceState = { phase: "off", threadId: null, items: [], you: "", agent: "", muted: false, busy: false, error: null, doing: null };

class VoiceEngine {
  state: VoiceState = INITIAL;

  private onChange?: (e: ChangeEvent) => void;
  /** Called with every change it makes (to refresh what's on screen). */
  setOnChange = (fn?: (e: ChangeEvent) => void) => {
    this.onChange = fn;
  };

  private listeners = new Set<() => void>();
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private mic: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private session: Session | null = null;
  private gen = 0;
  private liveGen = -1;
  private handle: string | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private playhead = 0;
  private inLevel = 0;
  private level = 0;
  private raf = 0;
  private orbs = new Set<HTMLElement>();
  private lines: Line[] = [];
  private tokens = 0;
  private logTimer = 0;
  private lineSeq = 0;
  private cancelled = new Set<string>();
  private ending = false;
  private retries = 0;
  private rotateDue = false;
  private rotating = false;
  private rotateTimer = 0;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.state;

  private set(patch: Partial<VoiceState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  private push(e: AgentEvent) {
    this.set({ items: fold(this.state.items, e) });
    if (e.t === "change") this.onChange?.(e);
  }

  /** The orb grows with the voice that's speaking (yours or its). */
  bindOrb = (el: HTMLElement | null) => {
    if (!el) return;
    this.orbs.add(el);
    return () => {
      this.orbs.delete(el);
    };
  };

  /* ---------- Starting and ending ---------- */

  start = async (context: { path?: string; title?: string } | null) => {
    if (this.state.phase !== "off") return;
    this.ending = false;
    this.retries = 0;
    this.handle = null;
    this.tokens = 0;
    this.lines = [];
    this.cancelled.clear();
    this.set({ ...INITIAL, phase: "starting" });
    try {
      // Created inside the click, so the browser lets it play sound.
      const ctx = new AudioContext({ latencyHint: "interactive" });
      this.ctx = ctx;
      void ctx.resume();
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't use the microphone on this address (it needs https).");
      this.stream = await navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
        .catch((err: DOMException) => {
          throw new Error(
            err?.name === "NotAllowedError"
              ? "The microphone is blocked. Allow it for this site (the icon at the left of the address bar), then try again."
              : err?.name === "NotFoundError"
                ? "No microphone was found."
                : `Couldn't open the microphone: ${err?.message ?? err}`,
          );
        });
      if (this.ending) throw new Error("Ended.");
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }));
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      // Its voice: through an analyser (for the orb) to the speakers.
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.connect(ctx.destination);
      // Your voice: into the worklet, which hands back 16 kHz chunks.
      const source = ctx.createMediaStreamSource(this.stream);
      this.mic = new AudioWorkletNode(ctx, "jz-mic");
      const silent = ctx.createGain();
      silent.gain.value = 0;
      source.connect(this.mic);
      this.mic.connect(silent);
      silent.connect(ctx.destination);
      this.mic.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; level: number }>) => this.onMic(e.data);

      const info = await post<SessionInfo>("voice-session", { context });
      this.set({ threadId: String(info.threadId) });
      changed();
      await this.connect(info);
      this.say(GREETING, false);
      this.loop();
    } catch (err) {
      const message = (err as Error).message;
      const threadId = this.state.threadId;
      await this.teardown();
      this.set({ phase: "off", error: message === "Ended." ? null : message });
      if (threadId) {
        this.lines.push({ who: "agent", text: `(The voice connection didn't open: ${message})` });
        await this.sendLog(true);
      }
    }
  };

  /** Ends the conversation and returns its id (the transcript is saved). */
  end = async () => {
    if (this.state.phase === "off") return this.state.threadId;
    this.ending = true;
    this.commit("you");
    this.commit("agent", "…");
    const threadId = this.state.threadId;
    await this.teardown();
    this.set({ phase: "off", you: "", agent: "", doing: null });
    if (threadId) await this.sendLog(true);
    changed();
    return threadId;
  };

  /** The tab is closing: save what's left without waiting. */
  leave = () => {
    if (this.state.phase === "off") return;
    this.commit("you");
    this.commit("agent", "…");
    const threadId = this.state.threadId;
    if (threadId) {
      const body = JSON.stringify({ threadId, lines: this.lines.splice(0), tokens: this.tokens, end: true });
      navigator.sendBeacon?.("/api/agent/voice-log", new Blob([body], { type: "application/json" }));
    }
    void this.teardown();
  };

  private async teardown() {
    this.gen++;
    window.clearTimeout(this.rotateTimer);
    this.rotateDue = false;
    const session = this.session;
    this.session = null;
    try {
      session?.close();
    } catch {
      // already closed
    }
    this.stopPlayback();
    cancelAnimationFrame(this.raf);
    if (this.mic) this.mic.port.onmessage = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mic = null;
    this.analyser = null;
    const ctx = this.ctx;
    this.ctx = null;
    await ctx?.close().catch(() => {});
    this.orbs.forEach((el) => el.style.setProperty("--jz-level", "0"));
  }

  /* ---------- The connection ---------- */

  private async connect(info: SessionInfo) {
    const { GoogleGenAI } = await import("@google/genai");
    const gen = ++this.gen;
    const ai = new GoogleGenAI({ apiKey: info.token, httpOptions: { apiVersion: "v1alpha", ...(info.baseUrl ? { baseUrl: info.baseUrl } : {}) } });
    let ready = () => {};
    let failed: (e: Error) => void = () => {};
    const setup = new Promise<void>((res, rej) => {
      ready = res;
      failed = rej;
    });
    const session = await ai.live.connect({
      model: info.model,
      config: info.config,
      callbacks: {
        onmessage: (m: LiveServerMessage) => {
          if (m.setupComplete) ready();
          if (gen === this.gen) this.onMessage(m);
        },
        onerror: () => failed(new Error("The voice connection failed.")),
        onclose: (e: CloseEvent) => {
          const reason = e.reason ? `Gemini closed the connection: ${e.reason}` : "Gemini closed the connection.";
          failed(new Error(reason));
          if (gen === this.gen && this.liveGen === gen) void this.onClosed(reason);
        },
      },
    });
    let timer = 0;
    try {
      await Promise.race([
        setup,
        new Promise((_, rej) => {
          timer = window.setTimeout(() => rej(new Error("Gemini didn't answer in time.")), 20_000);
        }),
      ]);
      if (gen !== this.gen) throw new Error("Ended.");
    } catch (err) {
      try {
        session.close();
      } catch {
        // already closed
      }
      throw err;
    } finally {
      window.clearTimeout(timer);
    }
    const old = this.session;
    this.session = session;
    this.liveGen = gen;
    try {
      old?.close();
    } catch {
      // already closed
    }
    this.set({ phase: this.sources.size ? "speaking" : "listening" });
  }

  /** Carries on in a new connection, with the conversation intact. */
  private async resume() {
    const threadId = this.state.threadId;
    if (!threadId) throw new Error("No conversation to resume.");
    this.set({ phase: "reconnecting" });
    const info = await post<SessionInfo>("voice-session", { resume: { threadId, handle: this.handle } });
    const hadHandle = Boolean(this.handle);
    await this.connect(info);
    if (!hadHandle) {
      // No handle to resume from: give the new session the gist of the conversation.
      const recap = this.state.items
        .filter((i) => i.kind === "user" || i.kind === "text")
        .slice(-12)
        .map((i) => `${i.kind === "user" ? "Owner" : "You"}: ${(i as { text: string }).text}`)
        .join("\n");
      this.say(`[The connection dropped and is back. The conversation so far:\n${recap}\nSay briefly that you're back, then carry on.]`, false);
    }
  }

  private async onClosed(reason: string) {
    if (this.ending || this.rotating) return;
    if (this.retries < 2 && this.state.threadId) {
      this.retries++;
      try {
        await this.resume();
        return;
      } catch {
        // fall through
      }
    }
    this.commit("you");
    this.commit("agent", "…");
    const threadId = this.state.threadId;
    await this.teardown();
    this.set({ phase: "off", error: reason, doing: null });
    if (threadId) await this.sendLog(true);
    changed();
  }

  private rotateSoon(timeLeft?: string) {
    if (this.rotateDue || this.rotating) return;
    this.rotateDue = true;
    const ms = Math.max(0, (parseFloat(timeLeft ?? "") || 10) * 1000 - 2000);
    this.rotateTimer = window.setTimeout(() => void this.rotateNow(), ms);
    if (this.state.phase === "listening" && !this.state.you && !this.state.agent) void this.rotateNow();
  }

  private async rotateNow() {
    if (!this.rotateDue || this.rotating || this.ending) return;
    this.rotateDue = false;
    this.rotating = true;
    window.clearTimeout(this.rotateTimer);
    try {
      await this.resume();
    } catch (err) {
      this.rotating = false;
      await this.onClosed((err as Error).message);
      return;
    }
    this.rotating = false;
  }

  /* ---------- What arrives ---------- */

  private onMessage(m: LiveServerMessage) {
    const update = m.sessionResumptionUpdate;
    if (update?.resumable && update.newHandle) this.handle = update.newHandle;
    if (m.usageMetadata?.totalTokenCount) this.tokens += m.usageMetadata.totalTokenCount;
    if (m.goAway) this.rotateSoon(m.goAway.timeLeft);

    const sc = m.serverContent;
    if (sc) {
      if (sc.interrupted) {
        // You talked over it: stop speaking at once.
        this.stopPlayback();
        this.commit("agent", "…");
      }
      if (sc.inputTranscription?.text) this.set({ you: this.state.you + sc.inputTranscription.text });
      const audio = (sc.modelTurn?.parts ?? []).filter((p) => p.inlineData?.data && p.inlineData.mimeType?.startsWith("audio/"));
      if (sc.outputTranscription?.text || audio.length) this.commit("you");
      if (sc.outputTranscription?.text) this.set({ agent: this.state.agent + sc.outputTranscription.text });
      for (const p of audio) this.play(p.inlineData!.data!, rateOf(p.inlineData!.mimeType));
      if (sc.turnComplete) {
        this.retries = 0;
        this.commit("you");
        this.commit("agent");
        if (this.rotateDue) window.setTimeout(() => void this.rotateNow(), 400);
      }
    }
    if (m.toolCallCancellation?.ids) for (const id of m.toolCallCancellation.ids) this.cancelled.add(id);
    if (m.toolCall?.functionCalls?.length) void this.onToolCall(m.toolCall.functionCalls);
  }

  private async onToolCall(calls: { id?: string; name?: string; args?: Record<string, unknown> }[]) {
    this.commit("you");
    this.commit("agent");
    const list = calls.map((c, i) => ({ id: c.id || `call-${Date.now()}-${i}`, name: c.name ?? "", args: c.args ?? {} }));
    this.set({ phase: "working", doing: null });
    let responses: { id: string; name: string; response: Record<string, unknown> }[];
    try {
      const out = await post<{ responses: typeof responses; events: AgentEvent[] }>("voice-tool", { threadId: this.state.threadId, calls: list });
      for (const e of out.events) {
        this.push(e);
        if (e.t === "tool") this.set({ doing: e.title });
      }
      responses = out.responses;
    } catch (err) {
      const message = (err as Error).message;
      this.push({ t: "error", message });
      responses = list.map((c) => ({ id: c.id, name: c.name, response: { error: message } }));
    }
    changed();
    if (this.state.phase === "off") return;
    const answer = responses.filter((r) => !this.cancelled.has(r.id));
    try {
      if (answer.length) this.session?.sendToolResponse({ functionResponses: answer });
    } catch {
      // The connection is being replaced; the new one carries on.
    }
    this.set({ phase: this.sources.size ? "speaking" : "listening", doing: null });
  }

  /* ---------- Your voice ---------- */

  private onMic(data: { pcm: ArrayBuffer; level: number }) {
    this.inLevel = this.state.muted ? 0 : data.level;
    const s = this.session;
    if (!s || this.state.muted || this.state.phase === "starting" || this.state.phase === "reconnecting") return;
    try {
      s.sendRealtimeInput({ audio: { data: toBase64(data.pcm), mimeType: "audio/pcm;rate=16000" } });
    } catch {
      // between connections
    }
  }

  toggleMute = () => {
    const muted = !this.state.muted;
    this.set({ muted });
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    if (muted) {
      try {
        // Tells Gemini you've stopped, so it doesn't wait for the end of a sentence.
        this.session?.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        // between connections
      }
    }
  };

  /** Typed words, mid-conversation (names and addresses are easier typed). */
  type = (text: string) => {
    const t = text.trim();
    if (!t || !this.session) return;
    this.commit("you");
    this.commit("agent", "…");
    this.stopPlayback();
    this.push({ t: "user", text: t, at: new Date().toISOString() });
    this.lines.push({ who: "you", text: t });
    this.scheduleLog();
    this.say(t, false);
  };

  private say(text: string, log: boolean) {
    try {
      this.session?.sendRealtimeInput({ text });
    } catch {
      // between connections
    }
    if (log) this.lines.push({ who: "you", text });
  }

  /* ---------- Its voice ---------- */

  private play(b64: string, rate: number) {
    const ctx = this.ctx;
    if (!ctx || !this.analyser) return;
    const bin = atob(b64);
    const n = bin.length >> 1;
    if (!n) return;
    const samples = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
      if (v >= 0x8000) v -= 0x10000;
      samples[i] = v / 32768;
    }
    const buffer = ctx.createBuffer(1, n, rate);
    buffer.copyToChannel(samples, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.analyser);
    const at = Math.max(ctx.currentTime + 0.04, this.playhead);
    src.start(at);
    this.playhead = at + buffer.duration;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      if (!this.sources.size && this.state.phase === "speaking") this.set({ phase: "listening" });
    };
    if (this.state.phase === "listening") this.set({ phase: "speaking" });
  }

  private stopPlayback() {
    for (const s of this.sources) {
      s.onended = null;
      try {
        s.stop();
      } catch {
        // not started yet
      }
    }
    this.sources.clear();
    this.playhead = 0;
    if (this.state.phase === "speaking") this.set({ phase: "listening" });
  }

  private loop() {
    const analyser = this.analyser;
    if (!analyser) return;
    const data = new Float32Array(analyser.fftSize);
    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const out = Math.sqrt(sum / data.length);
      const target = Math.min(1, Math.max(out * 5, this.inLevel * 6));
      this.level += (target - this.level) * (target > this.level ? 0.45 : 0.12);
      const v = this.level.toFixed(3);
      this.orbs.forEach((el) => el.style.setProperty("--jz-level", v));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /* ---------- The transcript ---------- */

  private commit(who: "you" | "agent", cut = "") {
    const text = (who === "you" ? this.state.you : this.state.agent).trim();
    this.set(who === "you" ? { you: "" } : { agent: "" });
    if (!text) return;
    const full = cut ? `${text}${cut}` : text;
    this.push(who === "you" ? { t: "user", text: full, at: new Date().toISOString() } : { t: "text", id: `voice-${++this.lineSeq}`, delta: full });
    this.lines.push({ who, text: full });
    this.scheduleLog();
  }

  private scheduleLog() {
    window.clearTimeout(this.logTimer);
    this.logTimer = window.setTimeout(() => void this.sendLog(false), 1500);
  }

  private async sendLog(end: boolean) {
    window.clearTimeout(this.logTimer);
    const threadId = this.state.threadId;
    const lines = this.lines.splice(0);
    const tokens = this.tokens;
    this.tokens = 0;
    if (!threadId || (!lines.length && !tokens && !end)) return;
    await post("voice-log", { threadId, lines, tokens, end }).catch(() => {
      // Keep them for the next try.
      this.lines.unshift(...lines);
      this.tokens += tokens;
    });
  }

  /* ---------- Approvals ---------- */

  answer = async (decisions: Decision[]) => {
    this.set({ busy: true });
    for (const d of decisions) {
      try {
        const out = await post<{ text: string; events: AgentEvent[] }>("voice-approve", { threadId: this.state.threadId, ...d });
        out.events.forEach((e) => this.push(e));
        // Tell it what you decided, so it can say so.
        if (this.state.phase !== "off") this.say(out.text, false);
      } catch (err) {
        this.push({ t: "error", message: (err as Error).message });
      }
    }
    this.set({ busy: false });
    changed();
  };

  clearError = () => this.set({ error: null });
}

export function useVoice(opts: { onChange?: (e: ChangeEvent) => void } = {}) {
  const [engine] = useState(() => new VoiceEngine());
  const state = useSyncExternalStore(engine.subscribe, engine.snapshot, engine.snapshot);
  useEffect(() => {
    engine.setOnChange(opts.onChange);
  });
  useEffect(() => {
    const leave = () => engine.leave();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      void engine.end();
    };
  }, [engine]);
  const api = useMemo(() => ({ items: state.items, busy: state.busy, answer: engine.answer }), [state.items, state.busy, engine]);
  return {
    state,
    /** For the transcript, shaped like a typed conversation. */
    api,
    active: state.phase !== "off",
    start: engine.start,
    end: engine.end,
    toggleMute: engine.toggleMute,
    type: engine.type,
    bindOrb: engine.bindOrb,
    clearError: engine.clearError,
  };
}

export type VoiceApi = ReturnType<typeof useVoice>;
