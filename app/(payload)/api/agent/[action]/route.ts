import config from "@payload-config";
import { generateText } from "ai";
import { after } from "next/server";
import { getPayload, type TypedUser, type Where } from "payload";
import { originOf } from "@/cms/preview";
import type { AgentEvent } from "@/cms/agent/events";
import { listNotices, markNoticesRead } from "@/cms/agent/notify";
import { buildModel, listModels, missingSetup, PROVIDERS, type ModelInfo, type ModelPurpose, type ProviderId } from "@/cms/agent/providers";
import { tickRoutines } from "@/cms/agent/routines";
import { connectionFor, loadConfig, requestStop, runAgent, undoThread, usableProviders, usageToday, voiceKey, type Decision } from "@/cms/agent/run";
import { answerVoiceApproval, logVoice, runVoiceCalls, startVoice } from "@/cms/agent/voice";
import { getShot } from "@/cms/agent/eyes";

/*
 * The agent's endpoints, used by the admin console and drawer. All need a
 * signed-in team member, except `tick`, which a scheduler may also call with
 * Authorization: Bearer $CRON_SECRET.
 *   POST chat      start or continue a conversation (streams its work)
 *   POST approve   answer approval requests (streams the rest of the work)
 *   POST stop      stop a conversation that's working
 *   POST undo      undo a conversation's changes (or one request's)
 *   POST test      check the model connection (admins)
 *   POST models    the models a key can use, for the settings screen (admins)
 *   POST seen      mark the notices read
 *   POST voice-session   open a live voice conversation (a single-use Gemini pass)
 *   POST voice-tool      run what the voice model asked to do, under the same rules
 *   POST voice-approve   answer an approval asked for while talking
 *   POST voice-log       keep what was said in the conversation
 *   GET  status    on/off, set up, waiting approvals, unread notices
 *   GET  thread    one conversation's transcript
 *   GET  threads   the conversation list
 *   GET  notices   what it did on its own
 *   GET  shot      a screenshot it took
 *   GET  tick      run due routines (answers at once; they run in the background)
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

/* The IDs closest to what was typed ("DeepSeek V4 Flash" → deepseek-v4-flash). */
function closest(typed: string, models: ModelInfo[]) {
  const norm = (v: string) => v.toLowerCase().replace(/^models\//, "").replace(/[\s_]+/g, "-");
  const want = norm(typed);
  const parts = want.split(/[-./]+/).filter(Boolean);
  return models
    .map((m) => {
      const id = norm(m.id);
      const label = norm(m.label ?? "");
      const score = id === want || label === want ? 100 : parts.filter((p) => id.includes(p) || label.includes(p)).length;
      return { id: m.id, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.id.length - b.id.length)
    .slice(0, 4)
    .map((m) => m.id);
}

async function tryModel(s: { provider: ProviderId; model: string; apiKey: string; baseURL: string | null }) {
  const started = Date.now();
  const { text } = await generateText({ model: buildModel(s), prompt: "Reply with exactly one word: ready", maxOutputTokens: 20 });
  return { ms: Date.now() - started, text: text.trim().slice(0, 60) };
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
      // Approvals asked for while talking are answered here too (e.g. after the call has ended).
      if (decisions.every((d) => String(d.approvalId).startsWith("va_"))) {
        return stream(async (emit) => {
          emit({ t: "thread", id: String(thread.id), title: thread.title ?? "" });
          emit({ t: "status", status: "running" });
          for (const d of decisions) {
            const out = await answerVoiceApproval({ payload, user, origin, threadId: thread.id, approvalId: d.approvalId, approved: d.approved, note: d.note });
            out.events.forEach(emit);
          }
          const after = await payload.findByID({ collection: "agent-threads", id: thread.id, depth: 0, overrideAccess: true });
          emit({ t: "status", status: after.status === "waiting" ? "waiting" : "idle" });
        });
      }
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
      const main = { provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL };
      const setup = missingSetup(main);
      if (setup) return json({ ok: false, message: setup });
      try {
        const r = await tryModel(main);
        let message = `Connected to ${cfg.model} in ${r.ms} ms. It answered: “${r.text}”`;
        if (cfg.fastModel && cfg.fastModel !== cfg.model) {
          try {
            await tryModel({ ...main, model: cfg.fastModel });
            message += ` The quick model ${cfg.fastModel} works too.`;
          } catch (err) {
            return json({ ok: false, message: `${message} But the quick model “${cfg.fastModel}” failed: ${(err as Error).message.slice(0, 200)}` });
          }
        }
        return json({ ok: true, message });
      } catch (err) {
        let message = (err as Error).message.slice(0, 400);
        // A model name the provider doesn't know: say which IDs it does know.
        const models = await listModels(main, "text").catch(() => null);
        if (models?.length && !models.some((m) => m.id === cfg.model.trim())) {
          const near = closest(cfg.model, models);
          message = `“${cfg.model}” isn't a model ID this key can use.${near.length ? ` Closest: ${near.join(", ")}.` : ""} Use “Choose from your account” under the Model box to pick one. (${message.slice(0, 160)})`;
        }
        return json({ ok: false, message });
      }
    }
    case "models": {
      if (!isAdmin(user)) return json({ error: "Admins only." }, 403);
      const cfg = await loadConfig(payload);
      const purpose = (["voice", "vision", "image"].includes(String(body.purpose)) ? body.purpose : "text") as ModelPurpose;
      const onGemini = purpose !== "text";
      const provider = (onGemini ? "google" : String(body.provider || cfg.provider)) as ProviderId;
      if (!PROVIDERS[provider]) return json({ error: "Choose a provider first." }, 400);
      const typedKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
      const typedBase = onGemini || typeof body.baseURL !== "string" ? "" : body.baseURL.trim().replace(/\/$/, "");
      const saved = connectionFor(cfg, provider);
      const savedBase = (saved?.baseURL ?? "").trim().replace(/\/$/, "");
      let apiKey = typedKey;
      if (!apiKey) {
        // A saved key only ever goes to the address it was saved with.
        if (typedBase && typedBase !== savedBase) return json({ error: "Type the key for this address in the key box first (or save the address)." });
        apiKey = onGemini ? voiceKey(cfg) : (saved?.apiKey ?? "");
      }
      try {
        const models = await listModels({ provider, apiKey, baseURL: typedBase || savedBase || null }, purpose);
        models.sort((a, b) => a.id.localeCompare(b.id));
        return json({ models });
      } catch (err) {
        const msg = (err as Error).message;
        return json({ error: /^(401|403)/.test(msg) ? `The provider refused the key (${msg.slice(0, 160)}).` : `Couldn't list the models: ${msg.slice(0, 200)}` });
      }
    }
    case "switch": {
      // Use another model, from any provider in Your providers. Conversations carry on with it.
      if (!isAdmin(user)) return json({ error: "Only admins can change the model." }, 403);
      const cfg = await loadConfig(payload);
      const provider = String(body.provider || "") as ProviderId;
      const model = typeof body.model === "string" ? body.model.trim() : "";
      if (!PROVIDERS[provider] || !model) return json({ error: "Choose a provider and a model." }, 400);
      if (!usableProviders(cfg).includes(provider)) return json({ error: `Add a key for ${PROVIDERS[provider].label} in Agent settings → Your providers first.` }, 400);
      await payload.updateGlobal({ slug: "agent", data: { provider, model } as never, overrideAccess: true, depth: 0 });
      return json({ ok: true, provider, model });
    }
    case "voice-session": {
      try {
        const context = body.context && typeof body.context === "object" ? (body.context as { path?: string; title?: string }) : null;
        const resume = body.resume && typeof body.resume === "object" ? (body.resume as { threadId: number; handle?: string }) : null;
        return json(await startVoice({ payload, user, origin, context, resume }));
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
    case "voice-tool": {
      const calls = Array.isArray(body.calls) ? (body.calls as { id: string; name: string; args?: Record<string, unknown> }[]) : [];
      if (!body.threadId || !calls.length) return json({ error: "Nothing to do." }, 400);
      try {
        return json(await runVoiceCalls({ payload, user, origin, threadId: body.threadId as number, calls: calls.slice(0, 12) }));
      } catch (err) {
        const message = (err as Error).message;
        return json({ error: message, responses: calls.map((c) => ({ id: c.id, name: c.name, response: { error: message } })) }, 400);
      }
    }
    case "voice-approve": {
      if (!body.threadId || !body.approvalId) return json({ error: "Nothing to answer." }, 400);
      try {
        return json(
          await answerVoiceApproval({
            payload,
            user,
            origin,
            threadId: body.threadId as number,
            approvalId: String(body.approvalId),
            approved: body.approved === true,
            note: typeof body.note === "string" ? body.note.slice(0, 1000) : undefined,
          }),
        );
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
    case "voice-log": {
      const lines = Array.isArray(body.lines) ? (body.lines as { who: "you" | "agent"; text: string }[]).slice(0, 50) : [];
      if (!body.threadId) return json({ error: "Nothing to keep." }, 400);
      try {
        return json(await logVoice({ payload, user, threadId: body.threadId as number, lines, tokens: Number(body.tokens) || 0, end: body.end === true }));
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
    case "test-email": {
      if (!isAdmin(user)) return json({ ok: false, message: "Admins only." }, 403);
      const to = (user as { email?: string }).email;
      if (!to) return json({ ok: false, message: "Your account has no email address." });
      if (!process.env.RESEND_API_KEY) return json({ ok: false, message: "Email isn't set up: add RESEND_API_KEY and LEAD_FROM_EMAIL." });
      try {
        await payload.sendEmail({
          to,
          subject: "Test email from the jomiez.com admin",
          text: `This is a test from ${origin}. If you're reading it, the site can send email: contact-form notifications, automatic replies and the agent's reports will arrive.`,
        });
        return json({ ok: true, message: `Sent to ${to}. Check your inbox (and spam).` });
      } catch (err) {
        return json({ ok: false, message: `Resend refused it: ${(err as Error).message.slice(0, 300)}` });
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
    // Answers at once and runs due routines afterwards: a routine can take minutes,
    // longer than a scheduler waits for an answer.
    after(() => tickRoutines(payload, origin).catch((err) => payload.logger.error({ err, msg: "Routine tick" })));
    return json({ ok: true });
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
      // What the model switcher offers (admins only).
      providers: admin ? usableProviders(cfg).map((id) => ({ id, label: PROVIDERS[id].label })) : [],
      mode: cfg.perms.mode,
      waiting: waiting.totalDocs,
      working: working.totalDocs,
      unread: notices.filter((n) => !n.read).length,
      usage,
      limits: { runs: cfg.dailyRuns, tokens: cfg.dailyTokens },
      briefing,
      voice: {
        ready: cfg.enabled && cfg.voice.enabled && Boolean(voiceKey(cfg)),
        setup: !cfg.voice.enabled ? "Voice is switched off (Agent settings → Voice)." : voiceKey(cfg) ? null : "Add a Gemini key in Agent settings → Voice.",
        model: cfg.voice.model,
      },
      canConfigure: admin,
    });
  }

  if (action === "notices") return json({ notices: await listNotices(payload) });

  // A screenshot the agent took, for the conversation (kept briefly, team only).
  if (action === "shot") {
    const shot = getShot(new URL(req.url).searchParams.get("id") ?? "");
    if (!shot) return json({ error: "That screenshot has expired." }, 404);
    return new Response(new Uint8Array(shot.data), { headers: { "content-type": shot.type, "cache-control": "private, max-age=3600" } });
  }

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
