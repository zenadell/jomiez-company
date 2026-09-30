import config from "@payload-config";
import { generateText } from "ai";
import { after } from "next/server";
import { getPayload, type TypedUser, type Where } from "payload";
import { originOf } from "@/cms/preview";
import type { AgentEvent } from "@/cms/agent/events";
import { listNotices, markNoticesRead } from "@/cms/agent/notify";
import { buildModel, missingSetup } from "@/cms/agent/providers";
import { tickRoutines } from "@/cms/agent/routines";
import { loadConfig, requestStop, runAgent, undoThread, usageToday, type Decision } from "@/cms/agent/run";

/*
 * The agent's endpoints, used by the admin console and drawer. All need a
 * signed-in team member, except `tick`, which a scheduler may also call with
 * Authorization: Bearer $CRON_SECRET.
 *   POST chat      start or continue a conversation (streams its work)
 *   POST approve   answer approval requests (streams the rest of the work)
 *   POST stop      stop a conversation that's working
 *   POST undo      undo a conversation's changes (or one request's)
 *   POST test      check the model connection (admins)
 *   POST seen      mark the notices read
 *   GET  status    on/off, set up, waiting approvals, unread notices
 *   GET  thread    one conversation's transcript
 *   GET  threads   the conversation list
 *   GET  notices   what it did on its own
 *   GET  tick      run due routines
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Params = { params: Promise<{ action: string }> };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

const isAdmin = (user: unknown) => Boolean((user as { roles?: string[] } | null)?.roles?.includes("admin"));

async function session(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  return { payload, user: (user as TypedUser | null) ?? null };
}

/* Cookie-authenticated POSTs must come from the admin itself. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === originOf(req.headers);
}

/* Streams the agent's events as JSON lines, and keeps working if the browser leaves. */
function stream(work: (emit: (e: AgentEvent) => void) => Promise<unknown>) {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  let open = true;
  const emit = (e: AgentEvent) => {
    if (!open) return;
    writer.write(enc.encode(`${JSON.stringify(e)}\n`)).catch(() => {
      open = false;
    });
  };
  const done = work(emit)
    .catch((err) => emit({ t: "error", message: (err as Error).message || "Something went wrong." }))
    .finally(() => {
      open = false;
      writer.close().catch(() => {});
    });
  after(() => done);
  return new Response(readable, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  if (!sameOrigin(req)) return json({ error: "Wrong origin." }, 403);
  const { payload, user } = await session(req);
  if (!user) return json({ error: "Sign in first." }, 401);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = originOf(req.headers);

  switch (action) {
    case "chat": {
      const message = String(body.message ?? "").trim();
      if (!message) return json({ error: "Say what you'd like done." }, 400);
      if (message.length > 20_000) return json({ error: "That message is too long." }, 400);
      const context = body.context && typeof body.context === "object" ? (body.context as { path?: string; title?: string }) : null;
      return stream((emit) =>
        runAgent({
          payload,
          user,
          threadId: (body.threadId as string) || null,
          message,
          context,
          source: context?.path ? "page" : "console",
          origin,
          emit,
        }),
      );
    }
    case "approve": {
      const decisions = (Array.isArray(body.decisions) ? body.decisions : []) as Decision[];
      if (!body.threadId || !decisions.length) return json({ error: "Nothing to answer." }, 400);
      const thread = await payload.findByID({ collection: "agent-threads", id: Number(body.threadId), user, overrideAccess: false }).catch(() => null);
      if (!thread) return json({ error: "Not found." }, 404);
      return stream((emit) => runAgent({ payload, user, threadId: thread.id, decisions, source: "console", origin, emit }));
    }
    case "stop": {
      const thread = await payload.findByID({ collection: "agent-threads", id: Number(body.threadId), user, overrideAccess: false }).catch(() => null);
      if (!thread) return json({ error: "Not found." }, 404);
      await requestStop(payload, thread.id);
      return json({ ok: true });
    }
    case "undo": {
      const thread = await payload.findByID({ collection: "agent-threads", id: Number(body.threadId), user, overrideAccess: false }).catch(() => null);
      if (!thread) return json({ error: "Not found." }, 404);
      return json(await undoThread(payload, user, thread.id, (body.runId as string) || undefined));
    }
    case "test": {
      if (!isAdmin(user)) return json({ ok: false, message: "Admins only." }, 403);
      const cfg = await loadConfig(payload);
      const setup = missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
      if (setup) return json({ ok: false, message: setup });
      try {
        const started = Date.now();
        const { text } = await generateText({
          model: buildModel({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL }),
          prompt: "Reply with exactly one word: ready",
          maxOutputTokens: 20,
        });
        return json({ ok: true, message: `Connected to ${cfg.model} in ${Date.now() - started} ms. It answered: “${text.trim().slice(0, 60)}”` });
      } catch (err) {
        return json({ ok: false, message: (err as Error).message.slice(0, 400) });
      }
    }
    case "seen":
      await markNoticesRead(payload);
      return json({ ok: true });
    case "tick":
      return json(await tickRoutines(payload, origin));
    default:
      return json({ error: "Unknown action." }, 404);
  }
}

export async function GET(req: Request, { params }: Params) {
  const { action } = await params;
  const payload = await getPayload({ config });
  const origin = originOf(req.headers);

  if (action === "tick") {
    const secret = process.env.CRON_SECRET;
    const byCron = Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
    if (!byCron) {
      const { user } = await payload.auth({ headers: req.headers });
      if (!user) return json({ error: "Not allowed." }, 401);
    }
    return json(await tickRoutines(payload, origin));
  }

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return json({ error: "Sign in first." }, 401);
  const admin = isAdmin(user);

  if (action === "status") {
    const cfg = await loadConfig(payload);
    const setup = missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
    const mine: Where = admin ? {} : { owner: { equals: user.id } };
    const [waiting, working, usage, briefing, notices] = await Promise.all([
      payload.count({ collection: "agent-threads", where: { and: [{ status: { equals: "waiting" } }, mine] }, overrideAccess: true }),
      payload.count({ collection: "agent-threads", where: { and: [{ status: { equals: "running" } }, mine] }, overrideAccess: true }),
      usageToday(payload),
      payload.kv.get("agent:briefing"),
      listNotices(payload),
    ]);
    // While someone has the admin open, due routines get their chance to run.
    after(() => tickRoutines(payload, origin).catch(() => {}));
    return json({
      name: cfg.name,
      enabled: cfg.enabled,
      ready: cfg.enabled && !setup,
      setup: admin ? setup : setup ? "The agent isn't set up yet. Ask an admin." : null,
      model: cfg.model,
      provider: cfg.provider,
      mode: cfg.perms.mode,
      waiting: waiting.totalDocs,
      working: working.totalDocs,
      unread: notices.filter((n) => !n.read).length,
      usage,
      limits: { runs: cfg.dailyRuns, tokens: cfg.dailyTokens },
      briefing,
      canConfigure: admin,
    });
  }

  if (action === "notices") return json({ notices: await listNotices(payload) });

  if (action === "thread") {
    const id = new URL(req.url).searchParams.get("id");
    const thread = id
      ? await payload.findByID({ collection: "agent-threads", id: Number(id), user, overrideAccess: false, depth: 0 }).catch(() => null)
      : null;
    if (!thread) return json({ error: "Not found." }, 404);
    const { messages: _model, ...rest } = thread as unknown as Record<string, unknown>;
    void _model;
    return json(rest);
  }

  if (action === "threads") {
    const { docs } = await payload.find({
      collection: "agent-threads",
      user,
      overrideAccess: false,
      sort: "-updatedAt",
      limit: 80,
      depth: 0,
      select: { title: true, status: true, source: true, updatedAt: true, createdAt: true },
    });
    return json({ docs });
  }

  return json({ error: "Unknown action." }, 404);
}
