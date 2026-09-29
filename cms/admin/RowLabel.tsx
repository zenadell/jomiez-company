"use client";

import { useRowLabel } from "@payloadcms/ui";

const KEYS = ["label", "title", "name", "q", "text", "value"];

/* Names each row in a list after its own content ("What does Jomiez make?"), not "Item 03". */
export function RowLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>();
  const found = KEYS.map((k) => data?.[k]).find((v) => typeof v === "string" && v.trim());
  const label = typeof found === "string" ? found : `Item ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`;
  return <span>{label.length > 90 ? `${label.slice(0, 88)}…` : label}</span>;
}
