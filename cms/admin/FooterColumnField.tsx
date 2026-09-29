"use client";

import { SelectInput, useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/* The footer column a custom page's link goes in, picked from the footer's own columns (Settings → Nav & footer). */
export function FooterColumnField({ path, field }: { path: string; field?: { label?: string; admin?: { description?: string } } }) {
  const { value, setValue } = useField<string>({ path });
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/globals/navigation?depth=0&draft=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((nav) => {
        const titles = ((nav?.footer?.columns ?? []) as { title?: string }[]).map((c) => c.title ?? "").filter(Boolean);
        if (alive) setColumns(titles);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const options = [...new Set([...columns, ...(value && !columns.includes(value) ? [value] : [])])].map((t) => ({ label: t, value: t }));

  return (
    <SelectInput
      path={path}
      name={path}
      label={field?.label ?? "Footer column"}
      description={field?.admin?.description}
      options={options}
      value={value ?? ""}
      isClearable
      placeholder={columns[0] ? `${columns[0]} (the first column)` : "The first column"}
      onChange={(opt) => {
        const v = Array.isArray(opt) ? opt[0]?.value : opt?.value;
        setValue(typeof v === "string" ? v : "");
      }}
    />
  );
}
