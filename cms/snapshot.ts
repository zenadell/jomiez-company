import fs from "fs";
import path from "path";
import type { CollectionSlug, FlattenedField, GlobalSlug, Payload } from "payload";
import { setAt, walk } from "./agent/schema";

/*
 * A content snapshot: everything made in one admin (pages, products, posts,
 * redirects, every setting, the images, the agent's memory and routines),
 * saved into the repository so it can be loaded into another database.
 *
 * Used to go live with what was built locally: `npm run content:save` writes
 * content-snapshot/, it's committed with the code, and the first deploy loads
 * it into the empty production database instead of the starter content.
 * Never included: logins, API keys, inbox messages and conversation history.
 */

export const SNAPSHOT_DIR = path.resolve(process.cwd(), "content-snapshot");
const FILE = path.join(SNAPSHOT_DIR, "content.json");
const UPLOADS = path.resolve(process.cwd(), "uploads");

/** In the order they're loaded: later ones may point at earlier ones. */
const COLLECTIONS = ["projects", "articles", "pages", "redirects", "agent-memory", "agent-routines"];
/** Never leaves the admin it was saved in. */
const SECRET_FIELDS: Record<string, string[]> = { agent: ["apiKey", "apiKeyHint", "voiceApiKey", "voiceApiKeyHint"] };
const MANAGED = ["id", "createdAt", "updatedAt", "globalType", "_status", "lastRun", "lastThread", "nextRun"];

type Doc = Record<string, unknown>;
type Versions = { live: Doc | null; draft: Doc | null };
type Snapshot = {
  savedAt: string;
  media: { id: number; filename: string; alt?: string | null }[];
  collections: Record<string, (Versions & { id: number })[]>;
  globals: Record<string, Versions>;
};

const ctx = { skipRevalidate: true, snapshot: true };

export const hasSnapshot = () => fs.existsSync(FILE);

function collectionConfig(payload: Payload, slug: string) {
  return payload.config.collections.find((c) => c.slug === slug);
}

/* ---------- Saving ---------- */

export async function saveSnapshot(payload: Payload) {
  fs.rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(SNAPSHOT_DIR, "media"), { recursive: true });
  const snap: Snapshot = { savedAt: new Date().toISOString(), media: [], collections: {}, globals: {} };

  const { docs: media } = await payload.find({ collection: "media", pagination: false, depth: 0, overrideAccess: true });
  for (const m of media) {
    const filename = String(m.filename ?? "");
    const from = path.join(UPLOADS, filename);
    if (!filename || !fs.existsSync(from)) {
      payload.logger.warn(`Snapshot: image ${filename || m.id} has no file here, skipped.`);
      continue;
    }
    fs.copyFileSync(from, path.join(SNAPSHOT_DIR, "media", filename));
    snap.media.push({ id: m.id as number, filename, alt: (m as { alt?: string | null }).alt ?? null });
  }

  for (const slug of COLLECTIONS) {
    const config = collectionConfig(payload, slug);
    if (!config) continue;
    const drafts = Boolean(config.versions && typeof config.versions === "object" && config.versions.drafts);
    const { docs } = await payload.find({ collection: slug as CollectionSlug, draft: drafts, pagination: false, depth: 0, overrideAccess: true });
    snap.collections[slug] = [];
    for (const latest of docs as unknown as Doc[]) {
      let live: Doc | null = latest;
      let draft: Doc | null = null;
      if (drafts) {
        const published = (await payload
          .findByID({ collection: slug as CollectionSlug, id: latest.id as number, draft: false, depth: 0, overrideAccess: true })
          .catch(() => null)) as Doc | null;
        live = published && published._status === "published" ? published : null;
        draft = latest._status === "draft" ? latest : null;
      }
      snap.collections[slug].push({ id: latest.id as number, live, draft });
    }
  }

  for (const g of payload.config.globals) {
    const drafts = Boolean(g.versions && typeof g.versions === "object" && g.versions.drafts);
    const strip = (doc: Doc | null) => {
      if (!doc) return null;
      for (const k of SECRET_FIELDS[g.slug] ?? []) delete doc[k];
      // Each provider's key in Agent settings → Your providers stays behind too.
      if (g.slug === "agent" && Array.isArray(doc.providers)) {
        doc.providers = (doc.providers as Doc[]).map((row) => {
          const out = { ...row };
          delete out.apiKey;
          delete out.apiKeyHint;
          return out;
        });
      }
      return doc;
    };
    const live = (await payload.findGlobal({ slug: g.slug as GlobalSlug, draft: false, depth: 0, overrideAccess: true })) as unknown as Doc;
    const latest = drafts ? ((await payload.findGlobal({ slug: g.slug as GlobalSlug, draft: true, depth: 0, overrideAccess: true })) as unknown as Doc) : null;
    snap.globals[g.slug] = {
      live: strip(drafts && live._status !== "published" ? null : live),
      draft: strip(latest && latest._status === "draft" ? latest : null),
    };
  }

  fs.writeFileSync(FILE, `${JSON.stringify(snap, null, 1)}\n`);
  const counts = Object.entries(snap.collections).map(([k, v]) => `${v.length} ${k}`);
  return { file: FILE, summary: `${snap.media.length} images, ${counts.join(", ")}, ${Object.keys(snap.globals).length} settings pages` };
}

/* ---------- Loading ---------- */

export async function applySnapshot(payload: Payload) {
  const snap = JSON.parse(fs.readFileSync(FILE, "utf8")) as Snapshot;
  const maps: Record<string, Map<number, number>> = {};
  const map = (slug: string) => (maps[slug] ??= new Map());
  const { docs: admins } = await payload.find({ collection: "users", limit: 1, depth: 0, overrideAccess: true });
  const owner = (admins[0]?.id as number | undefined) ?? null;

  const mapId = (relationTo: string, id: unknown): unknown => {
    if (id == null || id === "") return id;
    const raw = typeof id === "object" ? (id as { id?: unknown }).id : id;
    if (relationTo === "users") return owner;
    const m = maps[relationTo];
    return m ? (m.get(Number(raw)) ?? null) : null;
  };
  const mapRel = (relationTo: string | string[], value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((v) => mapRel(relationTo, v)).filter((v) => v != null);
    if (value && typeof value === "object" && "relationTo" in value) {
      const v = value as { relationTo: string; value: unknown };
      const id = mapId(v.relationTo, v.value);
      return id == null ? null : { relationTo: v.relationTo, value: id };
    }
    return typeof relationTo === "string" ? mapId(relationTo, value) : null;
  };
  /* Rich text keeps links and images as { relationTo, value } nodes. */
  const deepRemap = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(deepRemap);
    if (!node || typeof node !== "object") return node;
    const o = { ...(node as Doc) };
    if (typeof o.relationTo === "string" && "value" in o) o.value = mapId(o.relationTo, o.value);
    for (const [k, v] of Object.entries(o)) if (k !== "value" || typeof v === "object") o[k] = deepRemap(v);
    return o;
  };
  const prepare = (fields: FlattenedField[], doc: Doc) => {
    const data = structuredClone(doc);
    for (const k of MANAGED) delete data[k];
    walk(fields, data, (f, value, p) => {
      if ((f.type === "upload" || f.type === "relationship") && "relationTo" in f) setAt(data, p, mapRel(f.relationTo as string | string[], value));
      else if (f.type === "richText" && value) setAt(data, p, deepRemap(value));
    });
    return data;
  };

  /* Images first: everything else points at them. One at a time (same-name uploads race). */
  for (const m of snap.media) {
    const { docs } = await payload.find({ collection: "media", where: { filename: { equals: m.filename } }, limit: 1, depth: 0, overrideAccess: true });
    let id = docs[0]?.id as number | undefined;
    if (!id) {
      const created = await payload.create({
        collection: "media",
        data: { alt: m.alt ?? "" },
        filePath: path.join(SNAPSHOT_DIR, "media", m.filename),
        overrideAccess: true,
        context: ctx,
      });
      id = created.id as number;
    }
    map("media").set(m.id, id);
  }

  /* The same document in the other database: by address, or what identifies it. */
  const keyOf = (slug: string, doc: Doc): [string, unknown] | null => {
    if (slug === "redirects") return ["from", doc.from];
    if (slug === "agent-memory") return ["content", doc.content];
    if (slug === "agent-routines") return ["name", doc.name];
    return doc.slug ? ["slug", doc.slug] : null;
  };

  for (const slug of COLLECTIONS) {
    const entries = snap.collections[slug];
    const config = collectionConfig(payload, slug);
    if (!entries?.length || !config) continue;
    const fields = config.flattenedFields;
    const drafts = Boolean(config.versions && typeof config.versions === "object" && config.versions.drafts);
    for (const entry of entries) {
      const sample = entry.draft ?? entry.live;
      if (!sample) continue;
      const key = keyOf(slug, sample);
      let id: number | undefined;
      if (key) {
        const { docs } = await payload.find({
          collection: slug as CollectionSlug,
          where: { [key[0]]: { equals: key[1] } },
          draft: drafts,
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        id = docs[0]?.id as number | undefined;
      }
      const write = async (doc: Doc, status: "published" | "draft") => {
        const data = { ...prepare(fields, doc), ...(drafts ? { _status: status } : {}) };
        const draft = drafts && status === "draft";
        const saved = id
          ? await payload.update({ collection: slug as CollectionSlug, id, data: data as never, draft, depth: 0, overrideAccess: true, context: ctx })
          : await payload.create({ collection: slug as CollectionSlug, data: data as never, draft, depth: 0, overrideAccess: true, context: ctx });
        id = saved.id as number;
      };
      if (entry.live) await write(entry.live, "published");
      if (entry.draft) await write(entry.draft, "draft");
      if (id) map(slug).set(entry.id, id);
    }
  }

  for (const [slug, versions] of Object.entries(snap.globals)) {
    const g = payload.config.globals.find((x) => x.slug === slug);
    if (!g) continue;
    const drafts = Boolean(g.versions && typeof g.versions === "object" && g.versions.drafts);
    const write = async (doc: Doc, status: "published" | "draft") =>
      payload.updateGlobal({
        slug: slug as GlobalSlug,
        data: { ...prepare(g.flattenedFields, doc), ...(drafts ? { _status: status } : {}) } as never,
        draft: drafts && status === "draft",
        depth: 0,
        overrideAccess: true,
        context: ctx,
      });
    if (versions.live) await write(versions.live, "published");
    if (versions.draft) await write(versions.draft, "draft");
  }

  await payload.kv.set("content:snapshot", { savedAt: snap.savedAt, loadedAt: new Date().toISOString() });
  const counts = Object.entries(snap.collections).map(([k, v]) => `${v.length} ${k}`);
  return `${snap.media.length} images, ${counts.join(", ")} and every settings page, saved ${snap.savedAt}`;
}
