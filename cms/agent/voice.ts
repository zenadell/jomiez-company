import { GoogleGenAI, Modality, type LiveConnectConfig } from "@google/genai";
import type { ModelMessage } from "ai";
import type { Payload, TypedUser } from "payload";
import { z } from "zod";
import { Engine, type Recorded } from "./docs";
import { fold, type AgentEvent, type TranscriptItem } from "./events";
import { decide, type Risk } from "./policy";
import { buildInstructions } from "./prompt";
import { situation } from "./situation";
import { buildModel, missingSetup } from "./providers";
import { imageOf, loadConfig, rememberLesson, sightOf, usageToday, voiceKey, type AgentConfig } from "./run";
import { targetsOf } from "./schema";
import { makeTools, type ToolMeta } from "./tools";

/*
 * Talking with the agent in real time (Gemini Live).
 *
 * The browser holds the live audio connection, but never the Gemini key: the
 * server mints a single-use pass that expires within minutes and is locked to
 * this session's model, voice, instructions and tools. When the model wants to
 * act, the browser hands the call to the server, which runs the same tools under
 * the same permission rules as typed requests (anything gated waits for the
 * owner's click), records every change for undo, and keeps the transcript as a
 * conversation.
 */

const VOICE_RULES = `

# Speaking
You are talking with the owner out loud, in real time, working in the jomiez.com admin beside them, like a site manager at the next desk. Talk like a person: short, warm, natural sentences, plain spoken words, no lists, no Markdown, never read out links, IDs or field paths.

# How a good manager works out loud
- It's natural to say "hold on, let me check" or "give me a second". Then actually do it, straight away in the same turn, and come back on your own with what you found. Never leave them waiting for you to continue; they should never have to say "go ahead" or "proceed" for something you already said you'd do.
- Work in the real order, and only say each step once it has happened:
  1. find the exact place (search for the words; read the document if needed);
  2. make the change (update);
  3. look at the result: it says which page and exactly what changed;
  4. only then tell them, e.g. "Done, the heading now reads …";
  5. publish when they want it live, then look at the live page and confirm what visitors see.
- Never say "saved", "changed", "published", "done" or "live" before the result in front of you shows it. If you're about to do it, say "I'll…", not "I've…".
- Keep track of which page you're on. If a result names a different page from the one you meant, say so at once and fix it.
- When something fails, say it honestly and briefly, the way a person would ("That didn't take, I had the wrong spot. Let me fix it."), then fix it and confirm.
- Be the one who knows the site. Mention things they should know (something waiting for approval, a draft not live yet, new messages) when it's relevant, and suggest what you'd do next.
- If you didn't catch something, ask. If they interrupt, stop and listen.

# Approvals
When an action is waiting for approval, say briefly what it is and that it's on their screen to approve or decline, then wait. Never call the same action again while it waits.`;

type Pending = { approvalId: string; toolCallId: string; name: string; title: string; runId: string; args?: Record<string, unknown> };

type ThreadDoc = {
  id: number;
  owner?: number | null;
  source?: string | null;
  events?: unknown;
  messages?: unknown;
  changes?: unknown;
  pending?: unknown;
};

/* ---------- JSON Schema for Gemini function declarations ---------- */

function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === "$schema" || k === "propertyNames" || k === "~standard") continue;
    if (k === "additionalProperties" && v && typeof v === "object" && !Object.keys(v).length) {
      out[k] = true;
      continue;
    }
    out[k] = clean(v);
  }
  return out;
}

function declarations(tools: Record<string, unknown>, meta: Record<string, ToolMeta>) {
  return Object.keys(tools)
    .filter((name) => meta[name]?.schema)
    .map((name) => ({
      name,
      description: meta[name].description,
      parametersJsonSchema: clean(z.toJSONSchema(meta[name].schema!, { unrepresentable: "any" })),
    }));
}

/* ---------- The toolkit for one voice conversation ---------- */

async function toolkit(payload: Payload, user: TypedUser, cfg: AgentConfig, origin: string, threadId: number, record: (r: Omit<Recorded, "at" | "runId">) => void, emit: (e: AgentEvent) => void) {
  const actor = { payload, user };
  const engine = new Engine(actor, record);
  const textReady = !missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  const helperModel = textReady
    ? buildModel({ provider: cfg.provider, model: cfg.fastModel || cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL })
    : (null as never);
  const { tools, meta } = makeTools({
    actor,
    engine,
    perms: cfg.perms,
    origin,
    scope: "full",
    emit,
    setPlan: () => {},
    helperModel,
    threadId: String(threadId),
    sight: sightOf(cfg),
  });
  // Long read-only jobs need the text model; without it, voice does them itself.
  if (!textReady) delete tools.delegate;
  return { tools, meta };
}

async function loadThread(payload: Payload, user: TypedUser, threadId: number | string): Promise<ThreadDoc> {
  const thread = (await payload.findByID({ collection: "agent-threads", id: Number(threadId), user, overrideAccess: false, depth: 0 })) as unknown as ThreadDoc;
  if (!thread) throw new Error("Not found.");
  return thread;
}

/* Writes to one conversation happen one at a time (tool calls and transcript lines can overlap). */
const queues = ((globalThis as { __jomiezVoiceQueues?: Map<string, Promise<unknown>> }).__jomiezVoiceQueues ??= new Map());
function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
  const before = queues.get(key) ?? Promise.resolve();
  const next = before.then(work, work);
  queues.set(
    key,
    next.catch(() => {}),
  );
  return next;
}

async function appendToThread(
  payload: Payload,
  threadId: number,
  events: AgentEvent[],
  extra: { changes?: Recorded[]; pending?: Pending[]; status?: string; messages?: ModelMessage[] } = {},
) {
  const thread = (await payload.findByID({ collection: "agent-threads", id: threadId, depth: 0, overrideAccess: true })) as unknown as ThreadDoc;
  let items = (Array.isArray(thread.events) ? thread.events : []) as TranscriptItem[];
  for (const e of events) items = fold(items, e);
  const data: Record<string, unknown> = { events: items };
  if (extra.changes?.length) data.changes = [...((thread.changes as Recorded[]) ?? []), ...extra.changes];
  if (extra.pending) data.pending = extra.pending;
  if (extra.status) data.status = extra.status;
  if (extra.messages?.length) {
    // The spoken conversation also becomes the model's history, so typing into it later carries on with full context.
    const before = (Array.isArray(thread.messages) ? thread.messages : []) as ModelMessage[];
    const opener: ModelMessage[] = before.length || extra.messages[0].role === "user" ? [] : [{ role: "user", content: "(A voice conversation started.)" }];
    data.messages = [...before, ...opener, ...extra.messages];
  }
  await payload.update({ collection: "agent-threads", id: threadId, data: data as never, overrideAccess: true, depth: 0 });
}

const said = (text: string): ModelMessage => ({ role: "assistant", content: [{ type: "text", text }] });

/* ---------- Starting ---------- */

export async function startVoice(opts: {
  payload: Payload;
  user: TypedUser;
  origin: string;
  context?: { path?: string; title?: string } | null;
  /** Carry on an interrupted conversation (Gemini moves long sessions to a new connection every few minutes). */
  resume?: { threadId: number | string; handle?: string | null } | null;
}) {
  const { payload, user, origin } = opts;
  const cfg = await loadConfig(payload);
  if (!cfg.enabled) throw new Error("The agent is switched off (Agent settings).");
  if (!cfg.voice.enabled) throw new Error("Voice is switched off (Agent settings → Voice).");
  const key = voiceKey(cfg);
  if (!key) throw new Error("Add a Gemini key for voice in Agent settings → Voice (or set GEMINI_API_KEY).");
  const usage = await usageToday(payload);
  if (usage.tokens >= cfg.dailyTokens) throw new Error(`Today's limit of ${cfg.dailyTokens.toLocaleString()} tokens is reached (Agent settings → Limits).`);

  let threadId: number;
  let context = opts.context ?? null;
  if (opts.resume) {
    const thread = await loadThread(payload, user, opts.resume.threadId);
    if (thread.source !== "voice") throw new Error("That isn't a voice conversation.");
    threadId = thread.id;
    context = ((thread as { context?: typeof context }).context as typeof context) ?? context;
  } else {
    if (usage.runs >= cfg.dailyRuns) throw new Error(`Today's limit of ${cfg.dailyRuns} tasks is reached (Agent settings → Limits).`);
    const when = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: process.env.AGENT_TIMEZONE || "Africa/Lagos",
    }).format(new Date());
    const thread = (await payload.create({
      collection: "agent-threads",
      data: {
        title: `Voice conversation, ${when}`,
        owner: user.id,
        source: "voice",
        // Never "running": a call left open in a closed tab mustn't look busy forever.
        status: "idle",
        context,
        messages: [],
        events: [],
        changes: [],
        pending: [],
        model: `google/${cfg.voice.model}`,
      } as never,
      overrideAccess: true,
    })) as unknown as { id: number };
    threadId = thread.id;
    await payload.kv.set(`agent:usage:${new Date().toISOString().slice(0, 10)}`, { runs: usage.runs + 1, tokens: usage.tokens });
  }

  const { tools, meta } = await toolkit(payload, user, cfg, origin, threadId, () => {}, () => {});
  const { docs: memory } = await payload.find({ collection: "agent-memory", sort: "-updatedAt", limit: 60, depth: 0, overrideAccess: true });
  const now = await situation(payload, user, { exclude: threadId, timeZone: process.env.AGENT_TIMEZONE || "Africa/Lagos" }).catch(() => undefined);
  const instructions =
    buildInstructions({
      situation: now,
      name: cfg.name,
      persona: cfg.persona,
      memory: memory.map((m) => ({ id: m.id, kind: String(m.kind ?? "fact"), content: String(m.content ?? "") })),
      mode: cfg.perms.mode,
      web: cfg.perms.web,
      user: user as never,
      source: context?.path ? "page" : "console",
      scope: "full",
      context,
      targets: targetsOf(payload),
      now: new Date(),
      timeZone: process.env.AGENT_TIMEZONE || "Africa/Lagos",
    }) + VOICE_RULES;

  const config: LiveConnectConfig = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voice.voiceName } },
      ...(cfg.voice.language ? { languageCode: cfg.voice.language } : {}),
    },
    systemInstruction: instructions,
    tools: [{ functionDeclarations: declarations(tools, meta) as never }],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    // Long conversations keep going: older turns are summarised away instead of ending the session,
    // and the connection can be handed over to a new one without losing the thread.
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: opts.resume?.handle ? { handle: opts.resume.handle } : {},
  };

  const baseUrl = process.env.GEMINI_API_BASE_URL?.replace(/\/$/, "") || undefined;
  const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: "v1alpha", ...(baseUrl ? { baseUrl } : {}) } });
  let token: { name?: string };
  try {
    token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60_000).toISOString(),
        liveConnectConstraints: { model: cfg.voice.model, config },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
  } catch (err) {
    throw new Error(`Gemini didn't open a voice session: ${cleanError(err)}`);
  }
  if (!token.name) throw new Error("Gemini didn't return a session pass.");
  return {
    token: token.name,
    model: cfg.voice.model,
    config,
    threadId,
    name: cfg.name,
    voice: cfg.voice.voiceName,
    baseUrl: baseUrl ?? null,
  };
}

/* Gemini errors arrive as JSON inside the message; keep the readable part. */
function cleanError(err: unknown) {
  const raw = (err as Error)?.message ?? String(err);
  const json = raw.slice(raw.indexOf("{"));
  try {
    const parsed = JSON.parse(json) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message.slice(0, 300);
  } catch {
    // not JSON
  }
  return raw.slice(0, 300);
}

/* ---------- The model wants to act ---------- */

const summaryOf = (output: unknown) => {
  const o = output as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return String(output ?? "Done").slice(0, 200);
  const what = o.changed ?? o.published ?? o.summary ?? o.seen ?? (Array.isArray(o.images) ? `${o.images.length} images` : null) ?? (Array.isArray(o.photos) ? `${o.photos.length} photos` : null) ?? o.status ?? o.title ?? o.note ?? "Done";
  return String(what).split("\n").slice(0, 3).join(" ").slice(0, 240);
};

export async function runVoiceCalls(opts: {
  payload: Payload;
  user: TypedUser;
  origin: string;
  threadId: number | string;
  calls: { id: string; name: string; args?: Record<string, unknown> }[];
}) {
  const { payload, user } = opts;
  const thread = await loadThread(payload, user, opts.threadId);
  return serial(String(thread.id), async () => {
    const cfg = await loadConfig(payload);
    if (!cfg.enabled) throw new Error("The agent is switched off.");
    const events: AgentEvent[] = [];
    const changes: Recorded[] = [];
    const runId = `v${Date.now().toString(36)}`;
    const emit = (e: AgentEvent) => events.push(e);
    const { tools, meta } = await toolkit(payload, user, cfg, opts.origin, thread.id, (r) => changes.push({ ...r, at: new Date().toISOString(), runId }), emit);
    const current = await payload.findByID({ collection: "agent-threads", id: thread.id, depth: 0, overrideAccess: true });
    const pending = ((current as unknown as ThreadDoc).pending as Pending[] | undefined) ?? [];
    const responses: { id: string; name: string; response: Record<string, unknown> }[] = [];

    for (const call of opts.calls) {
      const m = meta[call.name];
      const t = tools[call.name] as { execute?: (i: unknown, o: unknown) => Promise<unknown> } | undefined;
      if (!m || !t?.execute) {
        responses.push({ id: call.id, name: call.name, response: { error: `No such action: ${call.name}.` } });
        continue;
      }
      // The same checks a typed request gets: the input must match the action's shape.
      const parsed = m.schema ? m.schema.safeParse(call.args ?? {}) : { success: true as const, data: call.args ?? {} };
      if (!parsed.success) {
        const problem = parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
        responses.push({ id: call.id, name: call.name, response: { error: `Invalid input. ${problem.slice(0, 400)}` } });
        continue;
      }
      const args = (parsed.data ?? {}) as Record<string, unknown>;
      let title = call.name;
      try {
        title = m.title(args) ?? call.name;
      } catch {
        // keep the name
      }
      let risk: Risk = "live";
      try {
        risk = m.risk(args);
      } catch (err) {
        responses.push({ id: call.id, name: call.name, response: { error: (err as Error).message } });
        continue;
      }
      emit({ t: "tool", id: call.id, name: call.name, title, input: args });
      let decision = decide(risk, cfg.perms);
      if (decision === "ask" && (await m.skipApproval?.(args).catch(() => false))) decision = "auto";
      if (decision === "deny") {
        emit({ t: "tool-result", id: call.id, ok: false, summary: "Not allowed by the owner's settings" });
        responses.push({ id: call.id, name: call.name, response: { error: "The owner's settings don't allow this." } });
        continue;
      }
      if (decision === "ask") {
        let preview: { changes?: { where: string; before: string; after: string }[]; detail?: string } = {};
        try {
          preview = (await m.preview?.(args)) ?? {};
        } catch (err) {
          preview = { detail: `Couldn't preview this change: ${(err as Error).message}` };
        }
        const approvalId = `va_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
        pending.push({ approvalId, toolCallId: call.id, name: call.name, title, runId, args });
        emit({ t: "approval", approvalId, toolCallId: call.id, name: call.name, title, risk, reason: String(args.reason ?? ""), changes: preview.changes, detail: preview.detail });
        responses.push({
          id: call.id,
          name: call.name,
          response: {
            status: "waiting_for_approval",
            note: "It is on the owner's screen with Approve and Decline. Tell them in a few words what it is and that it's waiting for them. Don't call it again; you'll be told what they decide.",
          },
        });
        continue;
      }
      try {
        const output = await t.execute(args, { toolCallId: call.id, messages: [] });
        emit({ t: "tool-result", id: call.id, ok: true, summary: summaryOf(output), ...imageOf(output) });
        responses.push({ id: call.id, name: call.name, response: { output: output as Record<string, unknown> } });
      } catch (err) {
        emit({ t: "tool-result", id: call.id, ok: false, summary: (err as Error).message.slice(0, 300) });
        responses.push({
          id: call.id,
          name: call.name,
          response: { error: (err as Error).message.slice(0, 500), done: false, note: "This did not happen: nothing changed. Don't say it's done; fix it first." },
        });
      }
    }

    const done = events.filter((e): e is Extract<AgentEvent, { t: "tool" }> => e.t === "tool");
    const note = done
      .map((e) => {
        const r = events.find((x) => (x.t === "tool-result" && x.id === e.id) || (x.t === "approval" && x.toolCallId === e.id));
        return `${e.title}: ${r?.t === "approval" ? "waiting for the owner's approval" : r?.t === "tool-result" ? r.summary : "no result"}`;
      })
      .join("; ");
    await appendToThread(payload, thread.id, events, {
      changes,
      pending,
      status: pending.length ? "waiting" : "idle",
      messages: note ? [said(`[Actions while talking] ${note}`)] : [],
    });
    return { responses, events };
  });
}

/* ---------- The owner answers an approval ---------- */

export async function answerVoiceApproval(opts: {
  payload: Payload;
  user: TypedUser;
  origin: string;
  threadId: number | string;
  approvalId: string;
  approved: boolean;
  note?: string;
}) {
  const { payload, user } = opts;
  const thread = await loadThread(payload, user, opts.threadId);
  return serial(String(thread.id), async () => {
    const current = (await payload.findByID({ collection: "agent-threads", id: thread.id, depth: 0, overrideAccess: true })) as unknown as ThreadDoc;
    const pending = (current.pending as Pending[] | undefined) ?? [];
    const item = pending.find((p) => p.approvalId === opts.approvalId);
    if (!item) throw new Error("That was already answered.");
    const rest = pending.filter((p) => p.approvalId !== opts.approvalId);
    const events: AgentEvent[] = [{ t: "decision", approvalId: item.approvalId, approved: opts.approved, note: opts.note }];
    const changes: Recorded[] = [];
    let text: string;

    if (opts.approved) {
      const cfg = await loadConfig(payload);
      const { tools } = await toolkit(payload, user, cfg, opts.origin, thread.id, (r) => changes.push({ ...r, at: new Date().toISOString(), runId: item.runId }), (e) => events.push(e));
      const t = tools[item.name] as { execute?: (i: unknown, o: unknown) => Promise<unknown> } | undefined;
      try {
        const output = await t!.execute!(item.args ?? {}, { toolCallId: item.toolCallId, messages: [] });
        events.push({ t: "tool-result", id: item.toolCallId, ok: true, summary: summaryOf(output), ...imageOf(output) });
        text = `[The owner approved “${item.title}”. It's done: ${summaryOf(output)}. Tell them in one short sentence.]`;
      } catch (err) {
        events.push({ t: "tool-result", id: item.toolCallId, ok: false, summary: (err as Error).message.slice(0, 300) });
        text = `[The owner approved “${item.title}”, but it failed: ${(err as Error).message.slice(0, 200)}. Tell them briefly and suggest what to do.]`;
      }
    } else {
      events.push({ t: "tool-result", id: item.toolCallId, ok: false, summary: "Declined" });
      if (opts.note && opts.note.trim().length > 3) await rememberLesson(payload, `Declined “${item.title}”: ${opts.note.trim()}`);
      text = `[The owner declined “${item.title}”${opts.note ? `. Their reason: ${opts.note}` : ""}. It was not done; don't retry it. Acknowledge briefly.]`;
    }

    await appendToThread(payload, thread.id, events, {
      changes,
      pending: rest,
      status: rest.length ? "waiting" : "idle",
      messages: [{ role: "user", content: text }],
    });
    return { text, events };
  });
}

/* ---------- The transcript, and the end ---------- */

export async function logVoice(opts: {
  payload: Payload;
  user: TypedUser;
  threadId: number | string;
  lines: { who: "you" | "agent"; text: string }[];
  tokens?: number;
  end?: boolean;
}) {
  const { payload, user } = opts;
  const thread = await loadThread(payload, user, opts.threadId);
  const tokens = Math.max(0, Math.min(Number(opts.tokens) || 0, 2_000_000));
  if (tokens) {
    const key = `agent:usage:${new Date().toISOString().slice(0, 10)}`;
    const usage = await usageToday(payload);
    await payload.kv.set(key, { runs: usage.runs, tokens: usage.tokens + tokens });
  }
  return serial(String(thread.id), async () => {
    const at = new Date().toISOString();
    const lines = opts.lines.map((l) => ({ who: l.who, text: String(l.text ?? "").trim().slice(0, 8000) })).filter((l) => l.text);
    const events: AgentEvent[] = lines.map((l, i) =>
      l.who === "you" ? { t: "user" as const, text: l.text, at } : { t: "text" as const, id: `voice-${Date.now()}-${i}`, delta: l.text },
    );
    const messages: ModelMessage[] = lines.map((l) => (l.who === "you" ? { role: "user" as const, content: l.text } : said(l.text)));
    const current = (await payload.findByID({ collection: "agent-threads", id: thread.id, depth: 0, overrideAccess: true })) as unknown as ThreadDoc;
    const waiting = ((current.pending as Pending[] | undefined) ?? []).length > 0;
    await appendToThread(payload, thread.id, events, { messages, ...(opts.end ? { status: waiting ? "waiting" : "idle" } : {}) });
    return { ok: true };
  });
}
