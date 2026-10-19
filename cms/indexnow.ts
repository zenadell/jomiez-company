import { createHmac } from "node:crypto";
import type { Payload } from "payload";

/*
 * IndexNow (indexnow.org): when a page, product or post is published, Bing,
 * Yandex, Seznam, Naver and the answer engines built on Bing's index (Copilot,
 * ChatGPT search, DuckDuckGo) are told at once, instead of finding the change
 * on their next crawl. Google doesn't take part; it reads the sitemap.
 *
 * The key is derived from PAYLOAD_SECRET (so it needs no setting) and served at
 * /indexnow-key.txt, which is how the search engines check the ping is ours.
 * Only the live site pings: never development, a preview build, or a site whose
 * address isn't a public https one. INDEXNOW=off turns it off.
 */

export function indexNowKey(): string | null {
  const secret = process.env.PAYLOAD_SECRET;
  return secret ? createHmac("sha256", secret).update("jomiez:indexnow").digest("hex").slice(0, 32) : null;
}

export function indexNowEnabled(siteUrl: string) {
  if (process.env.INDEXNOW === "off" || process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return false;
  try {
    const u = new URL(siteUrl);
    return u.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.)|\.local$|onrender\.com$/.test(u.hostname);
  } catch {
    return false;
  }
}

/** Tells the search engines these addresses changed. Never throws, never holds up a save. */
export async function notifyIndexNow(payload: Payload, paths: string[]): Promise<{ sent: number } | null> {
  const key = indexNowKey();
  if (!key || !paths.length) return null;
  const site = (await payload.findGlobal({ slug: "site", depth: 0, overrideAccess: true }).catch(() => null)) as { url?: string } | null;
  const base = (site?.url || "").replace(/\/$/, "");
  if (!base || !indexNowEnabled(base)) return null;
  const urlList = [...new Set(paths.map((p) => `${base}${p === "/" ? "" : p}`))].slice(0, 100);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/indexnow-key.txt`, urlList }),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 and 202 are both "received"; anything else is logged, not raised.
    if (res.status !== 200 && res.status !== 202) payload.logger.warn({ msg: `IndexNow answered ${res.status} for ${urlList.join(", ")}` });
    return { sent: urlList.length };
  } catch (err) {
    payload.logger.warn({ err, msg: "IndexNow couldn't be reached" });
    return null;
  }
}
