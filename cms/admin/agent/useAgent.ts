"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fold, type AgentEvent, type PlanStep, type TranscriptItem } from "@/cms/agent/events";

/*
 * The admin's side of the agent: its status (polled), and one conversation at
 * a time: loading it, sending requests and approval answers, and following the
 * streamed work as it happens.
 */

export type AgentStatus = {
  name: string;
  enabled: boolean;
  ready: boolean;
  setup: string | null;
  model: string;
  provider: string;
  mode: string;
  waiting: number;
  working: number;
  unread: number;
  usage: { runs: number; tokens: number };
  limits: { runs: number; tokens: number };
  briefing: { title: string; body: string; at: string; thread?: string } | null;
  canConfigure: boolean;
};

export type ThreadState = "idle" | "running" | "waiting" | "stopped" | "error";

export type Change = { action: string; title: string; target: string; id: string | number | null; undone?: boolean; runId: string };

export function useAgentStatus(pollMs = 30_000) {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status", { credentials: "include", cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      // Offline for a moment: keep the last status.
    }
  }, []);
  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, pollMs);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("jomiez-agent-changed", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("jomiez-agent-changed", onFocus);
    };
  }, [refresh, pollMs]);
  return { status, refresh };
}

type Pending = { approvalId: string; name: string; title: string };

export function useThread(opts: { onChange?: (e: Extract<AgentEvent, { t: "change" }>) => void; onDone?: (state: ThreadState) => void } = {}) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [state, setState] = useState<ThreadState>("idle");
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [usage, setUsage] = useState({ input: 0, output: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlers = useRef(opts);
  useEffect(() => {
    handlers.current = opts;
  });
  const idRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    idRef.current = null;
    setThreadId(null);
    setTitle("");
    setItems([]);
    setState("idle");
    setPlan([]);
    setPending([]);
    setChanges([]);
    setUsage({ input: 0, output: 0 });
    setError(null);
  }, []);

  const load = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`/api/agent/thread?id=${encodeURIComponent(id)}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      setError("That conversation couldn't be opened.");
      return;
    }
    const t = await res.json();
    idRef.current = String(t.id);
    setThreadId(String(t.id));
    setTitle(t.title ?? "");
    setItems(Array.isArray(t.events) ? t.events : []);
    setState((t.status as ThreadState) ?? "idle");
    setPlan(Array.isArray(t.plan) ? t.plan : []);
    setPending(Array.isArray(t.pending) ? t.pending : []);
    setChanges(Array.isArray(t.changes) ? t.changes : []);
    setUsage({ input: t.usage?.input ?? 0, output: t.usage?.output ?? 0 });
  }, []);

  /* Posts to the agent and follows the streamed events until the work pauses or ends. */
  const run = useCallback(
    async (action: "chat" | "approve", body: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      setState("running");
      let final: ThreadState = "idle";
      try {
        const res = await fetch(`/api/agent/${action}`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, threadId: idRef.current }),
        });
        if (!res.ok || !res.body) {
          const msg = await res.json().catch(() => ({ error: `The agent didn't answer (${res.status}).` }));
          throw new Error(msg.error || "The agent didn't answer.");
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let e: AgentEvent;
            try {
              e = JSON.parse(line);
            } catch {
              continue;
            }
            if (e.t === "thread") {
              idRef.current = e.id;
              setThreadId(e.id);
              setTitle(e.title);
            } else if (e.t === "status") {
              final = e.status;
              setState(e.status);
            } else if (e.t === "plan") setPlan(e.steps);
            else if (e.t === "usage") setUsage({ input: e.input, output: e.output });
            else if (e.t === "approval") setPending((p) => [...p, { approvalId: e.approvalId, name: e.name, title: e.title }]);
            else if (e.t === "decision") setPending((p) => p.filter((x) => x.approvalId !== e.approvalId));
            else if (e.t === "change") handlers.current.onChange?.(e);
            setItems((prev) => fold(prev, e));
          }
        }
      } catch (err) {
        final = "error";
        setState("error");
        setError((err as Error).message);
      } finally {
        setBusy(false);
        if (idRef.current) {
          // The saved record has the full picture (changes for undo, final status).
          await load(idRef.current).catch(() => {});
        }
        window.dispatchEvent(new Event("jomiez-agent-changed"));
        handlers.current.onDone?.(final);
      }
    },
    [load],
  );

  const send = useCallback((message: string, context?: { path?: string; title?: string } | null) => run("chat", { message, context }), [run]);

  const answer = useCallback(
    (decisions: { approvalId: string; approved: boolean; note?: string }[]) => run("approve", { decisions }),
    [run],
  );

  const stop = useCallback(async () => {
    if (!idRef.current) return;
    await fetch("/api/agent/stop", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId: idRef.current }),
    });
  }, []);

  const undo = useCallback(async () => {
    if (!idRef.current) return null;
    const res = await fetch("/api/agent/undo", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId: idRef.current }),
    });
    const out = await res.json().catch(() => ({ results: ["Couldn't undo."] }));
    await load(idRef.current);
    window.dispatchEvent(new Event("jomiez-agent-changed"));
    return out.results as string[];
  }, [load]);

  return { threadId, title, items, state, plan, pending, changes, usage, busy, error, send, answer, stop, undo, load, reset };
}

export type ThreadApi = ReturnType<typeof useThread>;
