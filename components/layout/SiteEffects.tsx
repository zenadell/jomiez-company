"use client";

import { useSiteData } from "@/components/cms/SiteData";
import { PageTransitions } from "@/components/layout/PageTransitions";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CursorLens } from "@/components/ui/CursorLens";

/* Smooth scrolling and page transitions, each switchable in the admin (Settings → Effects). */
export function SiteMotion() {
  const { effects } = useSiteData();
  return (
    <>
      {effects.smoothScroll !== false && <SmoothScroll />}
      {effects.pageTransitions !== false && <PageTransitions />}
    </>
  );
}

/* The cursor lens. It stays off in the admin's preview pane, where it would sit over what's being edited. */
export function SiteLens({ preview }: { preview: boolean }) {
  const { effects } = useSiteData();
  if (preview || effects.cursorLens === false) return null;
  return <CursorLens size={effects.lensSize ?? 132} />;
}
