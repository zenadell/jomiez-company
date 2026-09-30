/*
 * What the agent streams to the admin while it works, and what a conversation
 * keeps as its transcript. Shared by the server and the console (no server imports).
 */

export type ChangeRow = { where: string; before: string; after: string };

export type PlanStep = { title: string; done?: boolean };

export type AgentEvent =
  | { t: "thread"; id: string; title: string }
  | { t: "user"; text: string; at: string }
  | { t: "text"; id: string; delta: string }
  | { t: "reasoning"; id: string; delta: string }
  | { t: "tool"; id: string; name: string; title: string; input: unknown }
  | { t: "tool-result"; id: string; ok: boolean; summary: string }
  | {
      t: "approval";
      approvalId: string;
      toolCallId: string;
      name: string;
      title: string;
      risk: string;
      reason: string;
      changes?: ChangeRow[];
      detail?: string;
    }
  | { t: "decision"; approvalId: string; approved: boolean; note?: string }
  | { t: "plan"; steps: PlanStep[] }
  | { t: "change"; title: string; action: string; admin: string; site: string | null; changes?: ChangeRow[] }
  | { t: "usage"; input: number; output: number }
  | { t: "status"; status: "running" | "waiting" | "idle" | "stopped" | "error" }
  | { t: "notice"; text: string }
  | { t: "error"; message: string };

/** A transcript item, with streamed text already joined up. */
export type TranscriptItem =
  | { kind: "user"; text: string; at: string }
  | { kind: "text"; id: string; text: string }
  | { kind: "reasoning"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; title: string; input: unknown; ok?: boolean; summary?: string; waiting?: boolean }
  | Extract<AgentEvent, { t: "approval" }> & { kind: "approval"; decided?: boolean; approved?: boolean; note?: string }
  | { kind: "change"; title: string; action: string; admin: string; site: string | null; changes?: ChangeRow[] }
  | { kind: "notice"; text: string }
  | { kind: "error"; message: string };

/** Folds a stream of events into transcript items (used live and when reloading a conversation). */
export function fold(items: TranscriptItem[], e: AgentEvent): TranscriptItem[] {
  switch (e.t) {
    case "user":
      return [...items, { kind: "user", text: e.text, at: e.at }];
    case "text":
    case "reasoning": {
      const kind = e.t;
      const last = items[items.length - 1];
      if (last && last.kind === kind && last.id === e.id) {
        return [...items.slice(0, -1), { ...last, text: last.text + e.delta }];
      }
      return [...items, { kind, id: e.id, text: e.delta }];
    }
    case "tool":
      return [...items, { kind: "tool", id: e.id, name: e.name, title: e.title, input: e.input }];
    case "tool-result":
      return items.map((it) => (it.kind === "tool" && it.id === e.id ? { ...it, ok: e.ok, summary: e.summary, waiting: false } : it));
    case "approval":
      return [
        ...items.map((it) => (it.kind === "tool" && it.id === e.toolCallId ? { ...it, waiting: true, summary: "Waiting for your approval" } : it)),
        { ...e, kind: "approval" as const },
      ];
    case "decision": {
      const approval = items.find((it) => it.kind === "approval" && it.approvalId === e.approvalId) as { toolCallId?: string } | undefined;
      return items.map((it) =>
        it.kind === "approval" && it.approvalId === e.approvalId
          ? { ...it, decided: true, approved: e.approved, note: e.note }
          : it.kind === "tool" && it.id === approval?.toolCallId
            ? { ...it, waiting: false, summary: e.approved ? "Approved" : "Declined" }
            : it,
      );
    }
    case "change":
      return [...items, { kind: "change", title: e.title, action: e.action, admin: e.admin, site: e.site, changes: e.changes }];
    case "notice":
      return [...items, { kind: "notice", text: e.text }];
    case "error":
      return [...items, { kind: "error", message: e.message }];
    default:
      return items;
  }
}
