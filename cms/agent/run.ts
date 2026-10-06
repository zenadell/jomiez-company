import { isStepCount, pruneMessages, streamText, type ModelMessage, type ToolApprovalStatus } from "ai";
import type { Payload, TypedUser } from "payload";
import { Engine, undoChanges, type Recorded } from "./docs";
import { fold, type AgentEvent, type PlanStep, type TranscriptItem } from "./events";
import { decide, type Mode, type Permissions, type Risk } from "./policy";
import { buildInstructions } from "./prompt";
import { situation } from "./situation";
import { buildModel, missingSetup, PROVIDERS, resolveKey, type ProviderId } from "./providers";
import { targetsOf } from "./schema";
import { decrypt } from "./secrets";
import { notifyAddress, reportAutomaticRun } from "./notify";
import { providerProblem, type Sight } from "./eyes";
import { makeTools } from "./tools";

/*
 * One turn of the agent: it takes a request (or the owner's approval
 * decisions), works through as many steps as it needs with its tools, streams
 * every step to whoever is watching, and records the whole conversation, every
 * change and the snapshot before it, so the work survives page reloads,
 * waits for approvals across days, and can be undone.
 */

export type Decision = { approvalId: string; approved: boolean; note?: string };

export type RunInput = {
  payload: Payload;
  user: TypedUser | null;
  threadId?: number | string | null;
  message?: string;
  decisions?: Decision[];
  context?: { path?: string; title?: string } | null;
  source: "console" | "page" | "routine" | "inbox" | "api";
  scope?: "full" | "triage";
  routine?: { id: number | string; name: string; mode?: string | null } | null;
  /** Triage: the only message it may touch. */
  inquiryId?: number | string | null;
  /** How an automatic run is named in the owner's notice ("a message from Ada"). */
  label?: string;
  origin: string;
  emit?: (e: AgentEvent) => void;
  signal?: AbortSignal;
};

type Pending = { approvalId: string; toolCallId: string; name: string; title: string; runId: string };

type Thread = {
  id: number;
  title: string;
  status?: string | null;
  messages?: unknown;
  /** The provider whose model last worked on it. */
  provider?: string | null;
  events?: unknown;
  pending?: unknown;
  changes?: unknown;
  plan?: unknown;
  usage?: { input?: number | null; output?: number | null } | null;
};

/** A provider from Agent settings → Your providers. */
export type Connection = { provider: ProviderId; apiKey: string; baseURL: string | null; fastModel: string };

export type AgentConfig = {
  enabled: boolean;
  name: string;
  provider: ProviderId;
  model: string;
  fastModel: string;
  apiKey: string;
  baseURL: string | null;
  /** Every provider with a saved key (the one in use included). */
  providers: Connection[];
  thinking: string;
  perms: Permissions;
  persona: string;
  triage: boolean;
  triageDraft: boolean;
  notifyAuto: boolean;
  notifyEmail: string | null;
  voice: { enabled: boolean; model: string; voiceName: string; language: string; apiKey: string };
  /** Models for looking at and making images (empty: the newest suitable one on the Gemini key). */
  sight: { visionModel: string; imageModel: string };
  maxSteps: number;
  dailyRuns: number;
  dailyTokens: number;
};

/** The agent's settings, with the saved API key decrypted (server only). */
export async function loadConfig(payload: Payload): Promise<AgentConfig> {
  const g = (await payload.findGlobal({
    slug: "agent",
    depth: 0,
    overrideAccess: true,
    context: { revealAgentKey: true },
  })) as unknown as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const provider = (g.provider as ProviderId) || "anthropic";
  const providers: Connection[] = ((g.providers as Record<string, unknown>[] | undefined) ?? [])
    .filter((r) => r?.provider)
    .map((r) => ({
      provider: r.provider as ProviderId,
      apiKey: decrypt(typeof r.apiKey === "string" ? r.apiKey : ""),
      baseURL: (r.baseURL as string) || null,
      fastModel: String(r.fastModel || ""),
    }));
  // Before Your providers there was one key, for whichever provider was chosen: still honoured if the list has none for it.
  const legacy: Connection | null =
    typeof g.apiKey === "string" && g.apiKey
      ? { provider, apiKey: decrypt(g.apiKey), baseURL: (g.baseURL as string) || null, fastModel: String(g.fastModel || "") }
      : null;
  const active = providers.find((c) => c.provider === provider) ?? legacy;
  return {
    enabled: g.enabled !== false,
    name: String(g.name || "Keeper"),
    provider,
    model: String(g.model || ""),
    fastModel: fastFor(provider, active ? active.fastModel : String(g.fastModel || "")),
    apiKey: active?.apiKey ?? "",
    baseURL: active?.baseURL ?? null,
    providers: legacy && !providers.some((c) => c.provider === provider) ? [...providers, legacy] : providers,
    thinking: String(g.thinking || "provider-default"),
    perms: {
      mode: ((g.mode as Mode) || "drafts") as Mode,
      deletes: (g.deletes as Permissions["deletes"]) || "ask",
      email: (g.email as Permissions["email"]) || "ask",
      web: g.web !== false,
    },
    persona: String(g.persona || ""),
    triage: g.triage !== false,
    triageDraft: g.triageDraft !== false,
    notifyAuto: g.notifyAuto !== false,
    notifyEmail: (g.notifyEmail as string) || null,
    voice: {
      enabled: g.voiceEnabled !== false,
      model: String(g.voiceModel || "gemini-3.1-flash-live-preview"),
      voiceName: String(g.voiceName || "Kore"),
      language: String(g.voiceLanguage || ""),
      apiKey: decrypt(typeof g.voiceApiKey === "string" ? g.voiceApiKey : ""),
    },
    sight: { visionModel: String(g.visionModel || ""), imageModel: String(g.imageModel || "") },
    maxSteps: num(g.maxSteps, 40),
    dailyRuns: num(g.dailyRuns, 300),
    dailyTokens: num(g.dailyTokens, 5_000_000),
  };
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * A conversation's history, made safe for another provider's model. Replies keep
 * provider-only extras (reasoning with its signatures, message ids) that another
 * provider refuses; the words, tool calls and tool results all stay.
 */
export function forProvider(messages: ModelMessage[], provider: ProviderId): ModelMessage[] {
  type Part = { type: string; providerOptions?: Record<string, unknown> };
  const own = (opts?: Record<string, unknown>) => (opts && provider in opts ? { [provider]: opts[provider] } : undefined);
  const out: ModelMessage[] = [];
  for (const m of messages) {
    const { providerOptions, ...rest } = m as ModelMessage & { providerOptions?: Record<string, unknown> };
    const base = { ...rest, ...(own(providerOptions) ? { providerOptions: own(providerOptions) } : {}) } as ModelMessage;
    if (typeof base.content === "string") {
      out.push(base);
      continue;
    }
    const parts = (base.content as Part[])
      .filter((p) => p.type !== "reasoning")
      .map((p) => {
        const { providerOptions: po, ...part } = p;
        return own(po) ? { ...part, providerOptions: own(po) } : part;
      });
    if (parts.length) out.push({ ...base, content: parts } as ModelMessage);
  }
  return out;
}

/* The quick model must belong to the main provider: a Claude ID left over after switching to, say, DeepSeek is ignored. */
function fastFor(provider: ProviderId, fast: string) {
  const id = fast.trim();
  if (!id) return "";
  if (provider !== "anthropic" && /^claude-/i.test(id)) return "";
  if (provider === "anthropic" && !/^claude-/i.test(id)) return "";
  return id;
}

/** A picture to show with a step's result: a screenshot taken, or an image made or added. */
export function imageOf(output: unknown): { image?: string } {
  const o = output as { shot?: unknown; url?: unknown; mediaId?: unknown } | null;
  if (!o || typeof o !== "object") return {};
  if (typeof o.shot === "string") return { image: o.shot };
  if (o.mediaId != null && typeof o.url === "string") return { image: o.url };
  return {};
}

export async function usageToday(payload: Payload) {
  return (await payload.kv.get<{ runs: number; tokens: number }>(`agent:usage:${today()}`)) ?? { runs: 0, tokens: 0 };
}

const REASONS: Record<Risk, string> = {
  read: "",
  note: "",
  draft: "Changes content (as a draft)",
  live: "Changes what visitors see",
  delete: "Deletes something",
  email: "Sends an email",
  web: "Reads another website",
};

/* In-process controllers, so Stop is instant when the run is on this server. */
const running = ((globalThis as { __jomiezAgentRuns?: Map<string, AbortController> }).__jomiezAgentRuns ??= new Map());

export async function requestStop(payload: Payload, threadId: string | number) {
  await payload.kv.set(`agent:stop:${threadId}`, true);
  running.get(String(threadId))?.abort();
}

function summarize(output: unknown): string {
  if (output == null) return "Done";
  if (typeof output === "string") return output.slice(0, 200);
  const o = output as Record<string, unknown>;
  if (typeof o.error === "string") return o.error;
  const parts: string[] = [];
  if (typeof o.status === "string") parts.push(o.status);
  if (typeof o.changed === "string") parts.push(o.changed.split("\n").slice(0, 3).join(" "));
  if (typeof o.published === "string") parts.push(o.published.split("\n").slice(0, 3).join(" "));
  if (typeof o.summary === "string") parts.push(o.summary);
  if (typeof o.total === "number") parts.push(`${o.total} found`);
  if (Array.isArray(o.matches)) parts.push(`${o.matches.length} places`);
  if (typeof o.title === "string" && !parts.length) parts.push(o.title);
  if (typeof o.report === "string") parts.push(o.report.slice(0, 160));
  if (typeof o.seen === "string") parts.push(o.seen.replace(/\s+/g, " ").slice(0, 220));
  if (Array.isArray(o.images)) parts.push(`${o.images.length} images`);
  if (Array.isArray(o.photos)) parts.push(`${o.photos.length} photos`);
  if (typeof o.note === "string" && !parts.length) parts.push(o.note);
  return (parts.join(" · ") || "Done").slice(0, 300);
}

/**
 * An error in plain words. A tool's own error is passed on as it is: it already
 * says what failed (a tool can fail because of another service, like Gemini
 * looking at an image, and that must not be blamed on the agent's own model).
 * When the agent's model itself fails, the provider's reason is named.
 */
const errorText = (err: unknown, model?: string): string => {
  const e = err as { message?: string; data?: { errors?: { message?: string; path?: string }[] } };
  const details = e?.data?.errors?.map((x) => `${x.path ? `${x.path}: ` : ""}${x.message}`).join("; ");
  if (!model || !fromProvider(err)) return (details || e?.message || String(err)).slice(0, 600);
  return `The model (${model}) stopped: ${providerProblem(err)}.`.slice(0, 600);
};

/** An error from calling the model provider (as opposed to the site's own work). */
const fromProvider = (err: unknown): boolean => {
  const e = err as { name?: string; statusCode?: number; lastError?: unknown } | null;
  return Boolean(e && (e.statusCode || /APICall|Retry|LoadAPIKey|NoSuchModel|InvalidResponseData/i.test(e.name ?? "") || (e.lastError && fromProvider(e.lastError))));
};

export async function runAgent(input: RunInput): Promise<{ threadId: number; status: string }> {
  const { payload } = input;
  const emit = (e: AgentEvent) => {
    events = fold(events, e);
    try {
      input.emit?.(e);
    } catch {
      // The watcher left; the work carries on and is saved.
    }
  };
  let events: TranscriptItem[] = [];
  const cfg = await loadConfig(payload);
  const scope = input.scope ?? "full";

  /* ----- The conversation ----- */
  let thread: Thread;
  if (input.threadId) {
    thread = (await payload.findByID({ collection: "agent-threads", id: Number(input.threadId), depth: 0, overrideAccess: true })) as unknown as Thread;
    const owner = (thread as unknown as { owner?: number | null }).owner;
    const isAdmin = (input.user as { roles?: string[] } | null)?.roles?.includes("admin");
    if (input.user && owner && owner !== input.user.id && !isAdmin) throw new Error("That conversation belongs to someone else.");
  } else {
    // Photos attached from the phone ("📷 Photo s…") aren't words for a title.
    const words = (input.message ?? "").replace(/^📷 Photo s[a-z0-9]+$/gm, "").replace(/\s+/g, " ").trim();
    const title = words.slice(0, 80) || (/📷 Photo/.test(input.message ?? "") ? "A photo" : "New task");
    thread = (await payload.create({
      collection: "agent-threads",
      data: {
        title,
        owner: input.user?.id ?? null,
        source: input.source,
        status: "idle",
        context: input.context ?? null,
        messages: [],
        events: [],
        changes: [],
        pending: [],
        routine: input.routine ? Number(input.routine.id) : null,
      } as never,
      overrideAccess: true,
    })) as unknown as Thread;
  }
  events = Array.isArray(thread.events) ? (thread.events as TranscriptItem[]) : [];
  const threadId = thread.id;
  input.emit?.({ t: "thread", id: String(threadId), title: thread.title });

  const save = async (data: Record<string, unknown>) =>
    payload.update({ collection: "agent-threads", id: threadId, data: data as never, overrideAccess: true, depth: 0 });

  const fail = async (message: string) => {
    emit({ t: "error", message });
    emit({ t: "status", status: "error" });
    await save({ events, status: "error" });
    return { threadId, status: "error" };
  };

  /* ----- Is it allowed to run? ----- */
  if (!cfg.enabled) return fail("The agent is switched off (Agent → Settings).");
  const setup = missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  if (setup) return fail(setup);
  const usage = await usageToday(payload);
  if (usage.runs >= cfg.dailyRuns) return fail(`Today's limit of ${cfg.dailyRuns} tasks is reached (Agent → Settings → Limits).`);
  if (usage.tokens >= cfg.dailyTokens) return fail(`Today's limit of ${cfg.dailyTokens.toLocaleString()} tokens is reached (Agent → Settings → Limits).`);

  const lockKey = `agent:lock:${threadId}`;
  const lock = await payload.kv.get<{ at: number }>(lockKey);
  if (lock && Date.now() - lock.at < 6 * 60_000) return fail("Still working on the last request in this conversation. Wait for it, or press Stop.");
  await payload.kv.set(lockKey, { at: Date.now() });
  await payload.kv.delete(`agent:stop:${threadId}`);

  const runId = `r${Date.now().toString(36)}`;
  const changes: Recorded[] = Array.isArray(thread.changes) ? (thread.changes as Recorded[]) : [];
  let plan: PlanStep[] = Array.isArray(thread.plan) ? (thread.plan as PlanStep[]) : [];
  let pending: Pending[] = Array.isArray(thread.pending) ? (thread.pending as Pending[]) : [];
  let messages: ModelMessage[] = Array.isArray(thread.messages) ? (thread.messages as ModelMessage[]) : [];
  // Switched to another provider since the last request: its replies' provider-only parts would be refused.
  if (thread.provider && thread.provider !== cfg.provider) messages = forProvider(messages, cfg.provider);

  /* ----- What was asked ----- */
  if (input.decisions?.length) {
    const known = new Map(pending.map((p) => [p.approvalId, p]));
    const valid = input.decisions.filter((d) => known.has(d.approvalId));
    if (!valid.length) {
      await payload.kv.delete(lockKey);
      return fail("Those approvals were already answered.");
    }
    messages = [
      ...messages,
      {
        role: "tool",
        content: valid.map((d) => ({
          type: "tool-approval-response" as const,
          approvalId: d.approvalId,
          approved: d.approved,
          reason: d.approved
            ? `The owner approved this.${d.note ? ` Note: ${d.note}` : ""}`
            : `The owner declined this, so it was not done${d.note ? `. Their reason: ${d.note}` : "."} Don't retry it.`,
        })),
      } as ModelMessage,
    ];
    for (const d of valid) {
      emit({ t: "decision", approvalId: d.approvalId, approved: d.approved, note: d.note });
      // A decline with a reason is a lesson worth keeping.
      const p = known.get(d.approvalId)!;
      if (!d.approved && d.note && d.note.trim().length > 3) await rememberLesson(payload, `Declined “${p.title}”: ${d.note.trim()}`);
    }
    pending = pending.filter((p) => !valid.some((d) => d.approvalId === p.approvalId));
  } else if (input.message) {
    emit({ t: "user", text: input.message, at: new Date().toISOString() });
    const where = input.context?.path ? `\n\n[Open in the admin: ${input.context.title ?? ""} ${input.context.path}]` : "";
    messages = [...messages, { role: "user", content: input.message + where }];
    // Unanswered approvals from before are dropped once the person moves on.
    // (Approvals asked for in a voice conversation aren't part of the model's history, so they're just skipped.)
    const answerable = pending.filter((p) => !p.approvalId.startsWith("va_"));
    if (answerable.length) {
      messages = [
        ...messages.slice(0, -1),
        {
          role: "tool",
          content: answerable.map((p) => ({
            type: "tool-approval-response" as const,
            approvalId: p.approvalId,
            approved: false,
            reason: "Not done: the owner moved on without approving it.",
          })),
        } as ModelMessage,
        messages[messages.length - 1],
      ];
    }
    for (const p of pending) emit({ t: "decision", approvalId: p.approvalId, approved: false, note: "Skipped" });
    pending = [];
  }

  emit({ t: "status", status: "running" });
  await save({ status: "running", events, pending });

  /* ----- The work ----- */
  const controller = new AbortController();
  running.set(String(threadId), controller);
  input.signal?.addEventListener("abort", () => {
    // The browser left: keep working (the result is saved), unless it was a Stop.
  });

  const perms: Permissions = { ...cfg.perms };
  if (input.routine?.mode && input.routine.mode !== "inherit") perms.mode = input.routine.mode as Mode;
  if (scope === "triage") perms.mode = "drafts";

  const actor = { payload, user: input.user, system: !input.user };
  const engine = new Engine(actor, (r) => changes.push({ ...r, at: new Date().toISOString(), runId }));
  const model = buildModel({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  const helperModel = cfg.fastModel
    ? buildModel({ provider: cfg.provider, model: cfg.fastModel, apiKey: cfg.apiKey, baseURL: cfg.baseURL })
    : model;

  const { tools, meta } = makeTools({
    actor,
    engine,
    perms,
    origin: input.origin,
    scope,
    inquiryId: input.inquiryId ?? null,
    emit,
    setPlan: (s) => (plan = s),
    helperModel,
    threadId: String(threadId),
    sight: scope === "full" ? sightOf(cfg) : undefined,
  });

  const { docs: memory } = await payload.find({ collection: "agent-memory", sort: "-updatedAt", limit: 60, depth: 0, overrideAccess: true });
  const now = await (scope === "full" ? situation(payload, input.user ?? null, { exclude: threadId, timeZone: process.env.AGENT_TIMEZONE || "Africa/Lagos" }) : Promise.resolve(undefined)).catch(
    () => undefined,
  );
  const instructions = buildInstructions({
    situation: now,
    name: cfg.name,
    persona: cfg.persona,
    memory: memory.map((m) => ({ id: m.id, kind: String(m.kind ?? "fact"), content: String(m.content ?? "") })),
    mode: perms.mode,
    web: perms.web,
    user: input.user as never,
    source: input.source,
    via: input.source === "api" ? input.label : undefined,
    scope,
    context: input.context,
    routine: input.routine,
    targets: targetsOf(payload),
    now: new Date(),
    timeZone: process.env.AGENT_TIMEZONE || "Africa/Lagos",
    draftReplies: cfg.triageDraft,
  });

  const toolApproval = async ({ toolCall }: { toolCall: { toolName: string; input: unknown } }): Promise<ToolApprovalStatus> => {
    const m = meta[toolCall.toolName];
    if (!m) return "not-applicable";
    let risk: Risk;
    try {
      risk = m.risk((toolCall.input ?? {}) as Record<string, unknown>);
    } catch {
      return "not-applicable"; // A bad target: the tool itself explains the mistake.
    }
    const d = decide(risk, perms);
    if (d === "auto") return "not-applicable";
    if (d === "deny") return { type: "denied", reason: `The owner's settings don't allow this (${REASONS[risk].toLowerCase()}).` };
    if (await m.skipApproval?.((toolCall.input ?? {}) as Record<string, unknown>)) return "not-applicable";
    return { type: "user-approval", reason: REASONS[risk] };
  };

  let tokensIn = 0;
  let tokensOut = 0;
  let status: "idle" | "waiting" | "stopped" | "error" = "idle";
  const inputs = new Map<string, unknown>();

  const persist = async () => {
    await save({
      events,
      plan,
      pending,
      changes,
      usage: { input: (thread.usage?.input ?? 0) + tokensIn, output: (thread.usage?.output ?? 0) + tokensOut },
    });
  };

  try {
    const result = streamText({
      model,
      instructions,
      messages,
      tools,
      toolApproval: toolApproval as never,
      stopWhen: isStepCount(cfg.maxSteps),
      abortSignal: controller.signal,
      ...(cfg.thinking && cfg.thinking !== "provider-default" ? { reasoning: cfg.thinking as never } : {}),
      prepareStep: async ({ messages: current }) => {
        if (await payload.kv.get(`agent:stop:${threadId}`)) controller.abort();
        // Long conversations: keep recent tool detail, drop old tool traffic (the replies stay).
        if (JSON.stringify(current).length > 400_000) {
          return { messages: pruneMessages({ messages: current, toolCalls: "before-last-8-messages", emptyMessages: "remove" }) };
        }
        return undefined;
      },
      onStepEnd: async () => {
        await persist().catch(() => {});
      },
    });

    for await (const part of result.stream) {
      switch (part.type) {
        case "text-delta":
          emit({ t: "text", id: `${runId}-${part.id}`, delta: part.text });
          break;
        case "reasoning-delta":
          emit({ t: "reasoning", id: `${runId}-${part.id}`, delta: part.text });
          break;
        case "tool-call": {
          inputs.set(part.toolCallId, part.input);
          let title = part.toolName;
          try {
            title = meta[part.toolName]?.title((part.input ?? {}) as Record<string, unknown>) ?? part.toolName;
          } catch {
            // keep the tool name
          }
          emit({ t: "tool", id: part.toolCallId, name: part.toolName, title, input: part.input });
          break;
        }
        case "tool-result":
          emit({ t: "tool-result", id: part.toolCallId, ok: true, summary: summarize(part.output), ...imageOf(part.output) });
          break;
        case "tool-error":
          emit({ t: "tool-result", id: part.toolCallId, ok: false, summary: errorText(part.error) });
          break;
        case "tool-output-denied":
          emit({ t: "tool-result", id: part.toolCallId, ok: false, summary: "Not done" });
          break;
        case "tool-approval-request": {
          if (part.isAutomatic) break;
          const call = part.toolCall as { toolCallId: string; toolName: string; input: unknown };
          const m = meta[call.toolName];
          const data = (call.input ?? {}) as Record<string, unknown>;
          let preview: { changes?: { where: string; before: string; after: string }[]; detail?: string } = {};
          try {
            preview = (await m?.preview?.(data)) ?? {};
          } catch (err) {
            preview = { detail: `Couldn't preview this change: ${errorText(err)}` };
          }
          let title = call.toolName;
          try {
            title = m?.title(data) ?? call.toolName;
          } catch {
            // keep the tool name
          }
          const risk = (() => {
            try {
              return m?.risk(data) ?? "live";
            } catch {
              return "live";
            }
          })();
          pending.push({ approvalId: part.approvalId, toolCallId: call.toolCallId, name: call.toolName, title, runId });
          emit({
            t: "approval",
            approvalId: part.approvalId,
            toolCallId: call.toolCallId,
            name: call.toolName,
            title,
            risk,
            reason: String(data.reason ?? part.reason ?? ""),
            changes: preview.changes,
            detail: preview.detail,
          });
          break;
        }
        case "finish-step":
          tokensIn += part.usage?.inputTokens ?? 0;
          tokensOut += part.usage?.outputTokens ?? 0;
          emit({ t: "usage", input: tokensIn, output: tokensOut });
          break;
        case "error":
          throw part.error;
        case "abort":
          status = "stopped";
          break;
        default:
          break;
      }
    }

    if (status !== "stopped") {
      const response = (await result.responseMessages) as ModelMessage[];
      messages = [...messages, ...response];
      status = pending.length ? "waiting" : "idle";
    }
  } catch (err) {
    if (controller.signal.aborted) status = "stopped";
    else {
      status = "error";
      emit({ t: "error", message: errorText(err, cfg.model) });
    }
  } finally {
    running.delete(String(threadId));
  }

  if (status === "stopped") emit({ t: "notice", text: "Stopped. Everything done so far is saved and can be undone." });
  emit({ t: "status", status });

  // Pending approvals must stay answerable: keep the whole message history when waiting.
  await save({
    messages: status === "stopped" ? (thread.messages ?? []) : messages,
    ...(status === "stopped" ? {} : { provider: cfg.provider }),
    events,
    plan,
    pending: status === "waiting" ? pending : [],
    changes,
    status,
    usage: { input: (thread.usage?.input ?? 0) + tokensIn, output: (thread.usage?.output ?? 0) + tokensOut },
    model: `${cfg.provider}/${cfg.model}`,
  });
  const u = await usageToday(payload);
  await payload.kv.set(`agent:usage:${today()}`, { runs: u.runs + 1, tokens: u.tokens + tokensIn + tokensOut });
  await payload.kv.delete(lockKey);
  await payload.kv.delete(`agent:stop:${threadId}`);

  // Nobody watched this one: tell the owner what happened.
  if (input.source === "routine" || input.source === "inbox") {
    const lastText = [...events].reverse().find((e) => e.kind === "text");
    const lastError = [...events].reverse().find((e) => e.kind === "error");
    await reportAutomaticRun(
      payload,
      {
        kind: input.source,
        name: input.routine?.name ?? input.label ?? "a new message",
        status,
        threadId,
        summary: (lastText && "text" in lastText ? lastText.text : "") || (lastError && "message" in lastError ? lastError.message : ""),
        changes: changes.filter((c) => c.runId === runId),
        waiting: status === "waiting" ? pending.filter((p) => p.runId === runId).map((p) => p.title) : [],
        origin: input.origin,
      },
      { email: cfg.notifyAuto, to: await notifyAddress(payload, cfg.notifyEmail), agentName: cfg.name },
    ).catch((err) => payload.logger.error({ err, msg: "Agent notice failed" }));
  }
  return { threadId, status };
}

/** Undo everything a conversation changed (or only one request's changes). */
export async function undoThread(payload: Payload, user: TypedUser | null, threadId: number | string, runId?: string) {
  const thread = (await payload.findByID({ collection: "agent-threads", id: Number(threadId), depth: 0, overrideAccess: true })) as unknown as Thread;
  const all = (Array.isArray(thread.changes) ? thread.changes : []) as Recorded[];
  const chosen = all.filter((c) => !c.undone && (!runId || c.runId === runId));
  if (!chosen.length) return { results: ["Nothing to undo."] };
  const results = await undoChanges({ payload, user, system: !user }, targetsOf(payload), chosen);
  let events = (Array.isArray(thread.events) ? thread.events : []) as TranscriptItem[];
  events = fold(events, { t: "notice", text: `Undone: ${results.join("; ")}` });
  await payload.update({ collection: "agent-threads", id: thread.id, data: { changes: all, events } as never, overrideAccess: true });
  return { results };
}

/** Keeps a lesson from a declined change (once: the same lesson twice adds nothing). */
export async function rememberLesson(payload: Payload, content: string) {
  const { totalDocs } = await payload.count({ collection: "agent-memory", where: { content: { equals: content } }, overrideAccess: true });
  if (totalDocs) return;
  await payload.create({ collection: "agent-memory", data: { content, kind: "lesson", source: "correction" } as never, overrideAccess: true });
}

/** How the agent sees and makes images: the Gemini key when there is one, and the main model as a fallback for seeing. */
export function sightOf(cfg: AgentConfig): Sight {
  return {
    geminiKey: voiceKey(cfg) || undefined,
    visionModel: cfg.sight.visionModel || undefined,
    imageModel: cfg.sight.imageModel || undefined,
    main: { provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL },
  };
}

/** One provider's saved key and address (the key from the environment when none is saved). */
export function connectionFor(cfg: AgentConfig, provider: ProviderId): Connection | null {
  return cfg.providers.find((c) => c.provider === provider) ?? null;
}

/** The providers the agent can switch to: those with a key saved, or one in the environment. */
export function usableProviders(cfg: AgentConfig): ProviderId[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).filter((id) => {
    const c = connectionFor(cfg, id);
    if (id === "custom" && !c?.baseURL) return false;
    if (PROVIDERS[id].keyless) return Boolean(c);
    return Boolean(resolveKey(id, c?.apiKey ?? ""));
  });
}

/** The Gemini key for voice: its own, else the Google key from Your providers, else the environment. */
export function voiceKey(cfg: AgentConfig): string {
  return (
    cfg.voice.apiKey ||
    connectionFor(cfg, "google")?.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}
