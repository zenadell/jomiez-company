import type { Payload, TypedUser } from "payload";
import { loadConfig, runAgent } from "./run";
import { nextRunAt } from "./schedule";

/*
 * Routines run on the agent's own clock. On a long-running server (Render,
 * `next start`, development) a timer checks every minute. On serverless hosts,
 * something outside has to call /api/agent/tick with the CRON_SECRET. The admin
 * also gives due routines a chance to run whenever someone has it open. Each
 * tick runs whatever is due, a few at a time, and the owner is told about each
 * run (see notify.ts).
 */

export async function userById(payload: Payload, id: unknown): Promise<TypedUser | null> {
  if (id == null) return null;
  try {
    const key = typeof id === "object" ? (id as { id: number }).id : id;
    const u = await payload.findByID({ collection: "users", id: Number(key), depth: 0, overrideAccess: true });
    return { ...u, collection: "users" } as TypedUser;
  } catch {
    return null;
  }
}

export async function tickRoutines(payload: Payload, origin: string, max = 3): Promise<{ ran: number }> {
  const lock = await payload.kv.get<{ at: number }>("agent:tick");
  if (lock && Date.now() - lock.at < 5 * 60_000) return { ran: 0 };
  await payload.kv.set("agent:tick", { at: Date.now() });
  let ran = 0;
  try {
    const cfg = await loadConfig(payload);
    if (!cfg.enabled) return { ran: 0 };
    const now = new Date();
    const { docs } = await payload.find({
      collection: "agent-routines",
      where: { and: [{ enabled: { equals: true } }, { nextRunAt: { less_than_equal: now.toISOString() } }] },
      sort: "nextRunAt",
      limit: max,
      depth: 0,
      overrideAccess: true,
    });
    for (const r of docs) {
      // Claim it first (next time set), so a second tick can't run it twice.
      await payload.update({
        collection: "agent-routines",
        id: r.id,
        data: { nextRunAt: nextRunAt(r, now).toISOString(), lastRunAt: now.toISOString(), lastStatus: "Working…" } as never,
        context: { keepSchedule: true },
        overrideAccess: true,
      });
      // A routine acts with the permissions of the person who set it up.
      const owner = await userById(payload, r.owner);
      let status = "error";
      let threadId: number | null = null;
      if (owner) {
        try {
          const res = await runAgent({
            payload,
            user: owner,
            message: r.instruction,
            source: "routine",
            routine: { id: r.id, name: r.name, mode: r.mode },
            origin,
          });
          status = res.status;
          threadId = res.threadId;
        } catch (err) {
          payload.logger.error({ err, msg: `Routine "${r.name}" failed` });
        }
      }
      const label =
        { idle: "Done", waiting: "Waiting for approval", stopped: "Stopped", error: owner ? "Error" : "Its owner no longer exists" }[status] ?? status;
      await payload.update({
        collection: "agent-routines",
        id: r.id,
        data: { lastStatus: label, ...(threadId ? { lastThread: threadId } : {}) } as never,
        context: { keepSchedule: true },
        overrideAccess: true,
      });
      ran++;
    }
  } finally {
    await payload.kv.delete("agent:tick");
  }
  return { ran };
}

/** Starts the minute timer on long-running servers. Serverless hosts (Vercel) rely on cron instead. */
export function startClock(payload: Payload) {
  if (process.env.VERCEL || process.env.NEXT_PHASE === "phase-production-build" || process.env.AGENT_CLOCK === "off") return;
  const g = globalThis as { __jomiezAgentClock?: ReturnType<typeof setInterval> };
  if (g.__jomiezAgentClock) return;
  const origin =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
  g.__jomiezAgentClock = setInterval(() => {
    tickRoutines(payload, origin).catch((err) => payload.logger.error({ err, msg: "Routine clock" }));
  }, 60_000);
  g.__jomiezAgentClock.unref?.();
}
