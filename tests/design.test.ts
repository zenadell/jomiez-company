/*
 * The design library for homepage previews (cms/outreach/design): the
 * library is complete and readable, each kind of business is offered fitting
 * directions, the copy check catches the giveaways of generated pages, old
 * previews open in the new design, and making a preview goes through the
 * model's choice, the check and one rewrite. A throwaway database and a
 * scripted model; nothing reaches the network.
 *
 *   npm run test:design
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "jomiez-design-"));
process.env.DATABASE_URI = `file:${path.join(dir, "test.db")}`;
process.env.PAYLOAD_SECRET ||= "test-secret-for-the-design-test-only-0123456789";
process.env.AGENT_CLOCK = "off";
delete process.env.PEXELS_API_KEY;

const { DIRECTIONS, PALETTES, TYPES, byId, fontLinks } = await import("../cms/outreach/design/library");
const { directionsFor, settle } = await import("../cms/outreach/design/choose");
const { problems, tidy } = await import("../cms/outreach/design/lint");
const { readPreview } = await import("../cms/outreach/preview-content");

let failed = 0;
let passed = 0;
function check(name: string, ok: unknown, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${!ok && detail !== undefined ? `  → ${JSON.stringify(detail)}` : ""}`);
}

/* ---------- The library ---------- */

const missing = DIRECTIONS.flatMap((d) => [...d.types.filter((t) => !byId.type(t)).map((t) => `${d.id}: type ${t}`), ...d.palettes.filter((p) => !byId.palette(p)).map((p) => `${d.id}: palette ${p}`)]);
check("every type system and palette a direction names exists", missing.length === 0, missing);
check("ids are unique", new Set(TYPES.map((t) => t.id)).size === TYPES.length && new Set(PALETTES.map((p) => p.id)).size === PALETTES.length);

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const unreadable = PALETTES.filter((p) => ratio(p.ink, p.bg) < 4.5).map((p) => `${p.id} ${ratio(p.ink, p.bg).toFixed(2)}`);
check("every palette's text reads on its ground (WCAG AA, 4.5:1)", unreadable.length === 0, unreadable);
const weakButtons = PALETTES.filter((p) => ratio(p.accentInk, p.accent) < 3).map((p) => `${p.id} ${ratio(p.accentInk, p.accent).toFixed(2)}`);
check("every palette's button text reads on its accent (3:1 for large text)", weakButtons.length === 0, weakButtons);
const links = TYPES.flatMap((t) => fontLinks(t));
check("every type system loads from Google Fonts or Fontshare", links.length >= TYPES.length && links.every((l) => /^https:\/\/(fonts\.googleapis\.com\/css2\?|api\.fontshare\.com\/v2\/css\?)/.test(l)), links.slice(0, 3));
check("a Google pairing loads both faces in one request", fontLinks(byId.type("anton")!).length === 1 && fontLinks(byId.type("anton")!)[0].includes("family=Anton") && fontLinks(byId.type("anton")!)[0].includes("family=Work+Sans"));

/* ---------- Which directions fit which business ---------- */

const first = (kind: string, photos = 3, products = 0) => directionsFor(kind, { photos, products })[0];
check("a hair salon gets the monument first", first("hair salon") === "monument", directionsFor("hair salon", { photos: 3, products: 0 }));
check("a dental clinic gets the split stage first", first("dental clinic") === "split");
check("a gym gets the poster first", first("gym") === "poster");
check("a restaurant gets the place first", first("restaurant") === "place");
check("a restaurant and bar is a place to eat, not a bar", first("restaurant and bar") === "place");
check("a skin care clinic isn't mistaken for a car business", first("skin care clinic") === "split");
check("a car wash gets the poster", first("car wash") === "poster");
check("a shop with its own product photos gets the catalogue first", first("furniture shop", 2, 6) === "catalogue");
check("no product photos: never the catalogue", !directionsFor("furniture shop", { photos: 3, products: 1 }).includes("catalogue"));
check("one photo: never the place (it needs three)", !directionsFor("restaurant", { photos: 1, products: 0 }).includes("place"));
check("an unknown kind still gets something", directionsFor("", { photos: 0, products: 0 }).length > 0);

check("settle keeps a valid choice", JSON.stringify(settle("X", ["monument", "split"], { direction: "split", type: "literata", palette: "teal-paper" })) === JSON.stringify({ direction: "split", type: "literata", palette: "teal-paper" }));
const bad = settle("X", ["monument"], { direction: "poster" as never, type: "anton", palette: "nope" });
check("settle replaces a choice that wasn't offered", bad.direction === "monument" && byId.direction("monument")!.types.includes(bad.type) && byId.direction("monument")!.palettes.includes(bad.palette), bad);
check("settle is the same for the same business", JSON.stringify(settle("Glow Studio", ["monument"])) === JSON.stringify(settle("Glow Studio", ["monument"])));

/* ---------- The copy check ---------- */

const clean = {
  headline: "Hair that feels like you",
  sub: "Cuts, colour and braids on Admiralty Way, by stylists who listen first.",
  cta: "Book on WhatsApp",
  statement: "Glow Studio is a hair salon in Lekki for women who want healthy hair, done with care and on time.",
  services: [{ title: "Colour", text: "Rich colour that protects your hair." }],
  about: "A small salon on Admiralty Way where every appointment starts with a conversation.",
  highlights: [{ title: "On time", text: "Appointments start when they say they will." }],
  closing: "Your next appointment",
};
check("clean copy passes", problems(clean).length === 0, problems(clean));
const sloppy = { ...clean, headline: "Elevate Your Style With Our World-Class Seamless Salon Experience!", sub: "Not just a salon, it's an experience · Lekki · Lagos", cta: "Learn more", about: "We are AMAZING — truly — the best — ever." };
const found = problems(sloppy);
for (const [what, re] of [
  ["agency words", /"elevate"|"world-class"|"seamless"/],
  ["exclamation marks", /exclamation/],
  ["the long headline", /headline has \d+ words/],
  ['"not just X, it\'s Y"', /not just X/],
  ["middle-dot labels", /middle dots/],
  ["a CTA that says nothing", /says nothing/],
  ["shouting capitals", /capitals/],
  ["dashes everywhere", /dashes/],
] as const)
  check(`the check catches ${what}`, found.some((p) => re.test(p)), found);
const tidied = tidy({ ...clean, headline: "Hair That Feels Like You At Glow Studio!", sub: "Cuts — colour · braids!" }, ["Glow Studio"]);
check("tidy sets a title-case headline in sentence case, keeping their name", tidied.headline === "Hair that feels like you at Glow Studio", tidied.headline);
check("tidy removes exclamation marks, dashes and middle dots", tidied.sub === "Cuts, colour, braids.", tidied.sub);

/* ---------- Old previews open in the new design ---------- */

const v2 = { v: 2, name: "Iron Republic", kind: "gym", style: "bold", palette: "ember", eyebrow: "Gym · Ikeja", headline: "Train harder", headlineAccent: "harder", sub: "s", cta: "Call us", marquee: ["x"], statement: "st", services: [], about: "a", highlights: ["Fast"], closing: "c", brand: { photos: [], products: [], colours: [] }, stock: [{ url: "https://x/1.jpg", w: 1600, h: 1000, by: "a", source: "b", page: "c" }] };
const read = readPreview(v2);
check("a version 2 preview becomes version 3", read?.v === 3);
check("…its bold look becomes the poster", read?.design.direction === "poster", read?.design);
check("…with a palette made for the poster, from its old colour", byId.direction("poster")!.palettes.includes(read!.design.palette), read?.design);
check("…and the giveaways it carried are dropped", !("eyebrow" in (read as object)) && !("headlineAccent" in (read as object)));
const short = readPreview({ ...v2, v: 3, design: { direction: "place", type: "newsreader", palette: "walnut-tan" }, kind: "restaurant", stock: [v2.stock[0]] });
check("a place page whose photos didn't all arrive moves to a direction that fits", short?.design.direction !== "place" && byId.direction(short!.design.direction)!.types.includes(short!.design.type), short?.design);
check("a version 1 preview still opens", readPreview({ name: "Old", headline: "Old headline", kind: "hair salon" })?.design.direction === "split");

/* ---------- Making a preview: the model's choice, the check, one rewrite ---------- */

const { getPayload } = await import("payload");
const { MockLanguageModelV4 } = await import("ai/test");
const config = (await import("../payload.config")).default;
const { makePreview } = await import("../cms/outreach/write");
const payload = await getPayload({ config });

const realFetch = globalThis.fetch;
globalThis.fetch = (async () => new Response("offline in this test", { status: 503 })) as typeof fetch;

const answers = [
  // First: the sloppy version, choosing the place (not offered for a salon with no photos: settle must correct it).
  { direction: "monument", type: "gambarino", palette: "blush-aubergine", why: "A short soft name suits a monument.", headline: "Elevate Your Hair Journey Today!", sub: "Not just a salon, it's an experience.", cta: "Learn more", statement: "Glow Studio is a world-class salon offering seamless beauty experiences for every woman in Lekki.", services: [{ title: "Colour", text: "Rich colour." }, { title: "Braids", text: "Neat braids." }, { title: "Cuts", text: "Clean cuts." }], about: "Glow Studio is a small salon on Admiralty Way where every appointment starts with a conversation about your hair and what you want.", highlights: [{ title: "On time", text: "Appointments start on time." }, { title: "Gentle", text: "Kind to your edges." }], closing: "Book today!", photo: "hair salon interior" },
  // Then: the rewrite.
  { direction: "monument", type: "gambarino", palette: "blush-aubergine", why: "A short soft name suits a monument.", headline: "Hair that feels like you", sub: "Cuts, colour and braids on Admiralty Way, by stylists who listen first.", cta: "Book on WhatsApp", statement: "Glow Studio is a hair salon in Lekki for women who want healthy hair, done with care and on time.", services: [{ title: "Colour", text: "Rich colour that protects your hair." }, { title: "Braids", text: "Knotless braids done gently." }, { title: "Cuts", text: "Cuts shaped to how you wear your hair." }], about: "Glow Studio is a small salon on Admiralty Way where every appointment starts with a conversation about your hair and what you want.", highlights: [{ title: "On time", text: "Appointments start when they say they will." }, { title: "Gentle", text: "Kind to your edges." }], closing: "Your next appointment", photo: "hair salon interior" },
];
const goodAnswer = JSON.stringify(answers[1]);
const prompts: string[] = [];
const model = new MockLanguageModelV4({
  doGenerate: async (opts) => {
    prompts.push(JSON.stringify(opts.prompt));
    const answer = answers[Math.min(prompts.length - 1, answers.length - 1)];
    return {
      content: [{ type: "text", text: JSON.stringify(answer) }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } },
      warnings: [],
    } as never;
  },
});

const lead = await payload.create({ collection: "leads", data: { name: "Glow Studio", kind: "hair salon", area: "Lekki Phase I, Lagos", phone: "+2348031234567", status: "checked" } as never, overrideAccess: true });
const made = await makePreview(payload, lead.id, { model: model as never });
const stored = (await payload.findByID({ collection: "leads", id: lead.id, depth: 0, overrideAccess: true })) as unknown as { preview: { content: { v: number; design: { direction: string; type: string; palette: string; why?: string }; headline: string; cta: string; closing: string } } };
const content = stored.preview.content;

check("the model is shown the menu of directions for this business", prompts[0]?.includes('DIRECTION \\"monument\\"') && !prompts[0]?.includes('DIRECTION \\"poster\\"'), prompts[0]?.slice(0, 300));
check("sloppy copy is sent back once, with what to fix", prompts.length === 2 && prompts[1].includes("FIX THESE") && /elevate/i.test(prompts[1]), prompts.length);
check("the preview is saved as version 3 with a design", content.v === 3 && content.design.direction === "monument" && content.design.type === "gambarino" && content.design.palette === "blush-aubergine", content.design);
check("…with the reason it was chosen", Boolean(content.design.why));
check("…and the rewritten words", content.headline === "Hair that feels like you" && content.cta === "Book on WhatsApp", { h: content.headline, c: content.cta });
check("makePreview answers with the preview's address", /\/preview\/glow-studio-/.test(made.url), made.url);

// A model that never fixes its copy: the mechanical clean-up still runs.
prompts.length = 0;
answers.splice(1, 1);
await makePreview(payload, lead.id, { model: model as never });
const again = ((await payload.findByID({ collection: "leads", id: lead.id, depth: 0, overrideAccess: true })) as unknown as { preview: { content: { headline: string; closing: string } } }).preview.content;
check("copy the model won't fix is still cleaned (no exclamation marks, sentence case)", !again.headline.includes("!") && !again.closing.includes("!") && again.headline === "Elevate your hair journey today", again);

/* ---------- The copy that went live for Blanca's Hair Styling (2026-10-20) ---------- */

const blanca = {
  headline: "Blanca's hair styling",
  sub: "A Houston hair salon for people who want practical cuts, colour and styling, open Monday to Friday, 8am to 8pm.",
  cta: "Book an appointment",
  statement: "Blanca's is a Houston salon for haircuts, colour and styling. We keep it practical, open Monday to Friday, 8am to 8pm.",
  services: [{ title: "Haircuts", text: "Cuts shaped to your hair." }],
  about: "Blanca's Hair Styling is a hair salon in Houston, open Monday to Friday, 8am to 8pm. There is no website, so the best way to book is to call.",
  highlights: [{ title: "Weekday hours", text: "Open Monday to Friday, 8am to 8pm." }],
  closing: "Book your appointment",
};
const live = problems(blanca, { name: "Blanca's Hair Styling" });
check("a headline that only repeats the name is caught", live.some((p) => /repeats their name/.test(p)), live);
check("opening hours written into the copy are caught", live.some((p) => /opening hours/.test(p)), live);
check("the same words in three sections are caught", live.some((p) => /three or more sections/.test(p)), live);
check("talk about websites is caught", live.some((p) => /talks about websites/.test(p)), live);
check("a real headline mentioning the name is fine", !problems({ ...clean, headline: "Glow Studio, for healthy hair" }, { name: "Glow Studio" }).some((p) => /repeats their name/.test(p)));

/* ---------- Photos are looked at before they're used ---------- */

const sharp = (await import("sharp")).default;
const colour = (r: number, g: number, b: number) => sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r, g, b } } }).jpeg().toBuffer();
// Red: a flyer with prices on it. Blue: another kind of business. Green: clean photos.
const PHOTOS: Record<string, Buffer> = { flyer: await colour(220, 30, 30), wrong: await colour(30, 30, 220), clean1: await colour(30, 200, 40), clean2: await colour(40, 190, 50), clean3: await colour(50, 210, 60) };
let judged = 0;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.startsWith("https://api.openverse.org/v1/images/")) {
    return Response.json({ results: Object.keys(PHOTOS).map((k) => ({ url: `https://api.openverse.org/test-photos/${k}.jpg`, creator: "someone", source: "flickr", license: "cc0", width: 1600, height: 1000, title: k })) });
  }
  const m = /test-photos\/(\w+)\.jpg/.exec(url);
  if (m) return new Response(new Uint8Array(PHOTOS[m[1]]), { headers: { "content-type": "image/jpeg" } });
  if (/generativelanguage|:generateContent/.test(url)) {
    judged++;
    const body = JSON.parse(String(init?.body ?? "{}")) as { contents?: { parts?: { inlineData?: { data: string } }[] }[] };
    const data = body.contents?.[0]?.parts?.find((x) => x.inlineData)?.inlineData?.data ?? "";
    const { channels } = await sharp(Buffer.from(data, "base64")).stats();
    const [r, g, b] = channels.map((c) => c.mean);
    const text = g > r && g > b ? "YES\nA clean, bright photograph." : r > b ? "NO\nIt's a flyer with prices printed on it." : "NO\nThis is a barber shop, not a hair salon for women.";
    return Response.json({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }] });
  }
  return new Response("offline in this test", { status: 503 });
}) as typeof fetch;

answers.length = 0;
answers.push({ ...JSON.parse(goodAnswer), photo: "hair salon" });
const lead2 = await payload.create({ collection: "leads", data: { name: "Lumi Hair", kind: "hair salon", area: "Houston, Texas", phone: "+17136724767", status: "checked", country: "US" } as never, overrideAccess: true });
await makePreview(payload, lead2.id, { model: model as never, sight: { geminiKey: "test-key", visionModel: "gemini-test" } });
const withEyes = ((await payload.findByID({ collection: "leads", id: lead2.id, depth: 0, overrideAccess: true })) as unknown as { preview: { content: { stock: { url: string; alt?: string }[] } } }).preview.content.stock;
check("every candidate photo was looked at", judged >= 5, judged);
check("only the clean photos are used (no flyer, no wrong business)", withEyes.length === 3, withEyes.map((p) => p.alt));

answers.length = 0;
answers.push({ ...JSON.parse(goodAnswer), photo: "hair salon" });
await makePreview(payload, lead2.id, { model: model as never, sight: {} });
const blind = ((await payload.findByID({ collection: "leads", id: lead2.id, depth: 0, overrideAccess: true })) as unknown as { preview: { content: unknown } }).preview.content;
check("with nothing that can see, unchecked free photos aren't used", (blind as { stock: unknown[] }).stock.length === 0);
check("…and the page settles on a direction that works without photos", readPreview(blind)?.design.direction === "split", readPreview(blind)?.design);

globalThis.fetch = realFetch;
console.log(`\n${passed} passed, ${failed} failed`);
rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
