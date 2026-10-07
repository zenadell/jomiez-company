import { randomBytes } from "node:crypto";

/*
 * Keeper's calls to Aethron when Aethron runs on the owner's Mac (Mode A in
 * the Aethron handoff). The Mac can't be reached from the internet, so the
 * Aethron runner (scripts/aethron-runner.mjs) reaches out instead: it asks
 * this site for work over HTTPS (/api/v1/runner/…, with an access key that
 * has only the "runner" permission), runs each call against the Aethron app,
 * and sends the answer back.
 *
 * The queue lives in this server's memory: calls are short-lived, Keeper waits
 * for each answer, and there is one server. A restart drops calls in flight;
 * Keeper is told and can try again.
 */

export type JobInput =
  | { type: "mcp"; tool: string; args: Record<string, unknown> }
  /** Upload an exported preview's files (the runner reads them from the Mac). */
  | { type: "upload"; project: string; slug: string };

export type Job = JobInput & { id: string };

type Waiting = { job: Job; at: number; done: (r: { ok: boolean; result: unknown }) => void; taken?: number };

type Runner = { at: number; name: string; version?: string; aethron?: string; tools?: { name: string; description?: string; inputSchema?: unknown }[]; ip?: string };

type State = { queue: Waiting[]; inflight: Map<string, Waiting>; pollers: (() => void)[]; runner: Runner | null };

const state: State = ((globalThis as { __jomiezAethronRelay?: State }).__jomiezAethronRelay ??= { queue: [], inflight: new Map(), pollers: [], runner: null });

/** A runner counts as connected while it has asked for work in the last minute. */
const ONLINE_MS = 60_000;

export function runnerStatus() {
  const r = state.runner;
  return r && Date.now() - r.at < ONLINE_MS ? { connected: true as const, ...r } : { connected: false as const, lastSeen: r?.at ?? null };
}

/** The runner says hello (its versions and Aethron's tools) or simply checks in. */
export function runnerSeen(info: Partial<Runner> & { name: string }) {
  const given = Object.fromEntries(Object.entries(info).filter(([, v]) => v !== undefined));
  state.runner = { ...(state.runner ?? {}), ...given, at: Date.now() } as Runner;
}

/** Sends one job to the runner and waits for its answer. */
export function relay(job: JobInput, timeoutMs: number): Promise<{ ok: boolean; result: unknown }> {
  if (!runnerStatus().connected) {
    return Promise.resolve({
      ok: false,
      result:
        "The Aethron runner isn't connected, so templates can't be used right now. On the Mac with Aethron, start it with: node scripts/aethron-runner.mjs (see ADMIN.md → Previews from templates).",
    });
  }
  return new Promise((resolve) => {
    const full = { ...job, id: `j${Date.now().toString(36)}${randomBytes(4).toString("hex")}` } as Job;
    const w: Waiting = {
      job: full,
      at: Date.now(),
      done: (r) => {
        clearTimeout(timer);
        state.inflight.delete(full.id);
        state.queue = state.queue.filter((q) => q !== w);
        resolve(r);
      },
    };
    const timer = setTimeout(() => w.done({ ok: false, result: `Aethron didn't answer within ${Math.round(timeoutMs / 1000)} seconds. The runner may have lost its connection; check it's still running on the Mac.` }), timeoutMs);
    state.queue.push(w);
    // Wake one runner waiting for work.
    state.pollers.shift()?.();
  });
}

/** The runner asks for the next job, waiting up to `waitMs` for one to arrive. */
export async function nextJob(waitMs: number): Promise<Job | null> {
  const take = () => {
    const w = state.queue.shift();
    if (!w) return null;
    w.taken = Date.now();
    state.inflight.set(w.job.id, w);
    return w.job;
  };
  const now = take();
  if (now) return now;
  await new Promise<void>((resolve) => {
    const wake = () => {
      clearTimeout(t);
      resolve();
    };
    const t = setTimeout(() => {
      state.pollers = state.pollers.filter((p) => p !== wake);
      resolve();
    }, waitMs);
    state.pollers.push(wake);
  });
  return take();
}

/** The runner's answer to a job. */
export function finishJob(id: string, ok: boolean, result: unknown) {
  const w = state.inflight.get(id);
  if (!w) return false;
  w.done({ ok, result });
  return true;
}
