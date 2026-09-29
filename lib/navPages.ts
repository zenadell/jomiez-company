import type { Page } from "@/payload-types";

/** A custom page's link in the menu or footer. */
export type NavPage = { id: number | string; href: string; label: string; menu: boolean; footer: boolean; column: string | null };

export function navPageOf(page: Pick<Page, "id" | "title" | "slug" | "placement">): NavPage {
  return {
    id: page.id,
    href: `/${page.slug ?? ""}`,
    label: page.placement?.label?.trim() || page.title || page.slug || "",
    menu: Boolean(page.placement?.menu),
    footer: Boolean(page.placement?.footer),
    column: page.placement?.column?.trim() || null,
  };
}
