import type { Payload } from "payload";

/*
 * One template preview per lead per request. Left to itself a model keeps
 * finding a reason to start over ("this template isn't quite right") and
 * migrates template after template for one lead: each one costs minutes of
 * Aethron work and model calls, and the previous preview is deleted. So the
 * tool decides, not the model:
 * - a lead whose preview passed already has one: another is made only when the
 *   owner asked for it, in words found in their own latest message;
 * - one request (one owner message, or one routine run) makes at most one
 *   preview per lead, with one more try only after a failure.
 * Anything off on a finished preview is fixed in place (aethron tool, then
 * publish_site_preview), never by changing template.
 */

type Event = { kind?: string; text?: string; at?: string };
type Record_ = { at: string; tries: number; passed: boolean };

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** The owner's latest message in this conversation (empty for a routine with nobody typing). */
export async function latestOwnerMessage(payload: Payload, threadId: string): Promise<{ text: string; at: string }> {
  const thread = (await payload.findByID({ collection: "agent-threads", id: Number(threadId), depth: 0, overrideAccess: true }).catch(() => null)) as { events?: unknown } | null;
  const events = Array.isArray(thread?.events) ? (thread!.events as Event[]) : [];
  const last = [...events].reverse().find((e) => e.kind === "user" && typeof e.text === "string");
  return { text: last?.text ?? "", at: last?.at ?? `thread-${threadId}` };
}

/** Whether these words (at least four of them) are really in the owner's message. */
export function quotes(message: string, words: string | undefined): boolean {
  const q = norm(words ?? "");
  return q.split(" ").filter(Boolean).length >= 4 && norm(message).includes(q);
}

const key = (threadId: string, leadId: number) => `site-preview:${threadId}:${leadId}`;

export type Gate = { ok: true; at: string } | { ok: false; refused: string };

export async function mayMakePreview(
  payload: Payload,
  opts: { threadId: string; leadId: number; site?: { verdict?: string; uploaded?: unknown; template?: { name?: string } } | null; url?: string | null; ownerAsked?: string },
): Promise<Gate> {
  const owner = await latestOwnerMessage(payload, opts.threadId);
  const asked = quotes(owner.text, opts.ownerAsked);
  const done = await payload.kv.get<Record_>(key(opts.threadId, opts.leadId));
  const fixInPlace = "If something on it is off (a picture, a line, the map, a section), fix just that with the aethron tool and publish_site_preview.";
  if (done && done.at === owner.at) {
    if (done.passed)
      return { ok: false, refused: `A preview for this lead was already made for this request and passed. It is finished: don't make another or switch template. ${fixInPlace} Then report to the owner with its link.` };
    if (done.tries >= 2)
      return { ok: false, refused: "Two tries for this lead already failed for this request. Stop and tell the owner exactly what failed (the check's words), instead of trying another template." };
  }
  if (opts.site?.verdict === "pass" && opts.site.uploaded && !asked) {
    const from = opts.site.template?.name ? ` from “${opts.site.template.name}”` : "";
    return {
      ok: false,
      refused: `This lead already has a finished preview${from}${opts.url ? ` at ${opts.url}` : ""}. Don't replace it: making another deletes this one. ${fixInPlace} A different template only when the owner asks for one: then pass their own words (at least four, copied exactly from their latest message) as owner_asked.`,
    };
  }
  return { ok: true, at: owner.at };
}

export async function recordTry(payload: Payload, opts: { threadId: string; leadId: number; at: string; passed: boolean }) {
  const k = key(opts.threadId, opts.leadId);
  const done = await payload.kv.get<Record_>(k);
  const tries = done && done.at === opts.at ? done.tries + 1 : 1;
  await payload.kv.set(k, { at: opts.at, tries, passed: opts.passed });
}
