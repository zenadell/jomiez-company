"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Effect, Navigation, Site } from "@/payload-types";

/*
 * The content every page shares (company details, nav and footer, effects),
 * read once per request in the site layout and handed to client components.
 */
export type SiteData = { site: Site; nav: Navigation; effects: Effect };

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData(): SiteData {
  const data = useContext(Ctx);
  if (!data) throw new Error("useSiteData must be used inside the site layout.");
  return data;
}
