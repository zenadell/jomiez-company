"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SiteDataProvider, type SiteData } from "@/components/cms/SiteData";
import { navPageOf, type NavPage } from "@/lib/navPages";
import type { Page } from "@/payload-types";
import { useLiveDoc } from "./useLiveDoc";

const EditedPage = createContext<((page: NavPage) => void) | null>(null);

/*
 * In the live preview, the nav, footer, site settings and effects follow their
 * edit forms too, and so does the menu/footer link of a custom page being
 * edited ("Show in the top menu" appears as it's ticked).
 */
export function LiveSiteData({ value, children }: { value: SiteData; children: ReactNode }) {
  const site = useLiveDoc(value.site, { global: "site" });
  const nav = useLiveDoc(value.nav, { global: "navigation" });
  const effects = useLiveDoc(value.effects, { global: "effects" });
  const [edited, setEdited] = useState<NavPage | null>(null);

  const pages = useMemo(() => {
    if (!edited) return value.pages;
    const others = value.pages.filter((p) => String(p.id) !== String(edited.id));
    return [...others, edited];
  }, [value.pages, edited]);

  const report = useCallback((page: NavPage) => setEdited(page), []);

  return (
    <EditedPage.Provider value={report}>
      <SiteDataProvider value={{ site, nav, effects, pages }}>{children}</SiteDataProvider>
    </EditedPage.Provider>
  );
}

/* Called by the live preview of a custom page with its latest (unsaved) values. */
export function useReportEditedPage(page: unknown) {
  const report = useContext(EditedPage);
  const p = page as Page | null;
  const nav = p && typeof p === "object" && "id" in p ? navPageOf(p) : null;
  const key = nav ? JSON.stringify(nav) : "";
  useEffect(() => {
    if (report && nav) report(nav);
    // `key` captures every field of `nav`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, key]);
}
