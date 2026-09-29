import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/*
 * The public site is built as static pages. When something is published (or
 * unpublished, or deleted) every page is rebuilt on its next visit, so a change
 * made in the admin shows on the live site within seconds. Draft and autosave
 * saves leave the live site alone; they only show in preview.
 */

type Doc = { _status?: "draft" | "published" | null } | null | undefined;

function affectsLiveSite(doc: Doc, previousDoc: Doc) {
  // Collections and globals without drafts have no _status: every save is live.
  if (!doc || doc._status === undefined) return true;
  return doc._status === "published" || previousDoc?._status === "published";
}

async function revalidateEverything(context: Record<string, unknown>) {
  // Scripts (the seed) run outside Next.js, where there is no cache to clear.
  if (context.skipRevalidate) return;
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  } catch {
    // Not inside a Next.js request: nothing to revalidate.
  }
}

export const revalidateCollection: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (affectsLiveSite(doc, previousDoc)) await revalidateEverything(req.context);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidateEverything(req.context);
  return doc;
};

export const revalidateGlobal: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (affectsLiveSite(doc, previousDoc)) await revalidateEverything(req.context);
  return doc;
};
