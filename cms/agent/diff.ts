import type { FlattenedField } from "payload";
import { walk } from "./schema";

/*
 * What a change actually changes, in the admin's own words:
 * "Hero › Headline: 'Where intelligence takes root.' → 'Rooted in intelligence.'"
 * Shown on approval cards and in the agent's report of what it did.
 */

export type Change = { where: string; before: string; after: string };

const show = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return "(empty)";
  if (typeof v === "string") return v.length > 280 ? `${v.slice(0, 277)}…` : v;
  if (typeof v === "boolean") return v ? "on" : "off";
  if (typeof v === "number") return String(v);
  const json = JSON.stringify(v);
  return json.length > 280 ? `${json.slice(0, 277)}…` : json;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

type Leaf = { labels: string[]; value: unknown };

/* Bookkeeping Payload does on every save: never a change worth showing. */
const SYSTEM = new Set(["_status", "updatedAt", "createdAt", "id", "globalType", "_order"]);

function leaves(fields: FlattenedField[], doc: unknown): Map<string, Leaf> {
  const out = new Map<string, Leaf>();
  walk(fields, doc, (f, value, path, labels) => {
    if (path.length === 1 && SYSTEM.has(String(path[0]))) return;
    if (["group", "tab", "array", "blocks"].includes(f.type)) {
      if ((f.type === "array" || f.type === "blocks") && Array.isArray(value)) {
        out.set(`${path.join(".")}#count`, { labels: [...labels, "number of items"], value: value.length });
      }
      return;
    }
    out.set(path.join("."), { labels, value });
  });
  return out;
}

export function diff(fields: FlattenedField[], before: unknown, after: unknown, limit = 60): Change[] {
  const a = leaves(fields, before ?? {});
  const b = leaves(fields, after ?? {});
  const keys = new Set([...a.keys(), ...b.keys()]);
  const changes: Change[] = [];
  for (const k of keys) {
    const x = a.get(k);
    const y = b.get(k);
    if (same(x?.value, y?.value)) continue;
    changes.push({ where: (y ?? x)!.labels.filter(Boolean).join(" › "), before: show(x?.value), after: show(y?.value) });
  }
  // Counts first ("3 items → 4"), then field edits in document order.
  changes.sort((p, q) => Number(q.where.endsWith("number of items")) - Number(p.where.endsWith("number of items")));
  return changes.slice(0, limit);
}

export function describeChanges(changes: Change[]): string {
  if (!changes.length) return "No visible changes.";
  return changes.map((c) => `• ${c.where}: ${c.before} → ${c.after}`).join("\n");
}
