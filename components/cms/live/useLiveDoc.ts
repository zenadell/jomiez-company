"use client";

import { mergeData, ready } from "@payloadcms/live-preview";
import { useEffect, useState } from "react";

export type LiveTarget = { collection?: string; global?: string; id?: number | string | null };

type Message = {
  type?: string;
  collectionSlug?: string;
  globalSlug?: string;
  data?: Record<string, unknown> & { id?: unknown };
};

/*
 * In the admin's live preview, the edit form posts its unsaved values to this
 * page on every change. This follows one document (a global, or a collection
 * document by id), has the API fill in its images and links, and returns the
 * latest version, so the page re-renders as the editor types. Messages for
 * other documents are ignored. Outside the preview it returns `initial`.
 */
export function useLiveDoc<T>(initial: T, { collection, global, id }: LiveTarget): T {
  const [live, setLive] = useState<T | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    let alive = true;
    let busy = false;
    let queued: Record<string, unknown> | null = null;

    const merge = async (incoming: Record<string, unknown>) => {
      busy = true;
      try {
        const merged = await mergeData<Record<string, unknown>>({
          serverURL: origin,
          apiRoute: "/api",
          depth: 2,
          collectionSlug: collection,
          globalSlug: global,
          incomingData: incoming,
          initialData: { id: id ?? undefined },
        });
        if (alive && merged && !("errors" in merged)) setLive(merged as T);
      } catch {
        // A failed merge keeps the last good render.
      }
      busy = false;
      if (queued && alive) {
        const next = queued;
        queued = null;
        void merge(next);
      }
    };

    const onMessage = (event: MessageEvent<Message>) => {
      if (event.origin !== origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object" || msg.type !== "payload-live-preview" || !msg.data) return;
      const mine = collection
        ? msg.collectionSlug === collection && String(msg.data.id) === String(id)
        : Boolean(global) && msg.globalSlug === global;
      if (!mine) return;
      // Only the newest edit matters: while one merge is in flight, keep the latest.
      if (busy) queued = msg.data;
      else void merge(msg.data);
    };

    window.addEventListener("message", onMessage);
    ready({ serverURL: origin });
    return () => {
      alive = false;
      window.removeEventListener("message", onMessage);
    };
  }, [collection, global, id]);

  // The form is always at least as new as the last save, so its values win.
  return live ?? initial;
}
