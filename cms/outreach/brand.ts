import { PHONE_UA, safeFetch } from "../agent/web";
import { fetchImage, keepImage, logoColours, type Picture } from "./images";
import { keepMap } from "./map";

/*
 * What a business already has, for a preview that looks like theirs: its
 * logo, its own photos (rooms, food, products), its colours, and where it is
 * on the map. All of it read from their own website and map listing, shown
 * back to them on a private sample page; nothing is invented.
 */

export type Brand = {
  logo?: Picture;
  /** Wide photos: rooms, places, people at work. */
  photos: Picture[];
  /** Product shots (often cut out on white), with the name and price their site gives. */
  products: (Picture & { title?: string; price?: string })[];
  colours: string[];
  coords?: { lat: number; lon: number; exact: boolean };
  /** A street map around them (map.ts). */
  map?: Picture;
};

const UA = "JomiezAgent/1.0 (+https://jomiez.com)";

const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return (m?.[1] ?? m?.[2] ?? "").replace(/&amp;/g, "&").trim();
};

const SKIP = /\.(svg|gif)(\?|$)|^data:|sprite|icon|favicon|payment|dummy|placeholder|spacer|blank\.|pixel|avatar|gravatar|flag|badge|loader|spinner|arrow|emoji|whatsapp|facebook|instagram|twitter|tiktok|youtube|linkedin|google-play|app-store|qr[-_]?code/i;

/** Image addresses on a page, in the order they appear (heroes and sliders come first). */
function candidates(html: string, base: string) {
  const logos: string[] = [];
  const photos: string[] = [];
  /** A product's name and price, when the page shows them right after its picture (shop pages do). */
  const captions = new Map<string, { title?: string; price?: string }>();
  const add = (list: string[], src: string) => {
    if (!src) return;
    try {
      const url = new URL(src.startsWith("//") ? `https:${src}` : src, base).toString();
      if (!list.includes(url)) list.push(url);
    } catch {
      // not an address
    }
  };
  const widest = (set: string) =>
    set
      .split(/,\s+/)
      .map((p) => p.trim().split(/\s+/))
      .filter((p) => p[0])
      .sort((a, b) => parseFloat(b[1] || "0") - parseFloat(a[1] || "0"))[0]?.[0] ?? "";

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = widest(attr(tag, "data-srcset") || attr(tag, "srcset")) || attr(tag, "data-lazy-src") || attr(tag, "data-src") || attr(tag, "data-lazyload") || attr(tag, "src");
    const label = `${attr(tag, "class")} ${attr(tag, "id")} ${attr(tag, "alt")} ${src}`;
    // Themes often mark the wrapper rather than the picture: <div class="site-logo"><a rel="home"><img>.
    const before = html.slice(Math.max(0, (m.index ?? 0) - 300), m.index ?? 0);
    const wrapper = /<[a-z]+\b[^>]*\b(?:class|id)=["']([^"']*(?:logo|brand)[^"']*)["'][^>]*>(?:\s*<a\b[^>]*>)?\s*(?:<picture\b[^>]*>\s*(?:<source\b[^>]*>\s*)*)?$/i.exec(before)?.[1] ?? "";
    if ((/logo/i.test(label) || wrapper) && !/footer|partner|client|sponsor|payment/i.test(label) && !/partner|client|sponsor|payment|carousel|slider|brands/i.test(wrapper)) add(logos, src);
    else if (!SKIP.test(src)) {
      add(photos, src);
      const at = (m.index ?? 0) + tag.length;
      const after = html.slice(at, at + 2500).split(/<img\b/i)[0];
      const title = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i.exec(after)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const plain = after.replace(/<[^>]+>/g, " ").replace(/&#8358;|&#x20a6;/gi, "₦").replace(/&nbsp;/g, " ");
      const price = /(₦|NGN|\$|£|€|GH₵|KSh)\s?\d[\d,]*(\.\d{2})?/.exec(plain)?.[0];
      if (title && title.length <= 70) {
        try {
          captions.set(new URL(src.startsWith("//") ? `https:${src}` : src, base).toString(), { title, price });
        } catch {
          // not an address
        }
      }
    }
  }
  // Slider and section backgrounds.
  for (const m of html.matchAll(/(?:data-lazyload|data-bg|data-background|data-image)\s*=\s*["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/gi)) add(photos, m[1]);
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+\.(?:jpe?g|png|webp)[^'")]*)['"]?\s*\)/gi)) if (!SKIP.test(m[1])) add(photos, m[1]);
  const og = /<meta[^>]+property=["']og:image["'][^>]*>/i.exec(html)?.[0];
  if (og) add(photos, attr(og, "content"));
  for (const m of html.matchAll(/<link\b[^>]*rel=["'][^"']*(apple-touch-icon|icon)[^"']*["'][^>]*>/gi)) {
    const size = Number(attr(m[0], "sizes").split("x")[0]) || 0;
    if (m[1].includes("apple") || size >= 128) add(logos, attr(m[0], "href"));
  }
  const theme = /<meta[^>]+name=["']theme-color["'][^>]*>/i.exec(html)?.[0];
  return { logos: logos.slice(0, 4), photos: photos.slice(0, 28), theme: theme ? attr(theme, "content") : "", captions };
}

const strong = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min > 40 && max > 50 && min < 230 ? `#${m[1].toLowerCase()}` : null;
};

/** Runs `work` on each item, a few at a time, keeping the results in the items' order. */
async function pool<T, R>(items: T[], n: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const at = i++;
        out[at] = await work(items[at]);
      }
    }),
  );
  return out;
}

/** Place words in an address (not numbers, street types or the country), for comparing two addresses. */
const placeWords = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !/^(street|road|close|avenue|crescent|drive|lane|way|estate|phase|state|nigeria|ghana|kenya|south|africa|united|kingdom|england|scotland|wales|ireland|city|local|government|area|ward)$/.test(w)),
  );

/** Where they are: the map listing's point, or (for leads found before that was kept) their name looked up on the map. */
async function place(name: string, area: string, address: string, country: string, facts: Record<string, string>) {
  if (facts.lat && facts.lon) return { lat: Number(facts.lat), lon: Number(facts.lon), exact: true };
  try {
    const q = new URLSearchParams({ q: `${name}, ${area}`, countrycodes: country.toLowerCase(), format: "jsonv2", limit: "3" });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15_000) });
    const hits = (await res.json()) as { name?: string; display_name?: string; lat: string; lon: string }[];
    const plain = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Only the business itself, by name: a street or district of the same name would put the pin in the wrong place.
    const hit = hits.find((h) => h.name && plain(h.name) === plain(name));
    if (!hit) return undefined;
    // And only where it agrees with the address we have for them: an old listing elsewhere would send customers to the wrong place.
    const ours = placeWords(address);
    if (ours.size && ![...placeWords(hit.display_name ?? "")].some((w) => ours.has(w))) return undefined;
    return { lat: Number(hit.lat), lon: Number(hit.lon), exact: true };
  } catch {
    return undefined;
  }
}

export async function gatherBrand(lead: Record<string, unknown>, slug: string): Promise<Brand> {
  const brand: Brand = { photos: [], products: [], colours: [] };
  const facts = ((lead.check as { facts?: Record<string, string> } | null)?.facts ?? {}) as Record<string, string>;
  const kind = (lead.check as { kind?: string } | null)?.kind;
  brand.coords = await place(String(lead.name), String(lead.area ?? ""), String(lead.address ?? ""), String(lead.country ?? "NG"), facts);
  if (brand.coords) brand.map = await keepMap(brand.coords.lat, brand.coords.lon, slug).catch(() => undefined);

  const website = typeof lead.website === "string" ? lead.website : "";
  if (!website || kind === "broken" || kind === "unreachable") return brand;
  let html = "";
  let base = website;
  try {
    const res = await safeFetch(website, { maxBytes: 3_000_000, timeoutMs: 20_000, userAgent: PHONE_UA });
    if (res.status < 400) {
      html = res.body.toString("utf8");
      base = res.url;
    }
  } catch {
    return brand;
  }
  if (!html) return brand;
  const found = candidates(html, base);

  // The logo: the first candidate that's a real picture.
  for (const src of found.logos) {
    try {
      const img = await fetchImage(src, 4_000_000);
      if (img.w < 48 || img.h < 24) continue;
      brand.logo = await keepImage(img, slug, "logo", 600, `${String(lead.name)} logo`);
      brand.colours = await logoColours(img.data).catch(() => []);
      break;
    } catch {
      // try the next one
    }
  }
  const theme = strong(found.theme);
  if (theme) brand.colours = [theme, ...brand.colours.filter((c) => c !== theme)].slice(0, 2);

  // Their photos: sized up, sorted into wide photos and product shots, best first.
  const imgs = (
    await pool(found.photos, 4, async (src) => {
      try {
        return await fetchImage(src);
      } catch {
        return null;
      }
    })
  ).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const order = new Map(found.photos.map((src, i) => [src, i]));
  const photos = imgs
    .filter((i) => i.w >= 640 && i.h >= 380 && i.w / i.h > 0.55 && i.w / i.h < 2.6 && !(i.alpha && i.format === "png"))
    .sort((a, b) => b.w * b.h * (1 - 0.02 * (order.get(a.url) ?? 0)) - a.w * a.h * (1 - 0.02 * (order.get(b.url) ?? 0)))
    .slice(0, 6);
  const used = new Set(photos.map((p) => p.url));
  const products = imgs.filter((i) => !used.has(i.url) && i.w >= 280 && i.h >= 280 && i.w / i.h > 0.6 && i.w / i.h < 1.7).slice(0, 8);
  brand.photos = await Promise.all(photos.map((p, i) => keepImage(p, slug, `photo-${i}`, 1800)));
  brand.products = await Promise.all(
    products.map(async (p, i) => {
      const cap = found.captions.get(p.url);
      return { ...(await keepImage(p, slug, `product-${i}`, 800, cap?.title)), title: cap?.title, price: cap?.price };
    }),
  );
  return brand;
}
