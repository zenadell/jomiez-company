"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { group: string; title: string; href: string; hint?: string };

const SITE: Option[] = [
  { group: "Site pages", title: "Home", href: "/" },
  { group: "Site pages", title: "About", href: "/about" },
  { group: "Site pages", title: "Services", href: "/services" },
  { group: "Site pages", title: "Products & work", href: "/work" },
  { group: "Site pages", title: "Journal", href: "/insights" },
  { group: "Site pages", title: "Contact", href: "/contact" },
  { group: "Site pages", title: "Privacy policy", href: "/privacy-policy" },
  { group: "Site pages", title: "Terms & conditions", href: "/terms-conditions" },
  { group: "Jump to a section", title: "Home → Creations", href: "/#work" },
  { group: "Jump to a section", title: "Home → Services", href: "/#capabilities" },
  { group: "Jump to a section", title: "Home → Pricing", href: "/#pricing" },
  { group: "Jump to a section", title: "Contact → Book a call", href: "/contact#book" },
];

type Doc = { title?: string; name?: string; slug?: string; _status?: string };

let cache: Promise<Option[]> | null = null;

/* Everything a link can point at: the site's pages, custom pages, products and posts, and contact details.
   Shared by every picker on the screen; `fresh` re-reads it (a page may have been added since). */
function loadOptions(fresh = false): Promise<Option[]> {
  if (fresh) cache = null;
  cache ??= (async () => {
    const get = async (url: string) => {
      try {
        const res = await fetch(url, { credentials: "include" });
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };
    const list = "?depth=0&limit=300&draft=true&sort=title";
    const [pages, projects, articles, site] = await Promise.all([
      get(`/api/pages${list}`),
      get(`/api/projects?depth=0&limit=300&draft=true&sort=_order`),
      get(`/api/articles?depth=0&limit=300&draft=true&sort=-date`),
      get(`/api/globals/site?depth=0`),
    ]);
    const docs = (r: { docs?: Doc[] } | null) => (r?.docs ?? []).filter((d) => d.slug);
    const draft = (d: Doc) => (d._status === "draft" ? "not published yet" : undefined);
    const contact = (site ?? {}) as { email?: string; phone?: string; phoneHref?: string };
    return [
      ...SITE,
      ...docs(pages).map((d) => ({ group: "Custom pages", title: d.title ?? d.slug!, href: `/${d.slug}`, hint: draft(d) })),
      ...docs(projects).map((d) => ({ group: "Products & work", title: d.name ?? d.slug!, href: `/work/${d.slug}`, hint: draft(d) })),
      ...docs(articles).map((d) => ({ group: "Journal posts", title: d.title ?? d.slug!, href: `/insights/${d.slug}`, hint: draft(d) })),
      ...(contact.email ? [{ group: "Contact", title: `Email ${contact.email}`, href: `mailto:${contact.email}` }] : []),
      ...(contact.phone
        ? [{ group: "Contact", title: `Call ${contact.phone}`, href: contact.phoneHref || `tel:${contact.phone.replace(/[^+\d]/g, "")}` }]
        : []),
    ];
  })();
  return cache;
}

/*
 * A "Choose a page" button under every "Goes to" box: pick any page, section,
 * product, post or contact link from a searchable list instead of typing its
 * address. Fills the link's text too, when that's still empty.
 */
export function PagePicker({ path }: { path?: string }) {
  const { value, setValue } = useField<string>({ path });
  const labelPath = path ? path.replace(/href$/, "label") : "";
  const label = useFormFields(([fields]) => (labelPath && labelPath !== path ? fields[labelPath] : undefined));
  const setLabel = useFormFields(([, dispatch]) => dispatch);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[] | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Loaded up front so the button can name the page a link already points at.
  useEffect(() => {
    let alive = true;
    void loadOptions().then((o) => alive && setOptions(o));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void loadOptions(true).then((o) => alive && setOptions(o));
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      alive = false;
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = (options ?? []).filter((o) => !q || `${o.title} ${o.href}`.toLowerCase().includes(q));
    const map = new Map<string, Option[]>();
    for (const o of shown) map.set(o.group, [...(map.get(o.group) ?? []), o]);
    return [...map.entries()];
  }, [options, query]);

  const choose = (o: Option) => {
    setValue(o.href);
    if (label && !String(label.value ?? "").trim()) {
      const text = o.group === "Jump to a section" ? o.title.split("→").pop()!.trim() : o.title;
      setLabel({ type: "UPDATE", path: labelPath, value: text });
    }
    setOpen(false);
    setQuery("");
  };

  const current = (options ?? []).find((o) => o.href === value);

  return (
    <div className="jz-picker" ref={box}>
      <button type="button" className="jz-picker__button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {current ? `→ ${current.title}` : "Choose a page"}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="jz-picker__panel" role="listbox">
          <input
            autoFocus
            className="jz-picker__search"
            placeholder="Search pages, products, posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                const first = groups[0]?.[1][0];
                if (first) choose(first);
              }
            }}
          />
          {!options && <p className="jz-picker__empty">Loading…</p>}
          {options && groups.length === 0 && <p className="jz-picker__empty">Nothing matches. You can also type any address.</p>}
          {groups.map(([group, items]) => (
            <div key={group} className="jz-picker__group">
              <p className="jz-picker__heading">{group}</p>
              {items.map((o) => (
                <button
                  key={`${group}-${o.href}`}
                  type="button"
                  role="option"
                  aria-selected={o.href === value}
                  className="jz-picker__option"
                  onClick={() => choose(o)}
                >
                  <span>{o.title}</span>
                  <code>{o.href}</code>
                  {o.hint && <em>{o.hint}</em>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
