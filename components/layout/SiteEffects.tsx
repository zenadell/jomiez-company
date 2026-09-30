"use client";

import { useInPreviewPane } from "@/components/cms/PreviewBar";
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

/*
 * The cursor lens. It stays off inside the admin's preview pane, where it would
 * sit over what's being edited, but not in ordinary tabs that happen to be in
 * preview mode.
 */
export function SiteLens() {
  const { effects } = useSiteData();
  const inPane = useInPreviewPane();
  if (inPane || effects.cursorLens === false) return null;
  return <CursorLens size={effects.lensSize ?? 132} />;
}
