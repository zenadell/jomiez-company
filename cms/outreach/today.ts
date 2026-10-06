import type { Payload, PayloadRequest } from "payload";
import { loadConfig, sightOf } from "../agent/run";
import { checkLead } from "./check";
import { findLeads, type Search } from "./find";
import { loadOutreach } from "./settings";
import { makePreview, writeLead, writerModel } from "./write";

/*
 * A morning's work: find a few new businesses (areas take turns), check their
 * websites, and write messages for the most promising, plus the one follow-up
 * for anyone who hasn't replied. It stops in time (about four minutes) and
 * carries on the next day; nothing is sent.
 */

export type Today = { found: number; checked: number; written: number; followUps: number; previews: number; waiting: number; notes: string[] };

const SKIP_BELOW = 25;

async function count(payload: Payload, status: string) {
  return (await payload.count({ collection: "leads", where: { status: { equals: status } }, overrideAccess: true })).totalDocs;
}

/** Runs `work` on each item, a few at a time, until the time is up. */
async function each<T>(items: T[], at: number, until: number, work: (item: T) => Promise<void>) {
  let next = 0;
  const lane = async () => {
    while (next < items.length && Date.now() < until) await work(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(at, items.length) }, lane));
}

export async function outreachToday(
  payload: Payload,
  opts: { origin: string; search?: Search; newLeads?: number; messages?: number; budgetMs?: number; progress?: (text: string) => void } = { origin: "" },
): Promise<Today> {
  const lock = await payload.kv.get<{ at: number }>("outreach:lock");
  if (lock && Date.now() - lock.at < 8 * 60_000) throw new Error("Already working on today's clients: wait a few minutes.");
  await payload.kv.set("outreach:lock", { at: Date.now() });
  const until = Date.now() + (opts.budgetMs ?? 270_000);
  const out: Today = { found: 0, checked: 0, written: 0, followUps: 0, previews: 0, waiting: 0, notes: [] };
  const say = (t: string) => opts.progress?.(t);
  try {
    const s = await loadOutreach(payload);
    const cfg = await loadConfig(payload);
    const wantNew = opts.newLeads ?? s.dailyNew;
    const wantMessages = opts.messages ?? s.dailyReady;

    /* ----- Find ----- */
    const unchecked = await count(payload, "new");
    let need = Math.max(0, wantNew - unchecked);
    const searches = opts.search ? [opts.search] : s.searches.filter((x) => x.on && x.kinds.length);
    if (!searches.length && need) out.notes.push("No areas are switched on in Clients → Finding clients, so no new businesses were looked for.");
    const start = opts.search ? 0 : ((await payload.kv.get<number>("outreach:next-search")) ?? 0) % Math.max(1, searches.length);
    for (let i = 0; i < searches.length && need > 0 && Date.now() < until; i++) {
      const search = searches[(start + i) % searches.length];
      say(`Looking for businesses in ${search.area}…`);
      try {
        const res = await findLeads(payload, search, need);
        out.found += res.added.length;
        need -= res.added.length;
        out.notes.push(...res.notes.map((n) => `${search.area}: ${n}`));
        if (!res.added.length) out.notes.push(`${search.area}: every business the map lists for those kinds is already in your leads (${res.seen} seen). Add kinds or another area.`);
      } catch (err) {
        out.notes.push(`${search.area}: ${(err as Error).message}`);
      }
      if (!opts.search) await payload.kv.set("outreach:next-search", (start + i + 1) % searches.length);
    }

    /* ----- Check ----- */
    const { docs: toCheck } = await payload.find({ collection: "leads", where: { status: { equals: "new" } }, sort: "createdAt", limit: wantNew, depth: 0, overrideAccess: true, select: { name: true } });
    const sight = sightOf(cfg);
    let pagespeedTrouble = "";
    await each(toCheck, 3, until - 60_000, async (lead) => {
      say(`Checking ${(lead as { name?: string }).name}'s website…`);
      try {
        const r = await checkLead(payload, lead.id, { sight, pagespeedKey: s.pagespeedKey, ownOrigin: opts.origin });
        out.checked++;
        if (r.pagespeed !== "used" && r.pagespeed !== "not used") pagespeedTrouble = r.pagespeed;
        if (r.score < SKIP_BELOW) {
          await payload.update({ collection: "leads", id: lead.id, data: { status: "skipped" } as never, overrideAccess: true });
        }
      } catch (err) {
        out.notes.push(`Couldn't check ${(lead as { name?: string }).name}: ${(err as Error).message}`);
      }
    });
    if (!s.pagespeedKey) out.notes.push("Without a PageSpeed key the checks are simpler (no speed scores). A free key goes in Clients → Finding clients → Website checks.");
    else if (pagespeedTrouble) out.notes.push(pagespeedTrouble);

    /* ----- Write ----- */
    const waiting = await count(payload, "ready");
    let room = Math.max(0, Math.min(wantMessages, wantMessages * 2 - waiting));
    if (!room) out.notes.push(`${waiting} messages are already waiting for you, so no new ones were written. Send or skip some in the app.`);
    const model = room ? await writerModel(payload) : null;
    if (model && s.followUp) {
      const before = new Date(Date.now() - s.followUpDays * 86_400_000).toISOString();
      const { docs: quiet } = await payload.find({
        collection: "leads",
        where: { and: [{ status: { equals: "contacted" } }, { contactedAt: { less_than: before } }, { followUps: { less_than: 1 } }] },
        sort: "contactedAt",
        limit: room,
        depth: 0,
        overrideAccess: true,
        select: { name: true },
      });
      await each(quiet, 2, until, async (lead) => {
        say(`Writing a follow-up to ${(lead as { name?: string }).name}…`);
        try {
          await writeLead(payload, lead.id, { model, settings: s, followUp: true });
          out.followUps++;
          room--;
        } catch (err) {
          out.notes.push(`Couldn't write to ${(lead as { name?: string }).name}: ${(err as Error).message}`);
        }
      });
    }
    if (model && room > 0) {
      const { docs: best } = await payload.find({
        collection: "leads",
        where: { and: [{ status: { equals: "checked" } }, { score: { greater_than_equal: SKIP_BELOW } }] },
        sort: "-score",
        limit: room,
        depth: 0,
        overrideAccess: true,
        select: { name: true, score: true, preview: true },
      });
      await each(best, 2, until, async (lead) => {
        const l = lead as unknown as { id: number; name: string; score?: number; preview?: { slug?: string } };
        say(`Writing to ${l.name}…`);
        try {
          let previewUrl: string | null = null;
          if (s.previews && (l.score ?? 0) >= s.previewScore && !l.preview?.slug) {
            previewUrl = (await makePreview(payload, l.id, { model }).catch((err) => {
              out.notes.push(`No preview for ${l.name}: ${(err as Error).message}`);
              return null;
            }))?.url ?? null;
            if (previewUrl) out.previews++;
          }
          await writeLead(payload, l.id, { model, settings: s, previewUrl });
          out.written++;
        } catch (err) {
          out.notes.push(`Couldn't write to ${l.name}: ${(err as Error).message}`);
        }
      });
    }
    out.waiting = await count(payload, "ready");
    if (Date.now() >= until) out.notes.push("Stopped for time; the rest carries on next run.");
    await payload.kv.set("outreach:last", { at: new Date().toISOString(), ...out });
    return out;
  } finally {
    await payload.kv.delete("outreach:lock");
  }
}

/* ---------- The routines these settings keep in step ---------- */

const FIND = {
  name: "Find new clients",
  instruction:
    "Find new clients for Jomiez. Call the outreach_today tool: it finds new businesses in the areas set in Clients → Finding clients, checks their websites and writes messages for the most promising ones. Then tell me in two or three plain sentences how many messages are waiting for me to send, and anything worth knowing (an area that has run out of new businesses, a missing key). Don't send anything yourself.",
  schedule: "daily",
  time: "07:45",
};

const POST = {
  name: "Weekly journal post",
  instruction:
    "Write this week's journal post, to help Jomiez get found on Google. First list the journal posts so the topic is new. Pick one question small business owners really search for when they need a website or more customers online (in Lagos or elsewhere in Nigeria, or the UK and US), and write a practical, honest post in the site's voice: 800–1,200 words, clear headings, no made-up facts, numbers or quotes, with a search title and description. Save it as a draft (don't publish it), then tell me its title and why you chose it.",
  schedule: "weekly",
  time: "08:45",
  weekday: "1",
};

export async function syncRoutines(payload: Payload, doc: Record<string, unknown>, userId: number | string | null, req?: PayloadRequest) {
  const ids: Record<string, number | null> = {};
  for (const [field, on, def] of [
    ["findRoutine", doc.enabled === true, FIND],
    ["postRoutine", doc.weeklyPost === true, POST],
  ] as const) {
    const ref = doc[field];
    const id = ref && typeof ref === "object" ? (ref as { id: number }).id : (ref as number | null | undefined);
    const existing = id ? await payload.findByID({ collection: "agent-routines", id, depth: 0, overrideAccess: true, req }).catch(() => null) : null;
    if (existing) {
      if (Boolean(existing.enabled) !== on) await payload.update({ collection: "agent-routines", id: existing.id, data: { enabled: on } as never, overrideAccess: true, req });
      ids[field] = existing.id as number;
    } else if (on) {
      const made = await payload.create({
        collection: "agent-routines",
        data: { ...def, enabled: true, timezone: "Africa/Lagos", mode: "drafts", ...(userId ? { owner: userId } : {}) } as never,
        overrideAccess: true,
        req,
      });
      ids[field] = made.id as number;
    } else ids[field] = null;
  }
  const same = (a: unknown, b: number | null) => (a && typeof a === "object" ? (a as { id: number }).id : (a ?? null)) === b;
  if (!same(doc.findRoutine, ids.findRoutine) || !same(doc.postRoutine, ids.postRoutine)) {
    await payload.updateGlobal({ slug: "outreach", data: { findRoutine: ids.findRoutine, postRoutine: ids.postRoutine } as never, overrideAccess: true, context: { syncingRoutines: true }, req });
  }
}
