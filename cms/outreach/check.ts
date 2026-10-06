import type { Payload } from "payload";
import sharp from "sharp";
import { canSee, see, serviceShot, type Sight } from "../agent/eyes";
import { PHONE_UA, outline, safeFetch } from "../agent/web";
import { looksMobile } from "./kinds";

/*
 * Checking a business's website the way a customer meets it: on a phone. Two
 * layers, both free:
 * - Its own quick check (always): does it open, is it secure, is it made for
 *   phones, can Google read it, is it dated, can you call or WhatsApp from it.
 * - Google PageSpeed (with a free key): speed and Google scores on a phone,
 *   plus a screenshot, which Keeper looks at for what a person would notice.
 * Every finding is something that was actually measured or seen, so the
 * message built from it never claims a problem that isn't there.
 */

export type Finding = { id: string; text: string; weight: 1 | 2 | 3 };

export type CheckResult = {
  at: string;
  /** unreachable: it turned the check away (a bot shield, or no answer), so nothing is known. */
  kind: "none" | "broken" | "unreachable" | "basic" | "pagespeed";
  url?: string;
  scores?: { performance?: number; seo?: number; accessibility?: number; bestPractices?: number };
  metrics?: { lcpMs?: number; loadMs?: number };
  findings: Finding[];
  /** What their site says (for writing the preview in their own words). */
  site?: { title: string; description: string; headings: string[]; text: string };
  /** From the map listing: opening hours, cuisine… */
  facts?: Record<string, string>;
  pagespeedError?: string;
};

const year = () => new Date().getFullYear();

const PARKED = /domain (is )?for sale|buy this domain|this domain (name )?(is|may be) (for sale|parked)|parked (free|domain)|coming soon|under construction|under maintenance|maintenance mode|we.?ll be back soon|be right back|account (has been )?suspended|default (web )?(site|server) page|index of \/|website is (currently )?(down|unavailable)|future home of/i;

/**
 * The quick check: one request for the homepage, as a phone's browser, read
 * like a careful person would. A site is only called broken when that's
 * certain (its address doesn't exist, it refuses connections, or it answers
 * with an error twice). A site that turns automated visitors away (a bot
 * shield, or no answer in time) is "couldn't check": nothing is claimed.
 */
export async function basicCheck(address: string): Promise<{ result: Omit<CheckResult, "at" | "facts">; html?: string }> {
  const get = () => safeFetch(address, { timeoutMs: 20_000, maxBytes: 2_500_000, userAgent: PHONE_UA });
  const started = Date.now();
  let res: Awaited<ReturnType<typeof safeFetch>> | null = null;
  let problem = "";
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 3000));
    try {
      res = await get();
      if (res.status >= 500 || res.status === 404 || res.status === 410) {
        problem = `error ${res.status}`;
        if (attempt === 0) res = null; // once more, in case it was a blip
      }
    } catch (err) {
      problem = (err as Error).message || "error";
      // A name that doesn't exist or a refused connection won't change in three seconds.
      if (/ENOTFOUND|ECONNREFUSED/i.test(problem)) break;
    }
  }
  if (!res) {
    if (/ENOTFOUND/i.test(problem)) return { result: { kind: "broken", url: address, findings: [{ id: "down", text: "Their website's address doesn't work any more, so anyone who searches for them finds nothing.", weight: 3 }] } };
    if (/ECONNREFUSED/i.test(problem)) return { result: { kind: "broken", url: address, findings: [{ id: "down", text: "Their website couldn't be opened (the server refuses visitors), so anyone who searches for them finds nothing.", weight: 3 }] } };
    return { result: { kind: "unreachable", url: address, findings: [] } };
  }
  if (res.shield || [401, 403, 406, 429, 503].includes(res.status)) return { result: { kind: "unreachable", url: res.url, findings: [] } };
  if (res.status >= 400) {
    return { result: { kind: "broken", url: res.url, findings: [{ id: "down", text: `Their website shows an error page (${res.status}) instead of the business.`, weight: 3 }] } };
  }
  const loadMs = Date.now() - started;
  const html = res.body.toString("utf8");
  if (res.status >= 400) {
    return { result: { kind: "broken", url: res.url, findings: [{ id: "down", text: `Their website shows an error page (${res.status}) instead of the business.`, weight: 3 }] } };
  }
  const page = outline(html, 4000);
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);
  if (PARKED.test(`${page.title} ${page.text.slice(0, 800)}`) && page.text.length < 3000) {
    add({ id: "parked", text: "Their website shows only a holding page (“under maintenance”, “coming soon” or parked), not the business.", weight: 3 });
    return { result: { kind: "broken", url: res.url, findings, site: { title: page.title, description: page.description, headings: page.headings.slice(0, 10), text: page.text.slice(0, 1500) } } };
  }
  if (new URL(res.url).protocol === "http:") add({ id: "https", text: "The site isn't secure (no padlock), so phones warn visitors it's “Not secure”.", weight: 2 });
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) add({ id: "viewport", text: "It isn't made for phones: on a phone the page shows tiny, zoomed-out text.", weight: 3 });
  const title = page.title.trim();
  if (!title || title.length < 8 || /^(home|index|untitled|welcome|just another wordpress site)$/i.test(title)) add({ id: "title", text: `Its title on Google is ${title ? `just “${title}”` : "missing"}, so it's hard to find in search.`, weight: 2 });
  if (!page.description.trim()) add({ id: "description", text: "There's no description for Google, so search results show random text from the page.", weight: 1 });
  if (!page.headings.some((h) => h.startsWith("# "))) add({ id: "heading", text: "The page has no main heading saying what the business does.", weight: 1 });
  const copy = html.match(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2}|19\d{2})/i);
  if (copy && Number(copy[1]) < year() - 1) add({ id: "dated", text: `It looks out of date: the footer still says © ${copy[1]}.`, weight: 2 });
  if (/lorem ipsum/i.test(page.text)) add({ id: "placeholder", text: "Placeholder text (“lorem ipsum”) is still on the page.", weight: 3 });
  if (/just another wordpress site|my wordpress blog|hello world!/i.test(html)) add({ id: "template", text: "Template leftovers (“Just another WordPress site”, “Hello world!”) are still showing.", weight: 2 });
  const hrefs = page.links.map((l) => l.href);
  if (!hrefs.some((h) => /^tel:|wa\.me|whatsapp\.com|api\.whatsapp/i.test(h))) add({ id: "contact", text: "There's no button to call or WhatsApp them from a phone.", weight: 2 });
  const noAlt = page.images.filter((i) => !i.alt.trim()).length;
  if (noAlt >= 4) add({ id: "alt", text: `${noAlt} images have no description, which Google and screen readers rely on.`, weight: 1 });
  if (loadMs > 4000) add({ id: "slow", text: `The page took ${(loadMs / 1000).toFixed(1)} seconds just to start arriving.`, weight: 2 });
  return {
    result: {
      kind: "basic",
      url: res.url,
      metrics: { loadMs },
      findings,
      site: { title, description: page.description, headings: page.headings.slice(0, 10), text: page.text.slice(0, 1500) },
    },
    html,
  };
}

type Audit = { score?: number | null; numericValue?: number; details?: { data?: string } };
type Psi = { lighthouseResult?: { finalDisplayedUrl?: string; categories?: Record<string, { score?: number | null }>; audits?: Record<string, Audit> } };

const PSI_FIELDS =
  "lighthouseResult(finalDisplayedUrl,categories(performance/score,seo/score,accessibility/score,best-practices/score),audits(largest-contentful-paint/numericValue,viewport/score,document-title/score,meta-description/score,is-crawlable/score,is-on-https/score,font-size/score,final-screenshot/details/data))";

/** Google PageSpeed on a phone: scores, the main measurements and a screenshot. */
export async function pagespeed(address: string, key: string) {
  const call = async (fields: boolean) => {
    const q = new URLSearchParams({ url: address, strategy: "mobile", key });
    for (const c of ["performance", "seo", "accessibility", "best-practices"]) q.append("category", c);
    if (fields) q.set("fields", PSI_FIELDS);
    return fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(90_000) });
  };
  let res = await call(true);
  if (res.status === 400) res = await call(false); // in case Google stops accepting the field list
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(res.status === 429 ? "Google PageSpeed's daily allowance is used up for this key." : `Google PageSpeed couldn't check it (${res.status}${body?.error?.message ? `: ${body.error.message.slice(0, 140)}` : ""}).`);
  }
  const lh = ((await res.json()) as Psi).lighthouseResult ?? {};
  const pct = (v?: number | null) => (typeof v === "number" ? Math.round(v * 100) : undefined);
  const c = lh.categories ?? {};
  const a = lh.audits ?? {};
  const shot = a["final-screenshot"]?.details?.data;
  return {
    url: lh.finalDisplayedUrl,
    scores: { performance: pct(c.performance?.score), seo: pct(c.seo?.score), accessibility: pct(c.accessibility?.score), bestPractices: pct(c["best-practices"]?.score) },
    lcpMs: a["largest-contentful-paint"]?.numericValue,
    failed: (id: string) => a[id]?.score === 0,
    shot: shot?.startsWith("data:image/") ? Buffer.from(shot.split(",")[1] ?? "", "base64") : null,
  };
}

/** How much a new website would help (0–85) plus how easy they are to reach (0–15). */
export function scoreOf(check: Pick<CheckResult, "kind" | "findings" | "scores">, lead: { phone?: string | null; email?: string | null }): number {
  const reach = lead.phone ? (looksMobile(lead.phone) ? 15 : 10) : lead.email ? 6 : 0;
  if (!reach) return 0;
  let need: number;
  if (check.kind === "none") need = 70;
  else if (check.kind === "broken") need = 80;
  else {
    const weight = check.findings.reduce((n, f) => n + f.weight, 0);
    need = Math.min(85, 8 + weight * 7);
    const s = check.scores;
    const parts = [s?.performance, s?.seo, s?.accessibility, s?.bestPractices].filter((v): v is number => typeof v === "number");
    if (parts.length) need = Math.max(need, Math.round((100 - parts.reduce((x, y) => x + y, 0) / parts.length) * 0.85));
  }
  return Math.max(0, Math.min(100, Math.round(need + reach)));
}

/** A small phone-sized picture of their site, kept with the lead (≈15 KB). */
async function thumb(img: Buffer) {
  const small = await sharp(img).resize({ width: 300, height: 650, fit: "cover", position: "top" }).jpeg({ quality: 58 }).toBuffer();
  return `data:image/jpeg;base64,${small.toString("base64")}`;
}

export type CheckEnv = { sight?: Sight; pagespeedKey?: string; ownOrigin: string };

/** Checks one lead's website, scores the lead and saves it all on the lead. */
export async function checkLead(payload: Payload, id: number | string, env: CheckEnv) {
  const lead = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
  const facts = ((lead.check as CheckResult | null)?.facts ?? {}) as Record<string, string>;
  let result: CheckResult;
  let shot: Buffer | null = null;
  let review = "";
  const website = typeof lead.website === "string" && lead.website ? lead.website : null;

  if (!website) {
    const socials = String(lead.socials ?? "");
    result = {
      at: new Date().toISOString(),
      kind: "none",
      facts,
      findings: [
        {
          id: "nosite",
          text: socials
            ? "They have no website of their own, only social media pages, so people searching on Google don't find them."
            : "They have no website, so people searching on Google for what they do don't find them.",
          weight: 3,
        },
      ],
    };
  } else {
    const { result: basic } = await basicCheck(website);
    result = { ...basic, at: new Date().toISOString(), facts };
    // PageSpeed visits from Google, so it often gets through where our own visit was turned away.
    if (basic.kind !== "broken" && env.pagespeedKey) {
      try {
        const ps = await pagespeed(basic.url ?? website, env.pagespeedKey);
        shot = ps.shot;
        result.kind = "pagespeed";
        result.scores = ps.scores;
        result.metrics = { ...result.metrics, lcpMs: ps.lcpMs };
        const have = new Set(result.findings.map((f) => f.id));
        const perf = ps.scores.performance;
        if (typeof perf === "number" && perf < 75) {
          const secs = ps.lcpMs ? ` about ${(ps.lcpMs / 1000).toFixed(1)} seconds to show its main content` : " a long time to load";
          result.findings.unshift({ id: "speed", text: `On a phone it takes${secs} (Google's speed score: ${perf}/100). Many visitors leave before then.`, weight: perf < 50 ? 3 : 2 });
        }
        if (typeof ps.scores.seo === "number" && ps.scores.seo < 80 && !have.has("title")) result.findings.push({ id: "seo", text: `Google rates how well it can read the site ${ps.scores.seo}/100.`, weight: 2 });
        if (ps.failed("viewport") && !have.has("viewport")) result.findings.push({ id: "viewport", text: "It isn't made for phones: on a phone the page shows tiny, zoomed-out text.", weight: 3 });
        if (ps.failed("font-size") && !have.has("viewport")) result.findings.push({ id: "font", text: "Much of the text is too small to read on a phone.", weight: 2 });
        if (ps.failed("is-crawlable")) result.findings.push({ id: "hidden", text: "The site tells Google not to list it, so it can't appear in search at all.", weight: 3 });
        if (typeof ps.scores.accessibility === "number" && ps.scores.accessibility < 70) result.findings.push({ id: "a11y", text: `It's hard to use for some people (accessibility ${ps.scores.accessibility}/100: contrast, labels, sizes).`, weight: 1 });
      } catch (err) {
        result.pagespeedError = (err as Error).message;
      }
    }
    // Without PageSpeed's screenshot, the free screenshot service (a small daily allowance).
    if (!shot && result.kind !== "broken" && result.kind !== "unreachable") {
      shot = await serviceShot(basic.url ?? website, { device: "phone", ownOrigin: env.ownOrigin }).catch(() => null);
    }
    if (shot && env.sight && canSee(env.sight)) {
      try {
        review = await see(
          env.sight,
          [{ data: shot, type: "image/jpeg" }],
          `This is the top of ${String(lead.name)}'s website (a ${String(lead.kind || "business")}) on a phone. You're a web designer deciding whether a new website would help them. In at most three short lines, name the clearest problems a customer would notice (for example text too small, cluttered or dated look, no clear button to call, book or order, broken images, a pop-up covering the page). If it looks modern and works well, say “Looks good:” and why, in one line.`,
        );
        // Without the note on which model looked (that's for the console, not for a lead's card).
        review = review.replace(/\n*\(Seen with [\s\S]*$/, "").replace(/\n{2,}/g, "\n").trim().slice(0, 700);
      } catch {
        review = "";
      }
    }
  }

  const score = scoreOf(result, { phone: lead.phone as string | null, email: lead.email as string | null });
  const summary =
    result.kind === "unreachable"
      ? "• Couldn't check their site: it turned the check away (a security shield, or no answer in time). Nothing is claimed about it; look at it yourself before writing."
      : result.findings.length
        ? result.findings.map((f) => `• ${f.text}`).join("\n")
        : "• Nothing obviously wrong: the site works on phones and Google can read it.";
  const what =
    result.kind === "none"
      ? "No website"
      : result.kind === "broken"
        ? "Website not working"
        : result.kind === "unreachable"
          ? "Couldn't check the website (it turned the check away)"
          : `Website checked${result.kind === "pagespeed" ? " with Google PageSpeed" : ""}: ${result.findings.length} problem${result.findings.length === 1 ? "" : "s"}`;
  const small = shot ? await thumb(shot).catch(() => null) : null;
  await payload.update({
    collection: "leads",
    id,
    data: {
      check: result,
      summary,
      review: review || null,
      shot: small && small.length < 120_000 ? small : null,
      score,
      status: lead.status === "new" ? "checked" : lead.status,
      log: [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what: `${what} (score ${score})` }],
    } as never,
    overrideAccess: true,
  });
  return { id, name: String(lead.name), score, kind: result.kind, findings: result.findings.map((f) => f.text), review: review || undefined, pagespeed: result.pagespeedError ?? (result.kind === "pagespeed" ? "used" : "not used") };
}
