import type { CollectionSlug, GlobalSlug, Payload, TypedUser } from "payload";
import { titleOf } from "./docs";
import { targetsOf } from "./schema";

/*
 * What the agent knows when a conversation starts, the way a manager walks in
 * already knowing the state of things: what's waiting for the owner, what's
 * saved but not live, what's new in the inbox, and what was actually asked and
 * done in recent conversations (so "remember what I told you last time?" gets
 * a true answer, not a guess).
 */

type ThreadRow = {
  id: number;
  title?: string;
  source?: string;
  status?: string;
  updatedAt?: string;
  events?: unknown;
  changes?: unknown;
  pending?: unknown;
};

const cache = new Map<string, { at: number; text: string }>();

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function situation(payload: Payload, user: TypedUser | null, opts: { exclude?: number | string | null; timeZone: string }) {
  const key = `${user?.id ?? "system"}:${opts.exclude ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 20_000) return hit.text;

  const when = (iso?: string) =>
    iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: opts.timeZone }).format(new Date(iso)) : "";
  const lines: string[] = [];

  /* Saved but not live. */
  const drafts: string[] = [];
  for (const t of targetsOf(payload)) {
    if (!t.drafts) continue;
    try {
      if (t.kind === "global") {
        const doc = (await payload.findGlobal({ slug: t.slug as GlobalSlug, draft: true, depth: 0, overrideAccess: true })) as unknown as { _status?: string };
        if (doc?._status === "draft") drafts.push(t.label);
      } else {
        const { docs } = await payload.find({
          collection: t.slug as CollectionSlug,
          draft: true,
          where: { _status: { equals: "draft" } },
          depth: 0,
          limit: 6,
          sort: "-updatedAt",
          overrideAccess: true,
        });
        for (const d of docs) drafts.push(`${titleOf(t, d as unknown as Record<string, unknown>)} (${t.label}, id ${d.id})`);
      }
    } catch {
      // An area that can't be read here: skip it.
    }
  }

  const [inbox, waiting, recent] = await Promise.all([
    payload.count({ collection: "inquiries", where: { status: { equals: "new" } }, overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
    payload
      .find({ collection: "agent-threads", where: { status: { equals: "waiting" } }, depth: 0, limit: 5, sort: "-updatedAt", overrideAccess: true })
      .catch(() => ({ docs: [] })),
    payload
      .find({
        collection: "agent-threads",
        where: {
          and: [
            { updatedAt: { greater_than: new Date(Date.now() - 14 * 86_400_000).toISOString() } },
            ...(opts.exclude ? [{ id: { not_equals: opts.exclude } }] : []),
            ...(user ? [{ or: [{ owner: { equals: user.id } }, { source: { in: ["routine", "inbox"] } }] }] : []),
          ],
        },
        depth: 0,
        limit: 6,
        sort: "-updatedAt",
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] })),
  ]);

  const pendingTitles = (waiting.docs as unknown as ThreadRow[]).flatMap((t) =>
    ((Array.isArray(t.pending) ? t.pending : []) as { title?: string }[]).map((p) => `“${p.title}” (in “${t.title}”)`),
  );
  lines.push(`- Waiting for the owner's approval: ${pendingTitles.length ? pendingTitles.slice(0, 5).join("; ") : "nothing"}.`);
  lines.push(`- Saved as drafts, not live yet: ${drafts.length ? drafts.slice(0, 12).join("; ") : "nothing"}.`);
  lines.push(`- New messages in the inbox: ${inbox.totalDocs}.`);

  const history = (recent.docs as unknown as ThreadRow[]).map((t) => {
    const items = (Array.isArray(t.events) ? t.events : []) as { kind?: string; text?: string }[];
    const asked = items
      .filter((i) => i.kind === "user" && i.text && i.text.length > 12)
      .slice(0, 3)
      .map((i) => `“${clip(String(i.text).replace(/\s+/g, " "), 140)}”`);
    const done = [
      ...new Set(
        ((Array.isArray(t.changes) ? t.changes : []) as { action?: string; title?: string; undone?: boolean }[]).map(
          (c) => `${c.undone ? "undid " : ""}${c.action === "update" ? "changed" : c.action} ${c.title}`,
        ),
      ),
    ].slice(0, 5);
    return `- ${when(t.updatedAt)}, ${t.source === "voice" ? "by voice" : t.source ?? "console"}: ${asked.length ? `asked ${asked.join(", ")}` : `“${t.title}”`}${
      done.length ? ` · did: ${done.join("; ")}` : " · no changes"
    }${t.status === "waiting" ? " · something still waits for approval" : ""}`;
  });

  const text = `${lines.join("\n")}

Recent conversations (newest first). This is what actually happened; if asked about the past and it isn't here or in memory, say you don't know rather than guess:
${history.length ? history.join("\n") : "- None in the last two weeks."}`;
  cache.set(key, { at: Date.now(), text });
  return text;
}
