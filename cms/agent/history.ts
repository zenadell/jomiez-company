import type { ModelMessage } from "ai";

/*
 * A conversation's history, made whole before it goes back to the model.
 * A run that is stopped, interrupted (a deploy, a crash) or cut short can leave
 * a tool call with no answer, and every provider then refuses the whole
 * conversation ("Tool result is missing for tool call …") until it's repaired:
 * the conversation goes dead. Each unanswered call gets an answer saying it
 * didn't finish, and an answer to a call that isn't there is dropped.
 */

type Part = { type: string; toolCallId?: string; toolName?: string; approvalId?: string; providerExecuted?: boolean };

export const UNFINISHED = "This step didn't finish: the run was stopped or interrupted before it returned. Don't assume it worked; check before relying on it.";

export function repairHistory(messages: ModelMessage[]): { messages: ModelMessage[]; repaired: number } {
  const partsOf = (m: ModelMessage) => (typeof m.content === "string" ? [] : (m.content as Part[]));
  const answered = new Set<string>();
  const approvalCall = new Map<string, string>();
  for (const m of messages)
    for (const p of partsOf(m)) {
      if (p.type === "tool-result" && p.toolCallId) answered.add(p.toolCallId);
      if (p.type === "tool-approval-request" && p.approvalId && p.toolCallId) approvalCall.set(p.approvalId, p.toolCallId);
    }
  // A call the owner answered (approved or declined) is settled by the model's own library.
  for (const m of messages)
    for (const p of partsOf(m))
      if (p.type === "tool-approval-response" && p.approvalId && approvalCall.has(p.approvalId)) answered.add(approvalCall.get(p.approvalId)!);

  const out: ModelMessage[] = [];
  const called = new Set<string>();
  let repaired = 0;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === "tool" && typeof m.content !== "string") {
      // An answer to a call that isn't in the history is refused too.
      const kept = (m.content as Part[]).filter((p) => p.type !== "tool-result" || (p.toolCallId && called.has(p.toolCallId)));
      repaired += (m.content as Part[]).length - kept.length;
      if (kept.length) out.push({ ...m, content: kept } as ModelMessage);
      continue;
    }
    out.push(m);
    if (m.role !== "assistant") continue;
    const calls = partsOf(m).filter((p) => p.type === "tool-call" && p.toolCallId);
    for (const c of calls) called.add(c.toolCallId!);
    const missing = calls.filter((c) => !c.providerExecuted && !answered.has(c.toolCallId!));
    if (!missing.length) continue;
    repaired += missing.length;
    const results = missing.map((c) => ({ type: "tool-result" as const, toolCallId: c.toolCallId!, toolName: c.toolName ?? "tool", output: { type: "error-text" as const, value: UNFINISHED } }));
    for (const c of missing) answered.add(c.toolCallId!);
    const next = messages[i + 1];
    if (next?.role === "tool" && typeof next.content !== "string") {
      // The answers that did arrive come first; ours join them in the same message.
      messages = [...messages.slice(0, i + 1), { ...next, content: [...(next.content as Part[]), ...results] } as ModelMessage, ...messages.slice(i + 2)];
    } else out.push({ role: "tool", content: results } as ModelMessage);
  }
  return { messages: out, repaired };
}
