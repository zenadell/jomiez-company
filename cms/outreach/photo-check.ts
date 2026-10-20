import sharp from "sharp";
import { see, type Sight } from "../agent/eyes";

/*
 * A look at a photo before it goes on a preview. Free photo searches return
 * shop flyers, adverts with prices and phone numbers printed over them, and
 * photos of the wrong kind of business; a business's own site often has
 * flyers among its pictures too. One of those as the hero makes the whole
 * preview look cheap, so each candidate is shown to a vision model (Gemini
 * first, as everywhere: cheap and good at it) and used only on a clear yes.
 *
 * true: use it. false: don't. null: couldn't look (no model that sees, or it
 * failed); the caller decides what an unchecked photo is worth.
 */
export async function photoFits(sight: Sight | undefined, img: { data: Buffer }, what: string): Promise<boolean | null> {
  if (!sight || (!sight.geminiKey && !sight.main)) return null;
  // A small copy is plenty to judge, and cheap to send.
  const small = await sharp(img.data).rotate().resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer().catch(() => null);
  if (!small) return null;
  const question = `This photograph may go on the homepage of ${what}. Reply with YES or NO alone on the first line, then one short reason.
Say NO if any of these is true: there is printed text, a price, a phone number, a website address, another brand's logo, a watermark or a promotional banner over the picture; it is a flyer, poster, menu board, screenshot, collage or graphic rather than a photograph; it is blurry, very dark, tiny or badly cropped; it shows something that doesn't fit ${what} (another kind of business, the wrong subject, people who obviously aren't its customers).
Say YES only for a clean, well-lit, professional-looking photograph that would make ${what} look good.`;
  try {
    const answer = await see(sight, [{ data: small, type: "image/jpeg" }], question, { exact: true });
    const first = answer.trim().split("\n")[0] ?? "";
    if (/^\W*yes\b/i.test(first)) return true;
    if (/^\W*no\b/i.test(first)) return false;
    return null;
  } catch {
    return null;
  }
}
