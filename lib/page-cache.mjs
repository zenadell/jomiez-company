/*
 * The site's page cache: Next.js's own (pages kept on disk and in memory),
 * except that a page saved before this server started is never served.
 *
 * Render resets the disk on every restart and deploy (the free plan restarts
 * after 15 minutes without visitors), which puts back the pages as they were
 * at the last build. Next.js keeps its record of what was published since only
 * in memory, so it would serve those old pages as if nothing had changed. With
 * this, each page is rendered from the database on its first visit after a
 * start, then cached as usual until the next publish.
 */

// Next.js's default cache (a CommonJS module: the class is its `default`).
import fileSystemCache from "next/dist/server/lib/incremental-cache/file-system-cache.js";

const FileSystemCache = fileSystemCache.default;

const started = Date.now();

export default class PageCache extends FileSystemCache {
  async get(key, ctx) {
    const entry = await super.get(key, ctx);
    return entry && typeof entry.lastModified === "number" && entry.lastModified < started ? null : entry;
  }
}
