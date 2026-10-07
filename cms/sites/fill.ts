import type { LanguageModel } from "ai";
import { z } from "zod";
import { ask } from "../outreach/write";
import { aethron, type Answer } from "./aethron";

/*
 * Writing a business's own words into a template, through Aethron. Aethron
 * hands over the template's lines 40 at a time (text, then pictures, then
 * links); each batch is one short call to the writing model, so the cost stays
 * the same however long the conversation that asked for it, and a dropped
 * connection loses one batch, not the whole page. Aethron refuses anything that
 * would break the page (too long for its slot, a script); refused lines are
 * shortened once, then left as the template had them.
 */

export type Line = { old: string; new?: string | null; max_bytes?: number | null; brand_notes?: unknown };
export type Facts = {
  text: string;
  photos: { url: string; alt?: string }[];
  logo: string | null;
  links: { label: string; url: string }[];
};

/** The lines in an Aethron answer, whatever it wrapped them in. */
export function linesOf(a: Answer): Line[] {
  const isLine = (x: unknown): x is Line => Boolean(x && typeof x === "object" && typeof (x as Line).old === "string");
  const look = (d: unknown, depth = 0): Line[] | null => {
    if (Array.isArray(d)) return d.every(isLine) ? d : null;
    if (!d || typeof d !== "object" || depth > 2) return null;
    for (const v of Object.values(d as Record<string, unknown>)) {
      const found = look(v, depth + 1);
      if (found && found.length) return found;
    }
    return Array.isArray((d as { entries?: unknown }).entries) ? [] : null;
  };
  return look(a.data) ?? [];
}

/** Which entries Aethron refused, and why. */
export function refusedOf(a: Answer): { old: string; reason: string }[] {
  const look = (d: unknown, depth = 0): { old: string; reason: string }[] => {
    if (!d || typeof d !== "object" || depth > 3) return [];
    for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
      if (/reject|refus|error|fail/i.test(k) && Array.isArray(v)) {
        return v
          .filter((x) => x && typeof x === "object" && typeof (x as { old?: unknown }).old === "string")
          .map((x) => ({ old: (x as { old: string }).old, reason: String((x as { reason?: unknown; error?: unknown }).reason ?? (x as { error?: unknown }).error ?? "refused") }));
      }
      const deeper = look(v, depth + 1);
      if (deeper.length) return deeper;
    }
    return [];
  };
  return look(a.data);
}

const bytes = (s: string) => Buffer.byteLength(s, "utf8");

/** Fits text into a byte limit at a word boundary, without the characters Aethron refuses. */
export function tidy(text: string, max?: number | null) {
  let t = text.replace(/`/g, "'").replace(/\$\{/g, "$ {").replace(/\s+/g, " ").trim();
  if (max && max > 0 && bytes(t) > max) {
    while (bytes(t) > max) t = t.slice(0, Math.max(0, t.length - Math.max(1, Math.ceil((bytes(t) - max) / 2))));
    const at = t.lastIndexOf(" ");
    if (at > t.length * 0.6) t = t.slice(0, at);
    t = t.replace(/[,;:\s–-]+$/, "");
  }
  return t;
}

const Out = z.object({ entries: z.array(z.object({ old: z.string(), new: z.string() })) });

const RULES = `You put a real business's own words into a website template made by a designer, one line at a time, so the template becomes their site. Keep the template's tone and the length of each line (a 3-word button stays about 3 words; a heading stays a heading).
- Use only the facts given. Never invent reviews, testimonials, ratings, customer counts, years in business, awards, prices, staff names or opening hours.
- A line that is a customer quote or testimonial: replace it with a short, honest line such as "Your customers' reviews will appear here." and its author with "A customer" (only real reviews, if given, may be used).
- A line that is a number or statistic you don't know: replace it with a short true phrase that fits the slot (e.g. "Made to order", "Lagos-wide"), never a made-up number.
- Navigation words, form labels and legal words (Home, About, Contact, Submit, Privacy) stay as they are, unless a better plain word fits the business.
- Words that sell the template itself (Buy template, Get this template, Use for free, Remix, Made in Framer, Made in Webflow) become the business's main action, e.g. "Chat with us" or "Call us".
- Names of the template's own brand become the business's name. Email addresses, phone numbers and addresses become the business's, or stay generic if they have none.
- No backticks and no "\${" anywhere.
Give back every line you were sent, in the same order, with "old" copied exactly and "new" the line to show.`;

async function batch(model: LanguageModel, section: "strings" | "images" | "links", lines: Line[], facts: Facts, extra = "") {
  if (section === "images") {
    const list = [facts.logo ? `LOGO: ${facts.logo}` : "", ...facts.photos.map((p, i) => `PHOTO ${i + 1}: ${p.url}${p.alt ? ` (${p.alt})` : ""}`)].filter(Boolean).join("\n");
    const prompt = `${facts.text}\n\nTHEIR PICTURES (use only these addresses):\n${list || "none"}\n\nTEMPLATE PICTURES (old = the template's picture; new = one of their pictures that fits the same place, or the same old address to keep the template's picture; use the logo only where the template shows a logo; use each of their photos at most twice):\n${JSON.stringify(lines.map((l) => ({ old: l.old, notes: l.brand_notes })))}`;
    return ask(model, `${RULES}\nHere the lines are pictures.${extra}`, prompt, Out);
  }
  if (section === "links") {
    const list = facts.links.map((l) => `${l.label}: ${l.url}`).join("\n");
    const prompt = `${facts.text}\n\nTHEIR LINKS (use only these):\n${list || "none"}\n\nTEMPLATE LINKS (old = the template's link; new = the business's link for the same purpose (call, WhatsApp, email, map, their social pages), or the same old address to keep it; links between the template's own pages always stay as they are):\n${JSON.stringify(lines.map((l) => ({ old: l.old, notes: l.brand_notes })))}`;
    return ask(model, `${RULES}\nHere the lines are link addresses.${extra}`, prompt, Out);
  }
  const prompt = `${facts.text}\n\nTEMPLATE LINES (max_bytes = the most UTF-8 bytes the new line may use; notes = what Aethron knows about the business for that line):\n${JSON.stringify(lines.map((l) => ({ old: l.old, max_bytes: l.max_bytes ?? undefined, notes: l.brand_notes ?? undefined })))}`;
  return ask(model, `${RULES}${extra}`, prompt, Out);
}

/**
 * Fills a preview's lines with the business's own words, pictures and links.
 * Returns what was done, for the conversation (and the owner) to see.
 */
export async function fillPreview(opts: { project: string; facts: Facts; model: LanguageModel; progress?: (text: string) => void }) {
  const { project, facts, model } = opts;
  const allowedUrls = new Set([...(facts.logo ? [facts.logo] : []), ...facts.photos.map((p) => p.url), ...facts.links.map((l) => l.url)]);
  const done = { written: 0, kept: 0, refused: 0, batches: 0, notes: [] as string[] };

  for (const section of ["strings", "images", "links"] as const) {
    if (section === "images" && !facts.photos.length && !facts.logo) continue;
    // Lines Aethron listed as unfilled drop out of the list once written (kept ones too, sent back unchanged),
    // so offset 0 is always the next batch. Offset only moves past lines already tried that are still listed.
    let offset = 0;
    const tried = new Set<string>();
    for (let round = 0; round < 80; round++) {
      const page = await aethron("get_content", { project, section, only_unfilled: true, limit: 40, offset });
      if (!page.ok) {
        done.notes.push(`Reading the ${section}: ${page.text.slice(0, 300)}`);
        break;
      }
      const listed = linesOf(page);
      if (!listed.length) break;
      const lines = listed.filter((l) => !tried.has(l.old));
      if (!lines.length) {
        offset += listed.length;
        continue;
      }
      for (const l of lines) tried.add(l.old);
      opts.progress?.(`Writing their ${section === "strings" ? "words" : section === "images" ? "pictures" : "links"} into the template (${done.batches + 1})…`);

      let written: z.infer<typeof Out>;
      try {
        written = await batch(model, section, lines, facts);
      } catch (err) {
        done.notes.push(`A batch of ${section} couldn't be written (${(err as Error).message.slice(0, 160)}); left as the template had it.`);
        continue;
      }
      done.batches++;
      const byOld = new Map(written.entries.map((e) => [e.old, e.new]));
      const entries = lines.map((l) => {
        let next = byOld.get(l.old) ?? l.old;
        if (section === "strings") next = tidy(next, l.max_bytes);
        // Pictures and links may only become the business's own addresses (or stay as they were).
        else if (next !== l.old && !allowedUrls.has(next)) next = l.old;
        if (/^\s*javascript:/i.test(next)) next = l.old;
        if (next === l.old) done.kept++;
        else done.written++;
        return { old: l.old, new: next, section };
      });
      const sent = await aethron("set_content_bulk", { project, entries, build: false });
      if (!sent.ok) {
        done.notes.push(`Saving a batch: ${sent.text.slice(0, 300)}`);
        continue;
      }
      const refused = refusedOf(sent);
      if (refused.length) {
        // One more try, shorter; then the template's own words stay.
        const retry = lines.filter((l) => refused.some((r) => r.old === l.old));
        const reasons = refused.map((r) => `${r.old.slice(0, 60)}: ${r.reason}`).join("\n");
        let fixed: { old: string; new: string; section: typeof section }[] = retry.map((l) => ({ old: l.old, new: l.old, section }));
        if (section === "strings") {
          try {
            const again = await batch(model, section, retry, facts, `\nThese lines were refused, for these reasons; write them again, shorter and plainer:\n${reasons}`);
            const m = new Map(again.entries.map((e) => [e.old, e.new]));
            fixed = retry.map((l) => ({ old: l.old, new: tidy(m.get(l.old) ?? l.old, l.max_bytes ? Math.floor(l.max_bytes * 0.9) : null), section }));
          } catch {
            // keep the template's words
          }
        }
        const second = await aethron("set_content_bulk", { project, entries: fixed, build: false });
        const still = second.ok ? refusedOf(second) : retry.map((l) => ({ old: l.old, reason: second.text }));
        if (still.length) {
          done.refused += still.length;
          await aethron("set_content_bulk", { project, entries: still.map((r) => ({ old: r.old, new: r.old, section })), build: false });
        }
      }
    }
  }
  return done;
}
