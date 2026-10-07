import { createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { databaseUrl } from "../db";

/*
 * Where previews made from templates keep their files. Each file is stored
 * once under its SHA-256 (a template's pictures, fonts and scripts are the
 * same for every lead), and each preview is a small list of its paths and the
 * files they point to. Measured by the Aethron session: two leads' previews of
 * one template differ by 3.4 MB out of 60 MB, so Supabase's free 1 GB holds
 * a few templates and hundreds of previews.
 *
 * - Supabase Storage (production): bucket "previews" in the project the
 *   database is on. Needs SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL if it
 *   can't be worked out from the database address). The runner uploads
 *   straight to Supabase with one-time upload links, so files never pass
 *   through this server on the way in.
 * - This server's own disk (locally, or until Supabase is set up).
 */

export type FileEntry = { path: string; hash: string; size: number; type: string };
export type Manifest = { slug: string; project: string; at: string; files: Record<string, { h: string; t: string; s: number }> };
export type Target = { hash: string; url: string; method: "PUT"; headers: Record<string, string> };

export const MAX_FILE = 50 * 1024 * 1024;
export const MAX_FILES = 6000;

const BUCKET = process.env.PREVIEW_BUCKET || "previews";

/* ---------- Supabase ---------- */

function supabase() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!key) return null;
  let url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  if (!url) {
    // postgres://postgres.<project>:…@…pooler.supabase.com or …@db.<project>.supabase.co
    const ref = /\/\/postgres\.([a-z0-9]{20})[:@]/.exec(databaseUrl)?.[1] ?? /@db\.([a-z0-9]{20})\.supabase\.co/.exec(databaseUrl)?.[1];
    if (ref) url = `https://${ref}.supabase.co`;
  }
  return url ? { url, key } : null;
}

type Sb = { url: string; key: string };

const auth = (s: Sb) => ({ authorization: `Bearer ${s.key}`, apikey: s.key });

let bucketReady: Promise<void> | null = null;
function ensureBucket(s: Sb) {
  bucketReady ??= (async () => {
    const res = await fetch(`${s.url}/storage/v1/bucket/${BUCKET}`, { headers: auth(s) });
    if (res.ok) return;
    const made = await fetch(`${s.url}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...auth(s), "content-type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: MAX_FILE }),
    });
    if (!made.ok && made.status !== 409) throw new Error(`Couldn't create the Supabase bucket “${BUCKET}” (${made.status} ${(await made.text()).slice(0, 200)}).`);
  })().catch((err) => {
    bucketReady = null;
    throw err;
  });
  return bucketReady;
}

/** Every stored file's hash, kept for a few minutes (listing is paged, 1000 at a time). Only trust it for files that are there. */
let known: { at: number; set: Set<string> } | null = null;
async function storedHashes(s: Sb) {
  if (known && Date.now() - known.at < 10 * 60_000) return known.set;
  const set = new Set<string>();
  for (let offset = 0; offset < 200_000; offset += 1000) {
    const res = await fetch(`${s.url}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...auth(s), "content-type": "application/json" },
      body: JSON.stringify({ prefix: "blobs", limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`Supabase listing failed (${res.status} ${(await res.text()).slice(0, 200)}).`);
    const page = (await res.json()) as { name: string }[];
    for (const o of page) set.add(o.name);
    if (page.length < 1000) break;
  }
  known = { at: Date.now(), set };
  return set;
}

/* ---------- This server's disk ---------- */

// Only ever a data folder chosen at run time; nothing for the build to bundle.
const diskRoot = () => path.resolve(/*turbopackIgnore: true*/ process.env.PREVIEW_FILES_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "previews"));
const blobPath = (hash: string) => path.join(diskRoot(), "blobs", hash.slice(0, 2), hash);
const manifestPath = (slug: string) => path.join(diskRoot(), "sites", slug, "manifest.json");

const uploadKey = () => createHmac("sha256", process.env.PAYLOAD_SECRET || "local-development-secret-change-me").update("jomiez-preview-uploads").digest();
const uploadSig = (hash: string, exp: number) => createHmac("sha256", uploadKey()).update(`${hash}|${exp}`).digest("base64url");

/** Checks a one-time upload link for this server's own disk. */
export function verifyUpload(hash: string, exp: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const want = Buffer.from(uploadSig(hash, exp));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

export async function writeBlob(hash: string, data: Buffer) {
  const p = blobPath(hash);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}

/* ---------- The store, whichever it is ---------- */

export const storeName = () => (supabase() ? "supabase" : "disk");

export const isHash = (h: unknown): h is string => typeof h === "string" && /^[a-f0-9]{64}$/.test(h);

/** A path inside a preview: relative, plain, no way out of its folder. */
export const safePath = (p: unknown): p is string =>
  typeof p === "string" && p.length > 0 && p.length <= 400 && !p.startsWith("/") && !p.includes("\\") && !p.split("/").some((seg) => seg === ".." || seg === "." || seg === "") && !/[\u0000-\u001f]/.test(p);

/** Which of these files aren't stored yet. */
export async function missing(hashes: string[]): Promise<string[]> {
  const unique = [...new Set(hashes)];
  const s = supabase();
  if (s) {
    await ensureBucket(s);
    const lacking = (have: Set<string>) => unique.filter((h) => !have.has(h));
    const out = lacking(await storedHashes(s));
    // The saved listing proves what was stored, not what wasn't: the runner uploads straight to
    // Supabase, so anything it lacks may have arrived since. Ask Supabase again before saying so.
    if (!out.length || (known && Date.now() - known.at < 1000)) return out;
    known = null;
    return lacking(await storedHashes(s));
  }
  const out: string[] = [];
  for (const h of unique) {
    try {
      await stat(blobPath(h));
    } catch {
      out.push(h);
    }
  }
  return out;
}

/** One-time upload links for files that aren't stored yet. */
export async function uploadTargets(hashes: string[], types: Record<string, string>, origin: string): Promise<Target[]> {
  const s = supabase();
  if (s) {
    await ensureBucket(s);
    const out: Target[] = [];
    for (const hash of hashes) {
      const res = await fetch(`${s.url}/storage/v1/object/upload/sign/${BUCKET}/blobs/${hash}`, {
        method: "POST",
        headers: { ...auth(s), "content-type": "application/json", "x-upsert": "true" },
        body: "{}",
      });
      if (!res.ok) throw new Error(`Supabase wouldn't make an upload link (${res.status} ${(await res.text()).slice(0, 200)}).`);
      const { url } = (await res.json()) as { url: string };
      out.push({ hash, url: `${s.url}/storage/v1${url}`, method: "PUT", headers: { "content-type": types[hash] || "application/octet-stream", "x-upsert": "true" } });
    }
    return out;
  }
  const exp = Date.now() + 60 * 60_000;
  return hashes.map((hash) => ({ hash, url: `${origin}/api/sites/blob/${hash}?exp=${exp}&sig=${uploadSig(hash, exp)}`, method: "PUT" as const, headers: { "content-type": "application/octet-stream" } }));
}

/** Notes that files are stored now (so the next upload doesn't ask for them again). */
export function remember(hashes: string[]) {
  if (known) for (const h of hashes) known.set.add(h);
}

export async function putManifest(m: Manifest) {
  const body = JSON.stringify(m);
  const s = supabase();
  if (s) {
    await ensureBucket(s);
    const res = await fetch(`${s.url}/storage/v1/object/${BUCKET}/sites/${m.slug}/manifest.json`, {
      method: "POST",
      headers: { ...auth(s), "content-type": "application/json", "x-upsert": "true", "cache-control": "no-cache" },
      body,
    });
    if (!res.ok) throw new Error(`Supabase wouldn't save the preview (${res.status} ${(await res.text()).slice(0, 200)}).`);
  } else {
    await mkdir(path.dirname(manifestPath(m.slug)), { recursive: true });
    await writeFile(manifestPath(m.slug), body);
  }
  manifests.delete(m.slug);
}

const manifests = new Map<string, { at: number; m: Manifest | null }>();

export async function getManifest(slug: string): Promise<Manifest | null> {
  const hit = manifests.get(slug);
  if (hit && Date.now() - hit.at < 60_000) return hit.m;
  let m: Manifest | null = null;
  const s = supabase();
  try {
    if (s) {
      const res = await fetch(`${s.url}/storage/v1/object/${BUCKET}/sites/${slug}/manifest.json`, { headers: auth(s), cache: "no-store" });
      m = res.ok ? ((await res.json()) as Manifest) : null;
    } else {
      m = JSON.parse(await readFile(manifestPath(slug), "utf8")) as Manifest;
    }
  } catch {
    m = null;
  }
  manifests.set(slug, { at: Date.now(), m });
  if (manifests.size > 200) manifests.delete(manifests.keys().next().value as string);
  return m;
}

/** A stored file, as a stream. */
export async function readBlob(hash: string): Promise<ReadableStream<Uint8Array> | null> {
  const s = supabase();
  if (s) {
    const res = await fetch(`${s.url}/storage/v1/object/${BUCKET}/blobs/${hash}`, { headers: auth(s) });
    return res.ok && res.body ? res.body : null;
  }
  try {
    await stat(blobPath(hash));
    return Readable.toWeb(createReadStream(blobPath(hash))) as ReadableStream<Uint8Array>;
  } catch {
    return null;
  }
}
