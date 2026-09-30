import type { CollectionSlug, GlobalSlug, Payload, TypedUser } from "payload";
import { diff, type Change } from "./diff";
import { fromModel, getAt, parsePath, setAt, type Target } from "./schema";

/*
 * How the agent reads and changes documents: always on top of the latest draft
 * (so it never throws away someone's unpublished work), always as the person it
 * works for (their permissions, not more), and always with a snapshot of the
 * document before the change, so any change can be undone.
 */

export type Actor = { payload: Payload; user: TypedUser | null; system?: boolean };

export type Recorded = {
  action: "update" | "create" | "delete" | "publish" | "unpublish" | "restore";
  target: string;
  kind: Target["kind"];
  id: string | number | null;
  title: string;
  /** The newest version before the change (the draft, if there was one). */
  before: Record<string, unknown> | null;
  /** What visitors saw before the change (null: it wasn't live). Only for areas with drafts. */
  beforeLive?: Record<string, unknown> | null;
  at: string;
  runId: string;
  undone?: boolean;
};

type Doc = Record<string, unknown> & { id?: string | number; _status?: string | null };

const access = (a: Actor) => (a.system ? { overrideAccess: true } : { user: a.user ?? undefined, overrideAccess: false });

/** Fields Payload manages itself, never written back. */
const MANAGED = ["id", "createdAt", "updatedAt", "globalType", "_status", "_order"];
const MANAGED_MEDIA = ["url", "thumbnailURL", "filename", "mimeType", "filesize", "width", "height", "sizes", "focalX", "focalY", "prefix"];

function writable(t: Target, doc: Doc): Doc {
  const copy: Doc = { ...doc };
  for (const k of MANAGED) delete copy[k];
  if (t.slug === "media") for (const k of MANAGED_MEDIA) delete copy[k];
  return copy;
}

export function titleOf(t: Target, doc: Doc | null | undefined): string {
  if (t.kind === "global") return t.label;
  if (!doc) return t.label;
  const v = doc[t.titleField] ?? doc.title ?? doc.name ?? doc.slug ?? doc.from ?? doc.filename;
  return typeof v === "string" && v ? v : `${t.label} #${doc.id}`;
}

export async function resolveId(a: Actor, t: Target, ref: unknown): Promise<string | number> {
  if (t.kind === "global") throw new Error("Globals have no id.");
  if (typeof ref === "number" || (typeof ref === "string" && /^\d+$/.test(ref))) return Number(ref);
  if (typeof ref === "string" && ref.trim()) {
    const hasSlug = t.fields.some((f) => "name" in f && f.name === "slug");
    if (hasSlug) {
      const { docs } = await a.payload.find({
        collection: t.slug as CollectionSlug,
        where: { slug: { equals: ref.trim().replace(/^\/+/, "").split("/").pop() } },
        draft: t.drafts,
        depth: 0,
        limit: 1,
        ...access(a),
      });
      if (docs[0]) return docs[0].id as number;
    }
    throw new Error(`No ${t.label} found for "${ref}". Use list to find its id.`);
  }
  throw new Error(`Which ${t.label}? Give an id${t.fields.some((f) => "name" in f && f.name === "slug") ? " or its address (slug)" : ""}.`);
}

/** The newest version: the draft if there is one, else what's live. */
export async function readLatest(a: Actor, t: Target, id?: string | number | null): Promise<Doc> {
  if (t.kind === "global") {
    return (await a.payload.findGlobal({ slug: t.slug as GlobalSlug, draft: t.drafts, depth: 0, ...access(a) })) as unknown as Doc;
  }
  return (await a.payload.findByID({ collection: t.slug as CollectionSlug, id: id!, draft: t.drafts, depth: 0, ...access(a) })) as unknown as Doc;
}

/** What visitors see right now (null if never published). */
export async function readPublished(a: Actor, t: Target, id?: string | number | null): Promise<Doc | null> {
  try {
    if (t.kind === "global") {
      const doc = (await a.payload.findGlobal({ slug: t.slug as GlobalSlug, draft: false, depth: 0, ...access(a) })) as unknown as Doc;
      return t.drafts && doc._status !== "published" ? null : doc;
    }
    const doc = (await a.payload.findByID({ collection: t.slug as CollectionSlug, id: id!, draft: false, depth: 0, ...access(a) })) as unknown as Doc;
    return t.drafts && doc._status !== "published" ? null : doc;
  } catch {
    return null;
  }
}

/* ---------- Edits ---------- */

export type Edits = {
  set?: Record<string, unknown>;
  insert?: { path: string; index?: number; value: unknown }[];
  remove?: { path: string; index: number }[];
  move?: { path: string; from: number; to: number }[];
};

/** Applies edits to a copy of `doc`. Paths are dotted ("hero.titleMain", "layout.2.title"). */
export function applyEdits(doc: Doc, e: Edits): Doc {
  const next = structuredClone(doc);
  for (const [path, value] of Object.entries(e.set ?? {})) setAt(next, parsePath(path), value);
  for (const op of e.remove ?? []) {
    const list = getAt(next, parsePath(op.path));
    if (!Array.isArray(list)) throw new Error(`"${op.path}" is not a list.`);
    if (op.index < 0 || op.index >= list.length) throw new Error(`"${op.path}" has no item ${op.index}.`);
    list.splice(op.index, 1);
  }
  for (const op of e.insert ?? []) {
    const p = parsePath(op.path);
    let list = getAt(next, p);
    if (list == null) {
      setAt(next, p, []);
      list = getAt(next, p);
    }
    if (!Array.isArray(list)) throw new Error(`"${op.path}" is not a list.`);
    const at = op.index == null ? list.length : Math.max(0, Math.min(op.index, list.length));
    list.splice(at, 0, op.value);
  }
  for (const op of e.move ?? []) {
    const list = getAt(next, parsePath(op.path));
    if (!Array.isArray(list)) throw new Error(`"${op.path}" is not a list.`);
    const [item] = list.splice(op.from, 1);
    list.splice(Math.max(0, Math.min(op.to, list.length)), 0, item);
  }
  return next;
}

/* ---------- Writing ---------- */

export class Engine {
  constructor(
    readonly actor: Actor,
    private readonly record: (r: Omit<Recorded, "at" | "runId">) => void,
  ) {}

  private get payload() {
    return this.actor.payload;
  }

  /** Saves a whole document as a draft (or live, when `publish` or the target has no drafts). */
  async save(t: Target, id: string | number | null, data: Doc, publish: boolean): Promise<Doc> {
    const clean = await fromModel(this.payload, t.fields, writable(t, data));
    const status = t.drafts ? { _status: publish ? "published" : "draft" } : {};
    const draft = t.drafts && !publish;
    const context = { agent: true };
    if (t.kind === "global") {
      return (await this.payload.updateGlobal({
        slug: t.slug as GlobalSlug,
        data: { ...clean, ...status } as never,
        draft,
        depth: 0,
        context,
        ...access(this.actor),
      })) as unknown as Doc;
    }
    return (await this.payload.update({
      collection: t.slug as CollectionSlug,
      id: id!,
      data: { ...clean, ...status } as never,
      draft,
      depth: 0,
      context,
      ...access(this.actor),
    })) as unknown as Doc;
  }

  /** What visitors see now, for undo (areas with drafts only). */
  private async live(t: Target, id: string | number | null) {
    return t.drafts ? await readPublished(this.actor, t, id) : undefined;
  }

  async update(t: Target, id: string | number | null, edits: Edits, publish: boolean) {
    const [before, beforeLive] = await Promise.all([readLatest(this.actor, t, id), this.live(t, id)]);
    const after = applyEdits(before, edits);
    const changes = diff(t.fields, before, after);
    const saved = await this.save(t, id, after, publish);
    this.record({ action: publish ? "publish" : "update", target: t.slug, kind: t.kind, id, title: titleOf(t, saved), before, beforeLive });
    return { saved, changes };
  }

  /** Shows what an update would change, without saving (for approval cards). */
  async previewUpdate(t: Target, id: string | number | null, edits: Edits): Promise<Change[]> {
    const before = await readLatest(this.actor, t, id);
    return diff(t.fields, before, applyEdits(before, edits));
  }

  async previewPublish(t: Target, id: string | number | null): Promise<Change[]> {
    const [draft, live] = await Promise.all([readLatest(this.actor, t, id), readPublished(this.actor, t, id)]);
    return diff(t.fields, live ?? {}, draft);
  }

  async publish(t: Target, id: string | number | null) {
    const changes = await this.previewPublish(t, id);
    const [draft, beforeLive] = await Promise.all([readLatest(this.actor, t, id), this.live(t, id)]);
    const saved = await this.save(t, id, draft, true);
    this.record({ action: "publish", target: t.slug, kind: t.kind, id, title: titleOf(t, saved), before: draft, beforeLive });
    return { saved, changes };
  }

  async unpublish(t: Target, id: string | number) {
    const [before, beforeLive] = await Promise.all([readLatest(this.actor, t, id), this.live(t, id)]);
    const saved = (await this.payload.update({
      collection: t.slug as CollectionSlug,
      id,
      data: { _status: "draft" } as never,
      depth: 0,
      context: { agent: true },
      ...access(this.actor),
    })) as unknown as Doc;
    this.record({ action: "unpublish", target: t.slug, kind: t.kind, id, title: titleOf(t, saved), before, beforeLive });
    return saved;
  }

  async create(t: Target, data: Doc, publish: boolean) {
    const clean = await fromModel(this.payload, t.fields, writable(t, data));
    const status = t.drafts ? { _status: publish ? "published" : "draft" } : {};
    const saved = (await this.payload.create({
      collection: t.slug as CollectionSlug,
      data: { ...clean, ...status } as never,
      draft: t.drafts && !publish,
      depth: 0,
      context: { agent: true },
      ...access(this.actor),
    })) as unknown as Doc;
    this.record({ action: "create", target: t.slug, kind: t.kind, id: saved.id ?? null, title: titleOf(t, saved), before: null });
    return saved;
  }

  async remove(t: Target, id: string | number) {
    const before = await readLatest(this.actor, t, id);
    await this.payload.delete({ collection: t.slug as CollectionSlug, id, depth: 0, context: { agent: true }, ...access(this.actor) });
    this.record({ action: "delete", target: t.slug, kind: t.kind, id, title: titleOf(t, before), before });
    return before;
  }

  async versions(t: Target, id: string | number | null, limit = 10) {
    const res =
      t.kind === "global"
        ? await this.payload.findGlobalVersions({ slug: t.slug as GlobalSlug, sort: "-updatedAt", limit, depth: 0, ...access(this.actor) })
        : await this.payload.findVersions({
            collection: t.slug as CollectionSlug,
            where: { parent: { equals: id } },
            sort: "-updatedAt",
            limit,
            depth: 0,
            ...access(this.actor),
          });
    return res.docs.map((v) => {
      const version = (v as unknown as { version?: Doc }).version ?? {};
      return {
        versionId: v.id,
        savedAt: v.updatedAt,
        status: version._status ?? "published",
        autosave: Boolean((v as { autosave?: boolean }).autosave),
        latest: Boolean((v as { latest?: boolean }).latest),
      };
    });
  }

  /** Brings back an earlier version as a draft (or live, for targets without drafts). */
  async restore(t: Target, id: string | number | null, versionId: string | number) {
    const v =
      t.kind === "global"
        ? await this.payload.findGlobalVersionByID({ slug: t.slug as GlobalSlug, id: String(versionId), depth: 0, ...access(this.actor) })
        : await this.payload.findVersionByID({ collection: t.slug as CollectionSlug, id: String(versionId), depth: 0, ...access(this.actor) });
    const data = (v as unknown as { version?: Doc }).version;
    if (!data) throw new Error("That version has no content.");
    const [before, beforeLive] = await Promise.all([readLatest(this.actor, t, id), this.live(t, id)]);
    const changes = diff(t.fields, before, data);
    const saved = await this.save(t, id, data, false);
    this.record({ action: "restore", target: t.slug, kind: t.kind, id, title: titleOf(t, saved), before, beforeLive });
    return { saved, changes };
  }
}

/** Puts documents back the way they were before a task, newest change first. */
export async function undoChanges(a: Actor, targets: Target[], changes: Recorded[]) {
  const results: string[] = [];
  const engine = new Engine(a, () => {});
  const content = (d: Record<string, unknown> | null | undefined) => JSON.stringify(writable({} as Target, { ...(d ?? {}) }));
  for (const c of [...changes].reverse()) {
    if (c.undone) continue;
    const t = targets.find((x) => x.slug === c.target);
    if (!t) continue;
    try {
      if (c.action === "create") {
        if (c.id != null) await a.payload.delete({ collection: t.slug as CollectionSlug, id: c.id, ...access(a) });
        results.push(`Removed ${c.title}`);
      } else if (c.action === "delete") {
        if (c.before) {
          const { id: _old, ...rest } = c.before;
          void _old;
          await a.payload.create({ collection: t.slug as CollectionSlug, data: writable(t, rest) as never, draft: false, ...access(a) });
        }
        results.push(`Brought back ${c.title}`);
      } else if (t.drafts && c.beforeLive !== undefined) {
        // First what visitors saw, then any unpublished draft that was waiting on top of it.
        if (c.beforeLive) await engine.save(t, c.id, c.beforeLive, true);
        else if (t.kind === "collection" && c.id != null)
          await a.payload.update({ collection: t.slug as CollectionSlug, id: c.id, data: { _status: "draft" } as never, ...access(a) });
        if (c.before && (!c.beforeLive || content(c.before) !== content(c.beforeLive))) await engine.save(t, c.id, c.before, false);
        results.push(`Restored ${c.title}`);
      } else if (c.before) {
        // No drafts here (or recorded before drafts were tracked): put the old content back as it was.
        await engine.save(t, c.id, c.before, t.drafts ? c.before._status !== "draft" : true);
        results.push(`Restored ${c.title}`);
      }
      c.undone = true;
    } catch (err) {
      results.push(`Couldn't undo ${c.title}: ${(err as Error).message}`);
    }
  }
  return results;
}
