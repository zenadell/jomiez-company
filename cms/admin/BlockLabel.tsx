"use client";

import { Pill, useRowLabel } from "@payloadcms/ui";

/* Section names, matching the block labels in cms/collections/Pages.ts. */
const NAMES: Record<string, string> = {
  pageHero: "Page opener",
  content: "Text",
  imageBand: "Image band",
  list: "Numbered cards",
  projects: "Products & work grid",
  journal: "Latest journal posts",
  faq: "Questions",
  cta: "Call to action",
  tenets: "Our tenets",
  pricing: "Pricing",
};

/*
 * A custom page's section row: its number, its kind and its own headline
 * ("02 · Image band · Built to endure"), so a long page reads like a table of contents.
 */
export function BlockLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>();
  const type = typeof data?.blockType === "string" ? data.blockType : "";
  const custom = (data?.custom ?? null) as Record<string, unknown> | null;
  const title = [data?.title, data?.label, custom?.title, data?.eyebrow].find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  return (
    <span className="jz-block-label">
      <span className="blocks-field__block-number">{String((rowNumber ?? 0) + 1).padStart(2, "0")}</span>
      <Pill pillStyle="white" size="small" className="blocks-field__block-pill">
        {NAMES[type] ?? type}
      </Pill>
      {title && <span className="jz-block-label__title">{title.length > 70 ? `${title.slice(0, 68)}…` : title}</span>}
    </span>
  );
}
