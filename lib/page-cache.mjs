/*
 * The site's page cache: Next.js's own (pages kept on disk and in memory),
 * except that a page saved before this server started, or before the last
 * publish, is never served.
 *
 * Render resets the disk on every restart and deploy (the free plan restarts
 * after 15 minutes without visitors), which puts back the pages as they were
 * at the last build. Next.js keeps its record of what was published since only
 * in memory, so it would serve those old pages as if nothing had changed. With
 * this, each page is rendered from the database on its first visit after a
 * start, then cached as usual until the next publish.
 *
 * Publishing sets the time below (cms/hooks.ts). Next.js's revalidatePath alone
 * isn't enough: it's tied to the request, and Next.js settles a request's
 * revalidations when the route returns its response, before a streamed answer
 * has run. The agent publishes in the middle of one, so its publishes never
 * reached the live pages.
 */

// Next.js's default cache (a CommonJS module: the class is its `default`).
import fileSystemCache from "next/dist/server/lib/incremental-cache/file-system-cache.js";

const FileSystemCache = fileSystemCache.default;

const started = Date.now();
/** When something was last published, set by cms/hooks.ts in the same server process. */
const PUBLISHED_AT = Symbol.for("jomiez.pages.publishedAt");
/** A page that started rendering just before a publish can finish just after it, with the old content. */
const IN_FLIGHT = 5_000;

export default class PageCache extends FileSystemCache {
  async get(key, ctx) {
    const entry = await super.get(key, ctx);
    if (!entry || typeof entry.lastModified !== "number") return entry;
    const published = globalThis[PUBLISHED_AT];
    const outOfDate = entry.lastModified < started || (typeof published === "number" && entry.lastModified < published + IN_FLIGHT);
    return outOfDate ? null : entry;
  }
}
