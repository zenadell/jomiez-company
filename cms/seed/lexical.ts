/*
 * Tiny builders for the rich text editor's (Lexical) saved format, so the seed
 * can write journal posts as real rich text.
 */

type Node = { type: string; version: number; [k: string]: unknown };

const base = { format: "" as const, indent: 0, version: 1, direction: "ltr" as const };

export const txt = (text: string, bold = false): Node => ({
  type: "text",
  text,
  format: bold ? 1 : 0,
  style: "",
  mode: "normal",
  detail: 0,
  version: 1,
});

export const p = (text: string): Node => ({ ...base, type: "paragraph", textFormat: 0, textStyle: "", children: [txt(text)] });

export const h = (tag: "h2" | "h3", text: string): Node => ({ ...base, type: "heading", tag, children: [txt(text)] });

export const quote = (text: string): Node => ({ ...base, type: "quote", children: [txt(text)] });

export const list = (items: { title: string; text: string }[]): Node => ({
  ...base,
  type: "list",
  listType: "bullet",
  start: 1,
  tag: "ul",
  children: items.map((it, i) => ({
    ...base,
    type: "listitem",
    value: i + 1,
    children: [txt(`${it.title}:`, true), txt(` ${it.text}`)],
  })),
});

export const doc = (children: Node[]) => ({ root: { ...base, type: "root", children } });
