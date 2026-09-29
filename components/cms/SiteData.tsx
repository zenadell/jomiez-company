"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { NavPage } from "@/lib/navPages";
import type { Effect, Navigation, Site } from "@/payload-types";

/*
 * The content every page shares (company details, nav and footer, effects, and
 * the custom pages that link themselves into the menu or footer), read once per
 * request in the site layout and handed to client components.
 */

export type SiteData = { site: Site; nav: Navigation; effects: Effect; pages: NavPage[] };

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData(): SiteData {
  const data = useContext(Ctx);
  if (!data) throw new Error("useSiteData must be used inside the site layout.");
  return data;
}

type MenuLink = { id: string; label: string; href: string };

/*
 * The top menu and the footer columns: the links set in Nav & footer, then any
 * custom page ticked "Show in the top menu" / "Show in the footer" (in the
 * footer column it names, or the first). A page already linked by hand isn't
 * added twice.
 */
export function useMenus(): { header: MenuLink[]; columns: { id: string; title: string; links: MenuLink[] }[] } {
  const { nav, pages } = useSiteData();
  return useMemo(() => {
    const header: MenuLink[] = (nav.header?.links ?? []).map((l, i) => ({ id: l.id ?? `h${i}`, label: l.label, href: l.href }));
    for (const p of pages) {
      if (p.menu && p.label && !header.some((l) => l.href === p.href)) header.push({ id: `page-${p.id}`, label: p.label, href: p.href });
    }

    const columns = (nav.footer?.columns ?? []).map((c, i) => ({
      id: c.id ?? `c${i}`,
      title: c.title,
      links: (c.links ?? []).map((l, j) => ({ id: l.id ?? `c${i}l${j}`, label: l.label, href: l.href })),
    }));
    for (const p of pages) {
      if (!p.footer || !p.label || columns.some((c) => c.links.some((l) => l.href === p.href))) continue;
      const want = p.column?.toLowerCase();
      let col = columns.find((c) => c.title.toLowerCase() === want) ?? columns[0];
      if (!col) columns.push((col = { id: "pages", title: "Pages", links: [] }));
      col.links.push({ id: `page-${p.id}`, label: p.label, href: p.href });
    }
    return { header, columns };
  }, [nav, pages]);
}
