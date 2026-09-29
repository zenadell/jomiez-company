"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const never = () => () => {};

/*
 * In the admin's live preview, re-render the page each time the document saves.
 * The admin and the site share an address, so the admin's origin is this page's.
 */
export function LivePreview() {
  const router = useRouter();
  const origin = useSyncExternalStore(never, () => window.location.origin, () => null);
  if (!origin) return null;
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />;
}
