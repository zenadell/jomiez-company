import type { Payload } from "payload";

/*
 * An email Keeper writes, put right before anyone approves or sends it, with
 * no model:
 * - to a business that has a preview, the preview's link is in it (a model
 *   happily says "I made a homepage for you" and forgets the link);
 * - the sign-off gives the company email, not a phone number (the owner's
 *   rule: always the company's email).
 * The approval card shows the finished email, so what's approved is what's sent.
 */

const CLOSING = /^\s*(best|best wishes|all the best|kind regards|warm regards|regards|warmly|thanks|thank you|many thanks|cheers|sincerely|speak soon|talk soon|yours)\b[^\n]*$/im;
const PHONE = /(?:\+|\b0)\d[\d\s().-]{6,}\d\b/g;

/** Where the sign-off starts: its closing line ("Best,", "Kind regards"), else the last paragraph. */
function signOffStart(body: string): number {
  const tail = Math.max(0, body.length - 400);
  let at = -1;
  for (const m of body.slice(tail).matchAll(new RegExp(CLOSING.source, "gim"))) at = tail + (m.index ?? 0);
  if (at >= 0) return at;
  const lastBreak = body.trimEnd().lastIndexOf("\n\n");
  return lastBreak >= 0 ? lastBreak + 2 : body.length;
}

export function finishEmail(body: string, opts: { previewUrl?: string | null; companyEmail?: string | null }): { body: string; changes: string[] } {
  const changes: string[] = [];
  let out = body.replace(/\r\n/g, "\n");

  // The sign-off: a phone number becomes the company email (or goes, when the email is already there).
  if (opts.companyEmail) {
    const start = signOffStart(out);
    let sign = out.slice(start);
    if (PHONE.test(sign)) {
      const has = sign.toLowerCase().includes(opts.companyEmail.toLowerCase());
      let first = !has;
      // Only the lines with a number change: the number becomes the email (once), or goes with its separator.
      sign = sign
        .split("\n")
        .map((line) => {
          if (!new RegExp(PHONE.source).test(line)) return line;
          const next = line
            .replace(new RegExp(PHONE.source, "g"), () => {
              if (!first) return "";
              first = false;
              return opts.companyEmail!;
            })
            .replace(/([ \t]*[,·|–-][ \t]*)+$/, "")
            .replace(/^[ \t]*[,·|–-][ \t]*/, "")
            .replace(/([ \t]*[·|][ \t]*){2,}/g, " · ");
          return next.trim() ? next : null;
        })
        .filter((line): line is string => line !== null)
        .join("\n");
      out = out.slice(0, start) + sign;
      changes.push(has ? "removed the phone number from the sign-off (the company email is there)" : `signed off with ${opts.companyEmail} instead of a phone number`);
    }
    PHONE.lastIndex = 0;
  }

  // The preview's link, once, just before the sign-off.
  if (opts.previewUrl) {
    const path = opts.previewUrl.replace(/^https?:\/\/(www\.)?/, "");
    if (!out.includes(path)) {
      const start = signOffStart(out);
      const before = out.slice(0, start).trimEnd();
      out = `${before}\n\nHere's the homepage I made for you: ${opts.previewUrl}\n\n${out.slice(start).trimStart()}`;
      changes.push("added the link to their preview");
    }
  }
  return { body: out, changes };
}

/** A preview's public address (as cms/outreach/write.ts previewLink; kept here so the agent's tools don't import the writer). */
export const previewUrlOf = (slug: string) => `${(process.env.NEXT_PUBLIC_SERVER_URL || "https://www.jomiez.com").replace(/\/$/, "")}/preview/${slug}`;

/** The company's email (Site settings → Contact). */
export async function companyEmailOf(payload: Payload): Promise<string | null> {
  const s = (await payload.findGlobal({ slug: "site", depth: 0, overrideAccess: true }).catch(() => null)) as { email?: string } | null;
  return s?.email?.trim() || null;
}

type LeadLite = { id: number; name: string; email?: string | null; website?: string | null; domain?: string | null; preview?: { slug?: string; url?: string } | null };

/** The lead an email is going to: by id, else by its address or its domain. */
export async function leadFor(payload: Payload, to: string, leadId?: number | string | null): Promise<LeadLite | null> {
  if (leadId != null && leadId !== "") {
    const l = await payload.findByID({ collection: "leads", id: Number(leadId), depth: 0, overrideAccess: true }).catch(() => null);
    if (l) return l as unknown as LeadLite;
  }
  const address = to.trim().toLowerCase();
  const domain = address.split("@")[1] ?? "";
  const { docs } = await payload.find({ collection: "leads", where: { email: { equals: address } }, limit: 1, depth: 0, overrideAccess: true });
  if (docs[0]) return docs[0] as unknown as LeadLite;
  if (!domain || /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|aol|proton(mail)?)\./.test(domain)) return null;
  const byDomain = await payload.find({ collection: "leads", where: { or: [{ domain: { equals: domain } }, { website: { contains: domain } }] }, limit: 1, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }));
  return (byDomain.docs[0] as unknown as LeadLite) ?? null;
}
