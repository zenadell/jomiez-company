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
  // Every saved page is out of date from now (lib/page-cache.mjs reads this). It works
  // wherever the change is made, the agent's streamed answers and routines included,
  // where revalidatePath on its own is lost.
  (globalThis as Record<symbol, unknown>)[Symbol.for("jomiez.pages.publishedAt")] = Date.now();
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

type Addressed = Doc & { id?: number | string; slug?: string | null };

/*
 * When a published page, product or post gets a new address, its old address
 * keeps working: a permanent redirect to the new one is added (Settings →
 * Redirects), and any redirect away from the new address is removed so the two
 * can't loop.
 */
export function redirectOldAddress(prefix: string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req, collection }) => {
    const now = doc as Addressed;
    const before = previousDoc as Addressed;
    if (now?._status === "draft" || before?._status !== "published") return doc;
    if (!before.slug || !now.slug || before.slug === now.slug) return doc;
    const from = `${prefix}${before.slug}`;
    const to = `${prefix}${now.slug}`;
    try {
      await req.payload.delete({ collection: "redirects", where: { from: { in: [to, from] } }, req, overrideAccess: true });
      await req.payload.create({
        collection: "redirects",
        req,
        overrideAccess: true,
        data: {
          from,
          type: "301",
          to: { type: "reference", reference: { relationTo: collection.slug as "pages", value: Number(now.id) } },
        },
      });
    } catch (err) {
      req.payload.logger.warn({ err, msg: `Could not add a redirect from ${from} to ${to}` });
    }
    return doc;
  };
}
