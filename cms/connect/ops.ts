import type { Payload, Where } from "payload";
import { z } from "zod";
import type { AgentEvent, TranscriptItem } from "../agent/events";
import { fold } from "../agent/events";
import { listNotices } from "../agent/notify";
import { missingSetup, PROVIDERS, type ProviderId } from "../agent/providers";
import { loadConfig, requestStop, runAgent, undoThread, usableProviders, usageToday, type Decision } from "../agent/run";
import { gist, push } from "../app/push";
import { loadOutreach } from "../outreach/settings";
import { LEAD_STATUSES } from "../outreach/config";
import { previewLink } from "../outreach/write";
import { logCall, type Caller } from "./auth";
import type { Scope } from "./keys";

/*
 * What a connected agent can do, shared by the REST API (/api/v1) and the MCP
 * server (/api/mcp): see what Keeper is doing, give it work, answer its
 * approvals, and control it. Each operation names the permission it needs.
 * Nothing here ever returns an API key, password or other secret.
 */

export type Ctx = Caller & {
  payload: Payload;
  origin: string;
  /** Keeps work going after the answer is sent (a long task outlives the request). */
  keepAlive: (work: Promise<unknown>) => void;
};

export type Op<S extends z.ZodType = z.ZodType> = {
  name: string;
  scope: Scope | null;
  description: string;
  input: S;
  run: (ctx: Ctx, args: z.infer<S>) => Promise<unknown>;
};

const op = <S extends z.ZodType>(o: Op<S>) => o as unknown as Op;

/** Thrown for an answer the caller should see as an error (not found, not allowed…). */
export class OpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const cut = (s: unknown, n: number) => {
  const t = typeof s === "string" ? s : s == null ? "" : JSON.stringify(s);
  return t.length > n ? `${t.slice(0, n)}… (${t.length - n} more characters)` : t;
};

/* ---------- Conversations ---------- */

type Thread = { id: number; title: string; status?: string; source?: string; owner?: number | null; events?: unknown; plan?: unknown; pending?: unknown; changes?: unknown; usage?: unknown; model?: string; createdAt?: string; updatedAt?: string };

async function threadFor(ctx: Ctx, id: number) {
  const t = (await ctx.payload.findByID({ collection: "agent-threads", id, depth: 0, overrideAccess: false, user: ctx.user }).catch(() => null)) as Thread | null;
  if (!t) throw new OpError(`No conversation ${id}.`, 404);
  return t;
}

/** A transcript, readable by another program: words in full, tool steps in brief, pictures as a note. */
function transcript(items: TranscriptItem[], reasoning: boolean) {
  return items
    .filter((it) => reasoning || it.kind !== "reasoning")
    .map((it) => {
      switch (it.kind) {
        case "user":
          return { type: "request", at: it.at, text: cut(it.text, 6000) };
        case "text":
          return { type: "reply", text: cut(it.text, 8000) };
        case "reasoning":
          return { type: "thinking", text: cut(it.text, 3000) };
        case "tool":
          return { type: "step", tool: it.name, title: it.title, input: cut(it.input, 1500), ok: it.ok, result: it.summary, ...(it.waiting ? { waiting: true } : {}), ...(it.image ? { picture: "a screenshot or image (open the conversation in the admin to see it)" } : {}) };
        case "approval":
          return { type: "approval", approval_id: it.approvalId, title: it.title, risk: it.risk, reason: it.reason, changes: it.changes, detail: it.detail ? cut(it.detail, 2000) : undefined, decided: Boolean(it.decided), approved: it.approved, note: it.note };
        case "change":
          return { type: "change", title: it.title, action: it.action, admin: it.admin, site: it.site, changes: it.changes };
        case "notice":
          return { type: "notice", text: it.text };
        case "error":
          return { type: "error", text: it.message };
        default:
          return it;
      }
    });
}

const waitingApprovals = (t: Thread) =>
  ((Array.isArray(t.pending) ? t.pending : []) as { approvalId: string; name: string; title: string }[]).map((p) => ({ approval_id: p.approvalId, tool: p.name, title: p.title }));

/**
 * Runs Keeper (a new request, more in a conversation, or approval answers) and
 * waits up to `wait` seconds for it to finish. Longer work carries on, and
 * get_conversation shows how it ends.
 */
async function work(ctx: Ctx, args: { threadId?: number; message?: string; decisions?: Decision[]; wait: number }) {
  let items: TranscriptItem[] = [];
  let threadId: number | null = args.threadId ?? null;
  let status = "running";
  const emit = (e: AgentEvent) => {
    items = fold(items, e);
    if (e.t === "thread") threadId = Number(e.id);
    if (e.t === "status") status = e.status;
  };
  const run = runAgent({
    payload: ctx.payload,
    user: ctx.user,
    threadId,
    message: args.message,
    decisions: args.decisions,
    source: "api",
    label: ctx.key.name,
    origin: ctx.origin,
    emit,
  }).then(async (r) => {
    // Waiting for an approval this key can't give: tell the owner on their phone.
    if (r.status === "waiting" && !ctx.key.scopes.includes("approve")) {
      const { name } = await loadConfig(ctx.payload);
      const t = await ctx.payload.findByID({ collection: "agent-threads", id: r.threadId, depth: 0, overrideAccess: true }).catch(() => null);
      await push(
        ctx.payload,
        { title: `${name} needs your approval`, body: `“${ctx.key.name}” asked: ${gist(String(t?.title ?? ""), 120)}`, url: `/app?thread=${r.threadId}`, tag: `thread-${r.threadId}` },
        { userId: ctx.user.id },
      ).catch(() => undefined);
    }
    return r;
  });
  ctx.keepAlive(run);
  // Settles either way, so a run that fails after the answer was sent isn't an unhandled rejection.
  const settled = run.then(
    () => true,
    () => true,
  );
  const finished = await Promise.race([settled, new Promise<false>((r) => setTimeout(() => r(false), args.wait * 1000))]);
  if (finished) status = (await run).status;
  if (!threadId) throw new OpError("Keeper didn't start. Try again.", 500);
  const thread = await threadFor(ctx, threadId);
  const said = [...items].reverse().find((it) => it.kind === "text");
  const error = [...items].reverse().find((it) => it.kind === "error");
  return {
    conversation_id: threadId,
    status: finished ? status : "running",
    reply: said && "text" in said ? said.text : null,
    ...(error && "message" in error ? { error: error.message } : {}),
    steps: transcript(items, false).filter((x) => (x as { type: string }).type === "step"),
    changes: transcript(items, false).filter((x) => (x as { type: string }).type === "change"),
    waiting_for_approval: thread.status === "waiting" ? waitingApprovals(thread) : [],
    ...(finished
      ? {}
      : { note: `Still working after ${args.wait} seconds; it carries on. Call get_conversation with conversation_id ${threadId} to see how it ends.` }),
  };
}

/* ---------- Leads ---------- */

type Lead = Record<string, unknown> & { id: number; preview?: { slug?: string; views?: number; lastViewedAt?: string; madeAt?: string } | null };

const leadBrief = (l: Lead) => ({
  id: l.id,
  name: l.name,
  kind: l.kind,
  area: l.area,
  country: l.country,
  status: l.status,
  score: l.score,
  phone: l.phone,
  email: l.email,
  website: l.website,
  summary: cut(l.summary, 400),
  preview: l.preview?.slug ? { url: previewLink(l.preview.slug), views: l.preview.views ?? 0, last_viewed_at: l.preview.lastViewedAt ?? null } : null,
  contacted_at: l.contactedAt ?? null,
  updated_at: l.updatedAt,
});

/* ---------- The operations ---------- */

const id = z.coerce.number().int().positive();
/** true/false, also as the words "true"/"false" from a web address (z.coerce.boolean would read "false" as true). */
const bool = z.union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")]);
const wait = z.coerce.number().int().min(0).max(240).default(120).describe("Seconds to wait for Keeper to finish before answering (0–240). Longer work carries on; check with get_conversation.");

export const OPS: Op[] = [
  op({
    name: "whoami",
    scope: null,
    description: "This access key: its name, what it may do, when it expires, and which admin it acts as.",
    input: z.object({}),
    run: async (ctx) => {
      const key = await ctx.payload.findByID({ collection: "access-keys", id: ctx.key.id, depth: 0, overrideAccess: true });
      return { key: ctx.key.name, starts_with: ctx.key.prefix, scopes: ctx.key.scopes, expires_at: (key as { expiresAt?: string }).expiresAt ?? null, acts_as: { name: (ctx.user as { name?: string }).name ?? null, email: ctx.user.email }, your_ip: ctx.ip };
    },
  }),
  op({
    name: "keeper_status",
    scope: "read",
    description: "Is Keeper on and ready, which model it uses, its autonomy, how many conversations are working or waiting for approval, today's usage and limits, and its pinned briefing.",
    input: z.object({}),
    run: async (ctx) => {
      const cfg = await loadConfig(ctx.payload);
      const setup = missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
      const [waiting, working, usage, briefing, notices] = await Promise.all([
        ctx.payload.count({ collection: "agent-threads", where: { status: { equals: "waiting" } }, overrideAccess: true }),
        ctx.payload.count({ collection: "agent-threads", where: { status: { equals: "running" } }, overrideAccess: true }),
        usageToday(ctx.payload),
        ctx.payload.kv.get("agent:briefing"),
        listNotices(ctx.payload),
      ]);
      return {
        name: cfg.name,
        enabled: cfg.enabled,
        ready: cfg.enabled && !setup,
        problem: setup,
        provider: cfg.provider,
        model: cfg.model,
        autonomy: cfg.perms.mode,
        conversations_working: working.totalDocs,
        conversations_waiting_for_approval: waiting.totalDocs,
        unread_notices: notices.filter((n) => !n.read).length,
        usage_today: usage,
        limits: { tasks_per_day: cfg.dailyRuns, tokens_per_day: cfg.dailyTokens, steps_per_task: cfg.maxSteps },
        briefing,
      };
    },
  }),
  op({
    name: "list_conversations",
    scope: "read",
    description: "Keeper's conversations, newest first: everything it was asked, by anyone (the console, the phone app, routines, new messages, connected agents).",
    input: z.object({
      limit: z.coerce.number().int().min(1).max(50).default(20),
      status: z.enum(["idle", "running", "waiting", "stopped", "error"]).optional().describe("idle = done, running = working, waiting = waiting for approval"),
      search: z.string().max(100).optional().describe("Words in the title"),
      page: z.coerce.number().int().min(1).default(1),
    }),
    run: async (ctx, a) => {
      const where: Where[] = [];
      if (a.status) where.push({ status: { equals: a.status } });
      if (a.search) where.push({ title: { like: a.search } });
      const res = await ctx.payload.find({
        collection: "agent-threads",
        where: where.length ? { and: where } : {},
        sort: "-updatedAt",
        limit: a.limit,
        page: a.page,
        depth: 0,
        user: ctx.user,
        overrideAccess: false,
        select: { title: true, status: true, source: true, model: true, updatedAt: true, createdAt: true },
      });
      return { conversations: res.docs.map((d) => ({ id: d.id, title: d.title, status: d.status, source: d.source, model: (d as { model?: string }).model, updated_at: d.updatedAt, created_at: d.createdAt })), page: res.page, pages: res.totalPages, total: res.totalDocs };
    },
  }),
  op({
    name: "get_conversation",
    scope: "read",
    description: "One conversation in full: each request, Keeper's replies, every step it took with its result, approvals asked for and answered, and the changes it made (with links).",
    input: z.object({
      id: id.describe("The conversation id"),
      last: z.coerce.number().int().min(1).max(400).default(80).describe("Only the last N items of the transcript"),
      reasoning: bool.default(false).describe("Include its thinking, where the model shows it"),
    }),
    run: async (ctx, a) => {
      const t = await threadFor(ctx, a.id);
      const items = (Array.isArray(t.events) ? t.events : []) as TranscriptItem[];
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        source: t.source,
        model: t.model,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
        plan: t.plan ?? [],
        waiting_for_approval: t.status === "waiting" ? waitingApprovals(t) : [],
        usage: t.usage,
        items_total: items.length,
        transcript: transcript(items.slice(-a.last), a.reasoning),
      };
    },
  }),
  op({
    name: "ask_keeper",
    scope: "chat",
    description:
      "Give Keeper a task, or continue a conversation (pass conversation_id). It works with its own tools and the owner's permissions; anything that needs approval waits (the owner gets a notification, or a key with the approve permission can answer). Returns its reply, the steps it took and anything waiting.",
    input: z.object({
      message: z.string().min(1).max(20_000).describe("What you'd like Keeper to do, in plain words"),
      conversation_id: id.optional().describe("Continue this conversation instead of starting a new one"),
      wait,
    }),
    run: async (ctx, a) => {
      if (a.conversation_id) await threadFor(ctx, a.conversation_id);
      return work(ctx, { threadId: a.conversation_id, message: a.message, wait: a.wait });
    },
  }),
  op({
    name: "answer_approval",
    scope: "approve",
    description: "Approve or decline something Keeper is waiting on (see waiting_for_approval in a conversation). It then carries on with the rest of the work.",
    input: z.object({
      conversation_id: id,
      approval_id: z.string().min(1).max(200),
      approve: bool.describe("true to let it go ahead, false to decline"),
      note: z.string().max(2000).optional().describe("Why, or what to do instead (Keeper reads it, and learns from declines)"),
      wait,
    }),
    run: async (ctx, a) => {
      const t = await threadFor(ctx, a.conversation_id);
      if (a.approval_id.startsWith("va_")) throw new OpError("That approval was asked for in a voice conversation: answer it in the app.", 409);
      if (!waitingApprovals(t).some((p) => p.approval_id === a.approval_id)) throw new OpError("That approval isn't waiting in this conversation (it may already be answered).", 409);
      return work(ctx, { threadId: a.conversation_id, decisions: [{ approvalId: a.approval_id, approved: a.approve, note: a.note }], wait: a.wait });
    },
  }),
  op({
    name: "stop_conversation",
    scope: "control",
    description: "Stop a conversation that's working, at its next step.",
    input: z.object({ conversation_id: id }),
    run: async (ctx, a) => {
      const t = await threadFor(ctx, a.conversation_id);
      await requestStop(ctx.payload, t.id);
      return { ok: true, conversation_id: t.id, was: t.status };
    },
  }),
  op({
    name: "undo_changes",
    scope: "control",
    description: "Undo the changes a conversation made to the site (all of them, or one request's with run_id from its changes).",
    input: z.object({ conversation_id: id, run_id: z.string().max(40).optional() }),
    run: async (ctx, a) => {
      const t = await threadFor(ctx, a.conversation_id);
      return undoThread(ctx.payload, ctx.user, t.id, a.run_id);
    },
  }),
  op({
    name: "list_activity",
    scope: "read",
    description: "What Keeper did on its own (routines, new messages it sorted), newest first, and today's usage.",
    input: z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) }),
    run: async (ctx, a) => ({ notices: (await listNotices(ctx.payload)).slice(0, a.limit), usage_today: await usageToday(ctx.payload) }),
  }),
  op({
    name: "list_leads",
    scope: "read",
    description: "Businesses found for outreach (Clients → Leads), best first: status, score, what the check found, preview link and views.",
    input: z.object({
      status: z.enum(LEAD_STATUSES.map((s) => s.value) as [string, ...string[]]).optional(),
      search: z.string().max(100).optional().describe("Words in the name or area"),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      page: z.coerce.number().int().min(1).default(1),
    }),
    run: async (ctx, a) => {
      const where: Where[] = [];
      if (a.status) where.push({ status: { equals: a.status } });
      if (a.search) where.push({ or: [{ name: { like: a.search } }, { area: { like: a.search } }] });
      const res = await ctx.payload.find({ collection: "leads", where: where.length ? { and: where } : {}, sort: "-score", limit: a.limit, page: a.page, depth: 0, overrideAccess: false, user: ctx.user, select: { shot: false, check: false, messages: false, log: false, preview: { content: false } } as never });
      return { leads: (res.docs as unknown as Lead[]).map(leadBrief), page: res.page, pages: res.totalPages, total: res.totalDocs };
    },
  }),
  op({
    name: "get_lead",
    scope: "read",
    description: "One lead in full: what the website check found, the messages written for it, its preview, and its history.",
    input: z.object({ id }),
    run: async (ctx, a) => {
      const l = (await ctx.payload.findByID({ collection: "leads", id: a.id, depth: 0, overrideAccess: false, user: ctx.user }).catch(() => null)) as Lead | null;
      if (!l) throw new OpError(`No lead ${a.id}.`, 404);
      const check = (l.check ?? {}) as Record<string, unknown>;
      return {
        ...leadBrief(l),
        address: l.address,
        socials: l.socials,
        review: l.review,
        notes: l.notes,
        check: { kind: check.kind, findings: check.findings, scores: check.scores, facts: check.facts, site: check.site ? { title: (check.site as { title?: string }).title, description: (check.site as { description?: string }).description } : undefined },
        messages: l.messages,
        follow_ups: l.followUps,
        log: Array.isArray(l.log) ? (l.log as unknown[]).slice(-40) : [],
      };
    },
  }),
  op({
    name: "get_settings",
    scope: "read",
    description: "Keeper's settings and the outreach settings (which providers have keys, never the keys themselves).",
    input: z.object({}),
    run: async (ctx) => {
      const cfg = await loadConfig(ctx.payload);
      const o = await loadOutreach(ctx.payload);
      return {
        keeper: {
          name: cfg.name,
          enabled: cfg.enabled,
          provider: cfg.provider,
          model: cfg.model,
          fast_model: cfg.fastModel || null,
          providers_with_keys: usableProviders(cfg).map((p) => ({ id: p, label: PROVIDERS[p].label })),
          autonomy: cfg.perms.mode,
          deletes: cfg.perms.deletes,
          email: cfg.perms.email,
          web: cfg.perms.web,
          sorts_new_messages: cfg.triage,
          voice: { enabled: cfg.voice.enabled, model: cfg.voice.model },
          limits: { steps_per_task: cfg.maxSteps, tasks_per_day: cfg.dailyRuns, tokens_per_day: cfg.dailyTokens },
        },
        outreach: {
          enabled: o.enabled,
          searches: o.searches,
          new_per_day: o.dailyNew,
          ready_per_day: o.dailyReady,
          offer: o.offer,
          sender_name: o.senderName || null,
          sender_phone: o.senderPhone || null,
          previews: o.previews,
          preview_score: o.previewScore,
          follow_up: o.followUp ? `after ${o.followUpDays} days` : "off",
          gmail: o.gmail || null,
          email_ready: Boolean(o.gmailScriptUrl && o.gmailScriptSecret) || Boolean(o.gmail && o.gmailPassword),
          emails_per_day: o.dailyEmails,
          pagespeed_key_set: Boolean(o.pagespeedKey),
          weekly_post: o.weeklyPost,
        },
      };
    },
  }),
  op({
    name: "list_routines",
    scope: "read",
    description: "Work Keeper does on a schedule: each routine's instruction, schedule, whether it's on, and how its last run went.",
    input: z.object({}),
    run: async (ctx) => {
      const { docs } = await ctx.payload.find({ collection: "agent-routines", limit: 100, depth: 0, overrideAccess: false, user: ctx.user, sort: "name" });
      return {
        routines: docs.map((r) => {
          const x = r as unknown as Record<string, unknown>;
          return { id: x.id, name: x.name, instruction: x.instruction, enabled: x.enabled, schedule: x.schedule, time: x.time, weekday: x.weekday, timezone: x.timezone, autonomy: x.mode, next_run_at: x.nextRunAt, last_run_at: x.lastRunAt, last_result: x.lastStatus, last_conversation: x.lastThread };
        }),
      };
    },
  }),
  op({
    name: "set_routine",
    scope: "control",
    description: "Turn a routine on or off.",
    input: z.object({ id, enabled: bool }),
    run: async (ctx, a) => {
      const r = await ctx.payload.update({ collection: "agent-routines", id: a.id, data: { enabled: a.enabled } as never, overrideAccess: false, user: ctx.user, depth: 0 }).catch(() => null);
      if (!r) throw new OpError(`No routine ${a.id}.`, 404);
      return { ok: true, id: r.id, name: (r as { name?: string }).name, enabled: a.enabled };
    },
  }),
  op({
    name: "set_keeper",
    scope: "control",
    description: "Turn Keeper on or off, or switch its model (to any provider that already has a key in Agent settings). Its autonomy can only be changed in the admin.",
    input: z.object({
      enabled: bool.optional(),
      provider: z.string().max(40).optional().describe("e.g. anthropic, openai, google, deepseek, openrouter"),
      model: z.string().max(120).optional().describe("The model id, e.g. deepseek-v4-flash"),
    }),
    run: async (ctx, a) => {
      const cfg = await loadConfig(ctx.payload);
      const data: Record<string, unknown> = {};
      if (a.enabled !== undefined) data.enabled = a.enabled;
      if (a.provider || a.model) {
        const provider = (a.provider || cfg.provider) as ProviderId;
        if (!PROVIDERS[provider]) throw new OpError(`Unknown provider “${provider}”.`);
        if (!a.model) throw new OpError("Name the model too.");
        if (!usableProviders(cfg).includes(provider)) throw new OpError(`${PROVIDERS[provider].label} has no key in Agent settings → Your providers.`);
        Object.assign(data, { provider, model: a.model.trim() });
      }
      if (!Object.keys(data).length) throw new OpError("Nothing to change.");
      await ctx.payload.updateGlobal({ slug: "agent", data: data as never, overrideAccess: true, depth: 0 });
      const now = await loadConfig(ctx.payload);
      return { ok: true, enabled: now.enabled, provider: now.provider, model: now.model };
    },
  }),
];

export const opNamed = (name: string) => OPS.find((o) => o.name === name);

/** The operations a key may use. */
export const opsFor = (scopes: Scope[]) => OPS.filter((o) => !o.scope || scopes.includes(o.scope));

/** Runs an operation for a caller: checks its permission and arguments, and records the call. */
export async function callOp(ctx: Ctx, name: string, raw: unknown, via: "api" | "mcp"): Promise<{ ok: true; result: unknown } | { ok: false; status: number; error: string }> {
  const o = opNamed(name);
  const log = (ok: boolean, note?: string) => logCall(ctx.payload, { key: ctx.key.id, name: ctx.key.name, ip: ctx.ip, via, what: name, ok, note }).catch(() => undefined);
  if (!o) return { ok: false, status: 404, error: `No such operation: ${name}.` };
  if (o.scope && !ctx.key.scopes.includes(o.scope)) {
    await log(false, `needs ${o.scope}`);
    return { ok: false, status: 403, error: `This key may not ${name.replace(/_/g, " ")}: it needs the “${o.scope}” permission (Agent → Access keys).` };
  }
  const parsed = o.input.safeParse(raw ?? {});
  if (!parsed.success) {
    const error = `Check the arguments: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`;
    await log(false, cut(error, 160));
    return { ok: false, status: 400, error };
  }
  try {
    const result = await o.run(ctx, parsed.data);
    await log(true, name === "ask_keeper" ? cut((parsed.data as { message?: string }).message, 120) : undefined);
    return { ok: true, result };
  } catch (err) {
    const e = err as OpError;
    await log(false, cut(e.message, 160));
    return { ok: false, status: e instanceof OpError ? e.status : 500, error: e.message || "Something went wrong." };
  }
}

