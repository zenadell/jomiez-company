/*
 * The art directions, type systems and palettes for built-in homepage
 * previews (when Aethron isn't there to bring a designer's template).
 *
 * Adapted from Taste Skill v2 by Leonxlnx (github.com/Leonxlnx/taste-skill,
 * MIT licence): its directions, type systems and palettes were distilled from
 * a study of 247 curated gallery sites (Awwwards, One Page Love). The ones
 * kept here are those that suit a local business's homepage. The guard rails
 * against "generated-looking" pages follow its tells registry and Anthropic's
 * frontend-design skill (github.com/anthropics/skills, Apache-2.0).
 *
 * The model never invents a look: it picks one direction, one type system and
 * one palette from the candidates this file offers for the business, and
 * writes words shaped for that direction. Each direction is a hand-built
 * layout (components/preview/design).
 */

export type FontRef = { family: string; source: "google" | "fontshare"; slug?: string; weights: number[]; italic?: boolean; stretch?: string };

export type TypeSystem = {
  id: string;
  name: string;
  display: FontRef & { tracking: string; leading: number; transform?: "uppercase" | "none" };
  text: FontRef;
  /** What it suits, for the model choosing one. */
  note: string;
};

export const TYPES: TypeSystem[] = [
  // One tight grotesk carries everything.
  { id: "general-sans", name: "General Sans", display: { family: "General Sans", source: "fontshare", slug: "general-sans", weights: [700], tracking: "-0.035em", leading: 0.88 }, text: { family: "General Sans", source: "fontshare", slug: "general-sans", weights: [400, 500] }, note: "A sharp, confident grotesk: modern, exact, unfussy." },
  { id: "schibsted", name: "Schibsted Grotesk", display: { family: "Schibsted Grotesk", source: "google", weights: [800], tracking: "-0.05em", leading: 0.86 }, text: { family: "Schibsted Grotesk", source: "google", weights: [400, 600] }, note: "A heavy, newspaper-born grotesk: direct and solid." },
  { id: "bricolage", name: "Bricolage Grotesque", display: { family: "Bricolage Grotesque", source: "google", weights: [600], tracking: "-0.04em", leading: 0.9 }, text: { family: "Bricolage Grotesque", source: "google", weights: [400, 500] }, note: "A grotesk with character and warmth: friendly but grown-up." },
  { id: "hanken", name: "Hanken Grotesk", display: { family: "Hanken Grotesk", source: "google", weights: [500], tracking: "-0.045em", leading: 0.92 }, text: { family: "Hanken Grotesk", source: "google", weights: [400, 500] }, note: "A calm medium grotesk: clear, quiet, trustworthy." },
  { id: "albert", name: "Albert Sans", display: { family: "Albert Sans", source: "google", weights: [600], tracking: "-0.035em", leading: 0.96 }, text: { family: "Albert Sans", source: "google", weights: [400, 500] }, note: "A geometric sans: clean, approachable, a little Scandinavian." },
  // Serifs with grace.
  { id: "gambarino", name: "Gambarino with General Sans", display: { family: "Gambarino", source: "fontshare", slug: "gambarino", weights: [400], tracking: "-0.02em", leading: 0.9 }, text: { family: "General Sans", source: "fontshare", slug: "general-sans", weights: [400, 500] }, note: "A soft, flared serif for names and headings: warm, a little couture." },
  { id: "erode", name: "Erode", display: { family: "Erode", source: "fontshare", slug: "erode", weights: [500], tracking: "-0.025em", leading: 0.93 }, text: { family: "Erode", source: "fontshare", slug: "erode", weights: [400, 600] }, note: "A sharp contemporary serif throughout: considered, literate." },
  { id: "newsreader", name: "Newsreader Light", display: { family: "Newsreader", source: "google", weights: [300], tracking: "-0.04em", leading: 0.92 }, text: { family: "Newsreader", source: "google", weights: [400, 500] }, note: "A light, large serif: hushed and elegant, lets photographs lead." },
  { id: "literata", name: "Literata", display: { family: "Literata", source: "google", weights: [500], tracking: "-0.02em", leading: 1.02 }, text: { family: "Literata", source: "google", weights: [400, 600] }, note: "A bookish text serif: reassuring, made for reading." },
  { id: "young-source", name: "Young Serif with Source Serif", display: { family: "Young Serif", source: "google", weights: [400], tracking: "-0.02em", leading: 0.96 }, text: { family: "Source Serif 4", source: "google", weights: [400, 600] }, note: "A sturdy, old-fashioned serif: homely, honest, a little nostalgic." },
  { id: "work-sans-light", name: "Work Sans Light", display: { family: "Work Sans", source: "google", weights: [300], tracking: "-0.035em", leading: 1 }, text: { family: "Work Sans", source: "google", weights: [400, 500] }, note: "A light open sans: airy, calm, gentle." },
  // Loud.
  { id: "anton", name: "Anton with Work Sans", display: { family: "Anton", source: "google", weights: [400], tracking: "-0.01em", leading: 0.86, transform: "uppercase" }, text: { family: "Work Sans", source: "google", weights: [400, 600] }, note: "A condensed poster face in capitals: loud, physical, sporty." },
  { id: "barlow-condensed", name: "Barlow Condensed", display: { family: "Barlow Condensed", source: "google", weights: [700], tracking: "-0.02em", leading: 0.88, transform: "uppercase" }, text: { family: "Barlow", source: "google", weights: [400, 500] }, note: "An industrial condensed face: workshop, garage, signage." },
  { id: "chivo-black", name: "Chivo Black", display: { family: "Chivo", source: "google", weights: [900], tracking: "-0.05em", leading: 0.88, transform: "uppercase" }, text: { family: "Chivo", source: "google", weights: [400, 700] }, note: "The heaviest grotesk in capitals: blunt, unmissable." },
  { id: "epilogue-black", name: "Epilogue Black", display: { family: "Epilogue", source: "google", weights: [900], tracking: "-0.045em", leading: 0.9 }, text: { family: "Epilogue", source: "google", weights: [400, 500] }, note: "A black-weight grotesk in sentence case: loud but friendly." },
  { id: "unbounded", name: "Unbounded with Onest", display: { family: "Unbounded", source: "google", weights: [800], tracking: "-0.03em", leading: 1, transform: "uppercase" }, text: { family: "Onest", source: "google", weights: [400, 500] }, note: "A wide, heavy display face: events, nightlife, energy." },
  { id: "chillax", name: "Chillax", display: { family: "Chillax", source: "fontshare", slug: "chillax", weights: [600], tracking: "-0.03em", leading: 1 }, text: { family: "Chillax", source: "fontshare", slug: "chillax", weights: [400, 500] }, note: "A soft rounded sans: playful, sweet, easy." },
];

export type Palette = {
  id: string;
  name: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  /** Extra flat colours for fields and tiles (poster and catalogue directions). */
  fields: string[];
  note: string;
};

export const PALETTES: Palette[] = [
  // Light neutrals.
  { id: "sheet-biro", name: "Sheet and biro", bg: "#ffffff", surface: "#f4f4f4", ink: "#111111", muted: "#6b6b6b", accent: "#1a4be0", accentInk: "#ffffff", fields: ["#111111"], note: "White, black, one blue: crisp and plain." },
  { id: "rose-grey-green", name: "Rose grey and green", bg: "#ebe5e3", surface: "#e1dad7", ink: "#2b2622", muted: "#6a615d", accent: "#0f7d45", accentInk: "#ffffff", fields: ["#2b2622"], note: "A powdery rose-grey with a deep green: soft, calm, a little floral." },
  { id: "paper-brass", name: "Paper and brass", bg: "#e8e8e3", surface: "#dcdcd6", ink: "#181715", muted: "#63625c", accent: "#bfb21a", accentInk: "#181715", fields: ["#181715"], note: "Grey paper, near-black, a brass yellow: workshop-precise." },
  { id: "three-stones", name: "Three stones", bg: "#eeecea", surface: "#e4e1dd", ink: "#333231", muted: "#6b6763", accent: "#5c6b54", accentInk: "#ffffff", fields: ["#cdc3b6"], note: "Three warm stone greys and a sage: quiet, natural." },
  { id: "putty-teal", name: "Putty, black and teal", bg: "#dedad3", surface: "#d3cec6", ink: "#0a0a0a", muted: "#5c5852", accent: "#256f82", accentInk: "#ffffff", fields: ["#0a0a0a"], note: "Putty ground, true black, a teal: architectural." },
  { id: "moss-sand", name: "Moss and sand", bg: "#ddd6c6", surface: "#d2cab8", ink: "#2a2a26", muted: "#59574e", accent: "#4f6238", accentInk: "#ffffff", fields: ["#3f5a2a"], note: "Sand and moss: earthy, outdoors, natural materials." },
  { id: "cool-slate", name: "Cool white and slate", bg: "#f7f9fa", surface: "#ecf0f2", ink: "#1f3038", muted: "#5d6b72", accent: "#0d7480", accentInk: "#ffffff", fields: ["#1f3038"], note: "Cool white, slate ink, a clinical teal: clean, careful." },
  { id: "white-navy", name: "White, navy and tab orange", bg: "#ffffff", surface: "#f4f4f2", ink: "#1f2b4d", muted: "#6a7186", accent: "#f7941d", accentInk: "#1f2b4d", fields: ["#1f2b4d"], note: "White and navy with an orange tab: dependable, a little sporty." },
  // Two-tone.
  { id: "teal-paper", name: "Teal on paper", bg: "#f7f9f8", surface: "#ebf0ee", ink: "#06525c", muted: "#2f737d", accent: "#06525c", accentInk: "#f7f9f8", fields: ["#06525c"], note: "Everything printed in one deep teal: fresh, medical, calm." },
  { id: "olive-bone", name: "Olive on bone", bg: "#ecebe7", surface: "#e1dfd9", ink: "#38450f", muted: "#5d683a", accent: "#38450f", accentInk: "#ecebe7", fields: ["#38450f"], note: "Olive ink on bone: herbal, grown, unhurried." },
  { id: "cobalt-sand", name: "Cobalt on sand", bg: "#e6dbc7", surface: "#ddd0b9", ink: "#062b8a", muted: "#3a5aa8", accent: "#062b8a", accentInk: "#e6dbc7", fields: ["#062b8a"], note: "Cobalt ink on sand: Mediterranean, sunny, crafted." },
  { id: "oxblood-grey", name: "Oxblood on grey", bg: "#e2e2e2", surface: "#d6d6d6", ink: "#7d0c14", muted: "#7a4a4e", accent: "#7d0c14", accentInk: "#e2e2e2", fields: ["#7d0c14"], note: "Oxblood ink on cool grey: rich, assured, a little fashion." },
  { id: "blush-aubergine", name: "Blush and aubergine", bg: "#edccbe", surface: "#e8c2b2", ink: "#351a2b", muted: "#6c4857", accent: "#351a2b", accentInk: "#edccbe", fields: ["#351a2b"], note: "Blush ground, aubergine ink: beauty, softness, intimacy." },
  { id: "bottle-gold", name: "Bottle green and gold", bg: "#133621", surface: "#1a4429", ink: "#f4d96c", muted: "#b3a55e", accent: "#f4d96c", accentInk: "#133621", fields: ["#f4d96c"], note: "Bottle green with gold: classic, celebratory, old money." },
  // Dark.
  { id: "lunar-bronze", name: "Lunar grey and bronze", bg: "#111111", surface: "#1c1c1c", ink: "#f2f2f2", muted: "#8f8f8f", accent: "#a08672", accentInk: "#111111", fields: ["#f2f2f2"], note: "Black with bronze: evening, low light, refined." },
  { id: "warm-black-gold", name: "Warm black and gold", bg: "#0c0a08", surface: "#181512", ink: "#ffffff", muted: "#8f8a84", accent: "#c9a45a", accentInk: "#0c0a08", fields: ["#c9a45a"], note: "Warm black and gold: night-time, hospitality, luxury." },
  { id: "charcoal-sage", name: "Charcoal room and sage", bg: "#1c1c1c", surface: "#262626", ink: "#f1f1ef", muted: "#9a9b96", accent: "#8fa68e", accentInk: "#1c1c1c", fields: ["#c8c5ba"], note: "Charcoal with sage: a dim, calm room." },
  { id: "walnut-tan", name: "Walnut and tan", bg: "#2b2216", surface: "#382d1e", ink: "#e4e2da", muted: "#a39a8b", accent: "#bda38b", accentInk: "#2b2216", fields: ["#bda38b"], note: "Walnut brown and tan: wood, leather, coffee." },
  // Flat and loud.
  { id: "poster-chapters", name: "Poster chapters", bg: "#e6e0d2", surface: "#dcd5c5", ink: "#1a1a1a", muted: "#5f5b52", accent: "#ed4b44", accentInk: "#1a1a1a", fields: ["#ed4b44", "#1a1a1a", "#18bc42", "#f2c21a"], note: "Red, black, green, yellow on oatmeal: street poster." },
  { id: "blue-red-black", name: "Blue, red and black", bg: "#ffffff", surface: "#f3f3f3", ink: "#0a0a0a", muted: "#6b6b6b", accent: "#2436ff", accentInk: "#ffffff", fields: ["#2436ff", "#ff3b1f", "#0a0a0a", "#050a5c"], note: "Electric blue, signal red, black: sport, energy." },
  { id: "charcoal-primaries", name: "Charcoal primaries", bg: "#191919", surface: "#242424", ink: "#ffffff", muted: "#9a9a9a", accent: "#ffe927", accentInk: "#191919", fields: ["#d71e1e", "#1e4bd7", "#0c7866", "#ffe927"], note: "Primaries on charcoal: gym, garage, after dark." },
  { id: "orange-sky-lime", name: "Orange, sky and lime", bg: "#ff8126", surface: "#ff8d3a", ink: "#111111", muted: "#5c2a05", accent: "#111111", accentInk: "#ff8126", fields: ["#ff8126", "#4db3ff", "#c5f53d", "#161615"], note: "Orange, sky blue, lime: summer, play, events." },
  { id: "post-red-mustard", name: "Post red and mustard", bg: "#e2dccf", surface: "#d7d0c1", ink: "#2a1110", muted: "#6b524c", accent: "#dc1928", accentInk: "#ffffff", fields: ["#dc1928", "#952625", "#e0a912", "#4a6f84"], note: "Post-box red and mustard: workmanlike, trades, signage." },
  { id: "report-blocks", name: "Report blocks", bg: "#ffffff", surface: "#f6f6f6", ink: "#000000", muted: "#5f5f5f", accent: "#fe7141", accentInk: "#000000", fields: ["#fe7141", "#d1ddd3", "#f0ff1c", "#000000"], note: "Orange, mint and acid yellow on white: bright, modern." },
  // Pastel fields (for tiles).
  { id: "card-pastels", name: "Card pastels", bg: "#f7f7f5", surface: "#ebebe8", ink: "#000000", muted: "#666662", accent: "#d0106f", accentInk: "#ffffff", fields: ["#97aaf6", "#bbf697", "#fed878", "#6ef8fb"], note: "Periwinkle, lime, butter, aqua tiles: cheerful shop." },
  { id: "mint-pink", name: "Mint and pink", bg: "#f8f8f8", surface: "#eeeeee", ink: "#0a0a0a", muted: "#6a6a6a", accent: "#1f6b3a", accentInk: "#ffffff", fields: ["#c3edce", "#f8c7c9", "#efe7da"], note: "Mint and pink tiles: fresh, sweet, a bakery or boutique." },
  { id: "swap-pastels", name: "Soft pastels", bg: "#efece6", surface: "#e6e1d8", ink: "#141414", muted: "#4a5068", accent: "#0f5257", accentInk: "#ffffff", fields: ["#c3cbe5", "#efd3da", "#e6dccd", "#cfd3cb"], note: "Lilac, rose, sand and sage tiles: gentle, crafted." },
  { id: "sky-sand", name: "Sky and sand", bg: "#f4f1ea", surface: "#ebe6da", ink: "#0a0a0a", muted: "#44606e", accent: "#b0298f", accentInk: "#ffffff", fields: ["#cbe4f2", "#f1e3b5", "#ffc013", "#e8d6c8"], note: "Sky, sand and marigold tiles: sunny, holiday." },
];

export type DirectionId = "monument" | "place" | "split" | "poster" | "catalogue";

export type Direction = {
  id: DirectionId;
  name: string;
  /** The idea, for the model choosing one (from Taste Skill's directions). */
  idea: string;
  /** What its words must be like. */
  copy: string;
  types: string[];
  palettes: string[];
  /** Pictures it needs to work. */
  needs: { photos?: number; products?: number };
};

export const DIRECTIONS: Direction[] = [
  {
    id: "monument",
    name: "The name as a monument",
    idea: "The business's name is the headline, set so large it becomes architecture across the width of the screen, under one strong photograph. After that the page goes calm and small. Best when the name is short and memorable.",
    copy: "The hero is the name itself, with one short supporting sentence. Section headings are modest. Copy is spare and confident.",
    types: ["general-sans", "schibsted", "bricolage", "gambarino", "erode"],
    palettes: ["sheet-biro", "rose-grey-green", "paper-brass", "three-stones", "blush-aubergine", "oxblood-grey", "olive-bone", "cobalt-sand", "lunar-bronze", "warm-black-gold", "bottle-gold"],
    needs: { photos: 1 },
  },
  {
    id: "place",
    name: "The place carries it",
    idea: "For a place people go to: one full-screen photograph of where you'd be standing, the name along its bottom edge like a film title, then few words and large pictures at uneven sizes. The design steps back and lets the place sell itself.",
    copy: "Few words. A short, evocative headline about being there. Paragraphs short and calm. Practical details gathered once near the end.",
    types: ["newsreader", "gambarino", "erode", "work-sans-light", "young-source"],
    palettes: ["three-stones", "putty-teal", "moss-sand", "rose-grey-green", "charcoal-sage", "warm-black-gold", "walnut-tan", "lunar-bronze"],
    needs: { photos: 3 },
  },
  {
    id: "split",
    name: "The split stage",
    idea: "Half the screen is a photograph that stays put while the other half scrolls: a calm reading column with everything a visitor needs. Like sitting in the room while reading about it. Suits services where trust and clear information matter.",
    copy: "Clear, reassuring, specific. A headline of five to seven words that says what they do for whom. Services described plainly.",
    types: ["literata", "young-source", "hanken", "albert", "work-sans-light", "erode"],
    palettes: ["teal-paper", "cool-slate", "olive-bone", "cobalt-sand", "three-stones", "moss-sand", "rose-grey-green", "white-navy", "sheet-biro"],
    needs: { photos: 1 },
  },
  {
    id: "poster",
    name: "Loud and flat",
    idea: "The directness of a street poster: flat saturated colour fields, the heaviest type, short blunt statements and hard-cropped photographs stuck on at an angle. For businesses with energy and a voice.",
    copy: "Blunt and short, like something you'd shout across the street. A headline of two to five words. Services as short punchy names.",
    types: ["anton", "barlow-condensed", "chivo-black", "epilogue-black", "unbounded"],
    palettes: ["poster-chapters", "blue-red-black", "charcoal-primaries", "orange-sky-lime", "post-red-mustard", "report-blocks"],
    needs: { photos: 1 },
  },
  {
    id: "catalogue",
    name: "The specimen catalogue",
    idea: "What they sell, shown like a field guide: each product alone on its own flat colour tile, same scale, named plainly with its price. Treats ordinary things as worth looking at. Only for businesses whose own product photos we have.",
    copy: "Plain and friendly. One clear statement of what they sell. Product names come from their own site.",
    types: ["hanken", "albert", "chillax", "literata", "bricolage"],
    palettes: ["card-pastels", "mint-pink", "swap-pastels", "sky-sand", "report-blocks"],
    needs: { products: 4 },
  },
];

export const byId = {
  type: (id: string) => TYPES.find((t) => t.id === id),
  palette: (id: string) => PALETTES.find((p) => p.id === id),
  direction: (id: string) => DIRECTIONS.find((d) => d.id === id),
};

/** The stylesheet links that load a type system's fonts. */
export function fontLinks(t: TypeSystem): string[] {
  const fonts = [t.display, t.text];
  const google = new Map<string, Set<number>>();
  const fontshare = new Map<string, Set<number>>();
  for (const f of fonts) {
    const into = f.source === "google" ? google : fontshare;
    const key = f.source === "google" ? f.family : (f.slug ?? f.family.toLowerCase().replace(/\s+/g, "-"));
    const set = into.get(key) ?? new Set<number>();
    for (const w of f.weights) set.add(w);
    into.set(key, set);
  }
  const out: string[] = [];
  if (google.size) {
    const fams = [...google].map(([fam, ws]) => `family=${fam.replace(/ /g, "+")}:wght@${[...ws].sort((a, b) => a - b).join(";")}`);
    out.push(`https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`);
  }
  if (fontshare.size) {
    const fams = [...fontshare].map(([slug, ws]) => `f[]=${slug}@${[...ws].sort((a, b) => a - b).join(",")}`);
    out.push(`https://api.fontshare.com/v2/css?${fams.join("&")}&display=swap`);
  }
  return out;
}
