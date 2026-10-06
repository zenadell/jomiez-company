import { convertLexicalToMarkdown, convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { FlattenedField, Payload, SanitizedCollectionConfig, SanitizedGlobalConfig } from "payload";
import { previewPath } from "../preview";

/*
 * The agent's map of the site, read straight from the admin's own schema, so it
 * knows every page, section and field (and keeps knowing them as the schema
 * grows) without anything being described twice.
 */

/** Never shown to the agent: accounts, its own settings and records, and Payload's internals. */
export const OFF_LIMITS = new Set([
  "users",
  "agent",
  "agent-threads",
  // Finding clients has its own tools (cms/outreach/tools.ts): leads hold strangers' contact details and screenshots.
  "leads",
  "outreach",
  "payload-preferences",
  "payload-migrations",
  "payload-locked-documents",
  "payload-kv",
  "payload-jobs",
  "payload-folders",
]);

export type Target = {
  kind: "global" | "collection";
  slug: string;
  label: string;
  group: string;
  description: string;
  drafts: boolean;
  fields: FlattenedField[];
  titleField: string;
  config: SanitizedCollectionConfig | SanitizedGlobalConfig;
};

const text = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "en" in v) return String((v as { en: unknown }).en);
  return "";
};

export function targetsOf(payload: Payload): Target[] {
  const out: Target[] = [];
  for (const g of payload.config.globals) {
    if (OFF_LIMITS.has(g.slug)) continue;
    out.push({
      kind: "global",
      slug: g.slug,
      label: text(g.label) || g.slug,
      group: text(g.admin?.group) || "Settings",
      description: text(g.admin?.description),
      drafts: Boolean(g.versions && typeof g.versions === "object" && g.versions.drafts),
      fields: g.flattenedFields,
      titleField: "",
      config: g,
    });
  }
  for (const c of payload.config.collections) {
    if (OFF_LIMITS.has(c.slug)) continue;
    out.push({
      kind: "collection",
      slug: c.slug,
      label: text(c.labels?.plural) || c.slug,
      group: text(c.admin?.group) || "Collections",
      description: text(c.admin?.description),
      drafts: Boolean(c.versions && typeof c.versions === "object" && c.versions.drafts),
      fields: c.flattenedFields,
      titleField: c.admin?.useAsTitle || "id",
      config: c,
    });
  }
  return out;
}

/** Finds a target by slug or by its admin name ("Home page", "Journal"). */
export function findTarget(payload: Payload, name: string): Target | null {
  const all = targetsOf(payload);
  const key = name.trim().toLowerCase();
  return (
    all.find((t) => t.slug === key) ??
    all.find((t) => t.label.toLowerCase() === key) ??
    all.find((t) => t.slug.replace(/-/g, " ") === key.replace(/-/g, " ")) ??
    null
  );
}

/** Where a document lives on the public site, if anywhere. */
export function siteUrl(t: Target, doc?: unknown): string | null {
  if (t.kind === "collection" && !["pages", "projects", "articles"].includes(t.slug)) return null;
  if (t.kind === "global" && ["site", "navigation", "effects"].includes(t.slug)) return "/ (every page)";
  return previewPath(t.kind === "global" ? { global: t.slug } : { collection: t.slug, slug: (doc as { slug?: unknown } | null)?.slug });
}

export function adminUrl(t: Target, id?: string | number | null): string {
  return t.kind === "global" ? `/admin/globals/${t.slug}` : id ? `/admin/collections/${t.slug}/${id}` : `/admin/collections/${t.slug}`;
}

/* ---------- Describing fields to the model ---------- */

function fieldLine(f: FlattenedField): string {
  const label = text((f as { label?: unknown }).label);
  const bits: string[] = [f.type];
  if ("relationTo" in f && f.relationTo) bits[0] = `${f.type}→${Array.isArray(f.relationTo) ? f.relationTo.join("|") : f.relationTo}${"hasMany" in f && f.hasMany ? "[]" : ""}`;
  if ((f.type === "select" || f.type === "radio") && "options" in f) {
    const opts = f.options.map((o) => (typeof o === "string" ? o : o.value));
    bits.push(`one of ${opts.join("|")}${"hasMany" in f && f.hasMany ? " (many)" : ""}`);
  }
  if ("required" in f && f.required) bits.push("required");
  if (f.type === "richText") bits.push("write as Markdown");
  const desc = text((f as { admin?: { description?: unknown } }).admin?.description);
  return `${"name" in f ? f.name : "?"}: ${bits.join(", ")}${label ? ` "${label}"` : ""}${desc ? ` — ${desc.slice(0, 140)}` : ""}`;
}

export function describeFields(fields: FlattenedField[], depth = 0): string {
  const pad = "  ".repeat(depth);
  const lines: string[] = [];
  for (const f of fields) {
    if (!("name" in f) || f.name === "id" || (f as { admin?: { hidden?: boolean } }).admin?.hidden) continue;
    if (f.type === "group" || f.type === "tab") {
      lines.push(`${pad}${f.name}: group${text((f as { label?: unknown }).label) ? ` "${text((f as { label?: unknown }).label)}"` : ""}`);
      lines.push(describeFields(f.flattenedFields, depth + 1));
    } else if (f.type === "array") {
      lines.push(`${pad}${fieldLine(f).replace(/^(\w+): array/, "$1: list of rows")}`);
      lines.push(describeFields(f.flattenedFields, depth + 1));
    } else if (f.type === "blocks") {
      lines.push(`${pad}${f.name}: list of sections, each with "blockType" one of:`);
      for (const b of f.blocks) {
        lines.push(`${pad}  - blockType "${b.slug}" (${text(b.labels?.singular) || b.slug})${b.flattenedFields.length ? ":" : " (no fields)"}`);
        lines.push(describeFields(b.flattenedFields, depth + 3));
      }
    } else if (f.type !== "join") {
      lines.push(`${pad}${fieldLine(f)}`);
    }
  }
  return lines.filter(Boolean).join("\n");
}

/* ---------- Walking documents alongside their fields ---------- */

type Visit = (f: FlattenedField, value: unknown, path: (string | number)[], labels: string[]) => void;

const fieldLabel = (f: FlattenedField) => text((f as { label?: unknown }).label) || ("name" in f ? f.name : "");

export function walk(fields: FlattenedField[], data: unknown, visit: Visit, path: (string | number)[] = [], labels: string[] = []) {
  if (!data || typeof data !== "object") return;
  const obj = data as Record<string, unknown>;
  for (const f of fields) {
    if (!("name" in f)) continue;
    const value = obj[f.name];
    const p = [...path, f.name];
    const l = [...labels, fieldLabel(f)];
    visit(f, value, p, l);
    if ((f.type === "group" || f.type === "tab") && value) walk(f.flattenedFields, value, visit, p, l);
    if (f.type === "array" && Array.isArray(value)) {
      value.forEach((row, i) => walk(f.flattenedFields, row, visit, [...p, i], [...l, `#${i + 1}`]));
    }
    if (f.type === "blocks" && Array.isArray(value)) {
      value.forEach((row, i) => {
        const block = f.blocks.find((b) => b.slug === (row as { blockType?: string })?.blockType);
        if (block) walk(block.flattenedFields, row, visit, [...p, i], [...l, `#${i + 1} ${text(block.labels?.singular) || block.slug}`]);
      });
    }
  }
}

/** The field at a path ("hero.cta.label", "layout.2.title"), for labels and type checks. */
export function fieldAt(fields: FlattenedField[], path: (string | number)[], data?: unknown): { field: FlattenedField; labels: string[] } | null {
  let current: FlattenedField[] = fields;
  let node: unknown = data;
  const labels: string[] = [];
  let found: FlattenedField | null = null;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    if (typeof seg === "number" || /^\d+$/.test(String(seg))) {
      const index = Number(seg);
      labels.push(`#${index + 1}`);
      node = Array.isArray(node) ? node[index] : undefined;
      if (found?.type === "blocks") {
        const type = (node as { blockType?: string } | undefined)?.blockType;
        const block = found.blocks.find((b) => b.slug === type);
        if (!block) return found ? { field: found, labels } : null;
        labels[labels.length - 1] += ` ${text(block.labels?.singular) || block.slug}`;
        current = block.flattenedFields;
      }
      continue;
    }
    const f = current.find((x) => "name" in x && x.name === seg);
    if (!f) return null;
    found = f;
    labels.push(fieldLabel(f));
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[seg] : undefined;
    if (f.type === "group" || f.type === "tab" || f.type === "array") current = f.flattenedFields;
  }
  return found ? { field: found, labels } : null;
}

/**
 * Why a path can't be edited, or null if it can. A path that names no field
 * would be silently dropped on save, so it's refused with the names that do exist there.
 */
export function checkPath(fields: FlattenedField[], data: unknown, path: string): string | null {
  const segs = parsePath(path);
  let current: FlattenedField[] = fields;
  let node: unknown = data;
  let found: FlattenedField | null = null;
  const names = (list: FlattenedField[]) =>
    list
      .filter((f) => "name" in f && f.name !== "id" && f.type !== "join" && !(f as { admin?: { hidden?: boolean } }).admin?.hidden)
      .map((f) => (f as { name: string }).name)
      .join(", ");
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const at = segs.slice(0, i).join(".") || "the top level";
    if (typeof seg === "number") {
      if (!found || (found.type !== "array" && found.type !== "blocks")) return `"${path}": ${at} isn't a list.`;
      const length = Array.isArray(node) ? node.length : 0;
      if (seg < 0 || seg >= length) return `"${path}": ${at} has ${length} item${length === 1 ? "" : "s"}${length ? ` (0 to ${length - 1})` : ""}.`;
      node = (node as unknown[])[seg];
      if (found.type === "blocks") {
        const type = (node as { blockType?: string } | undefined)?.blockType;
        const block = found.blocks.find((b) => b.slug === type);
        if (!block) return `"${path}": item ${seg} of ${at} has an unknown section type.`;
        current = block.flattenedFields;
      } else {
        current = found.flattenedFields;
      }
      found = null;
      continue;
    }
    if (found && (found.type === "array" || found.type === "blocks")) return `"${path}": ${at} is a list; give an item number after it (e.g. ${at}.0.${seg}).`;
    const f = current.find((x) => "name" in x && x.name === seg);
    if (!f) return `"${path}": there's no field "${seg}" at ${at}. Fields there: ${names(current) || "none"}.`;
    found = f;
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[seg] : undefined;
    if (f.type === "group" || f.type === "tab") current = f.flattenedFields;
  }
  return null;
}

/* ---------- Rich text as Markdown ---------- */

const editorCache = new WeakMap<object, Promise<unknown>>();

async function editorConfig(payload: Payload) {
  let p = editorCache.get(payload.config);
  if (!p) {
    p = editorConfigFactory.default({ config: payload.config });
    editorCache.set(payload.config, p);
  }
  return (await p) as Awaited<ReturnType<typeof editorConfigFactory.default>>;
}

export async function richTextToMarkdown(payload: Payload, value: unknown): Promise<string> {
  if (!value || typeof value !== "object") return "";
  try {
    return convertLexicalToMarkdown({ data: value as never, editorConfig: await editorConfig(payload) });
  } catch {
    return "";
  }
}

export async function markdownToRichText(payload: Payload, markdown: string): Promise<unknown> {
  return convertMarkdownToLexical({ editorConfig: await editorConfig(payload), markdown });
}

/** A copy of `doc` with rich text as Markdown (for the model to read). */
export async function toModel(payload: Payload, fields: FlattenedField[], doc: unknown): Promise<unknown> {
  const copy = structuredClone(doc) as Record<string, unknown>;
  const jobs: Promise<void>[] = [];
  walk(fields, copy, (f, value, path) => {
    if (f.type !== "richText" || !value || typeof value !== "object") return;
    jobs.push(
      richTextToMarkdown(payload, value).then((md) => {
        setAt(copy, path, md);
      }),
    );
  });
  await Promise.all(jobs);
  for (const k of ["globalType", "_order"]) delete copy[k];
  return copy;
}

/** A copy of `data` with Markdown turned back into rich text and relations as IDs (for saving). */
export async function fromModel(payload: Payload, fields: FlattenedField[], data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const copy = structuredClone(data);
  const jobs: Promise<void>[] = [];
  walk(fields, copy, (f, value, path) => {
    if (f.type === "richText" && typeof value === "string") {
      jobs.push(markdownToRichText(payload, value).then((rt) => setAt(copy, path, rt)));
    }
    if ((f.type === "upload" || f.type === "relationship") && value && typeof value === "object") {
      const toId = (v: unknown) => (v && typeof v === "object" && "id" in v && !("relationTo" in v) ? (v as { id: unknown }).id : v);
      setAt(copy, path, Array.isArray(value) ? value.map(toId) : toId(value));
    }
  });
  await Promise.all(jobs);
  return copy;
}

/* ---------- Paths ---------- */

/** "hero.cta.label", "layout[2].title" or "layout.2.title" → ["hero","cta","label"] / ["layout",2,"title"]. */
export function parsePath(path: string): (string | number)[] {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}

export function getAt(obj: unknown, path: (string | number)[]): unknown {
  let node = obj;
  for (const seg of path) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string | number, unknown>)[seg];
  }
  return node;
}

export function setAt(obj: Record<string, unknown>, path: (string | number)[], value: unknown) {
  let node: Record<string | number, unknown> = obj;
  path.forEach((seg, i) => {
    if (i === path.length - 1) {
      node[seg] = value;
      return;
    }
    const next = node[seg];
    if (next == null || typeof next !== "object") node[seg] = typeof path[i + 1] === "number" ? [] : {};
    node = node[seg] as Record<string | number, unknown>;
  });
}
