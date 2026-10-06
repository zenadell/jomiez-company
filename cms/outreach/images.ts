import { createHmac, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { PHONE_UA, safeFetch } from "../agent/web";
import { cloudinaryConfigured } from "../storage/cloudinary";

/*
 * Pictures on previews (a business's own logo and photos, or stock photos):
 * kept in Cloudinary when it's set up (fast, resized for each screen), else
 * served through this site's own image route, which fetches and shrinks them.
 * That route only serves addresses signed here, so it can't be used as an
 * open proxy.
 */

export type Picture = { url: string; w: number; h: number; alt?: string };

const secret = () => createHmac("sha256", process.env.PAYLOAD_SECRET || "local-development-secret-change-me").update("jomiez-preview-images").digest();

export const signImage = (url: string, w: number) => createHmac("sha256", secret()).update(`${w}|${url}`).digest("base64url").slice(0, 24);

export function verifyImage(url: string, w: number, sig: string) {
  const want = Buffer.from(signImage(url, w));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

const proxied = (url: string, w: number) => `/preview/img?${new URLSearchParams({ u: url, w: String(w), s: signImage(url, w) })}`;

/** Photo libraries ask robots to say who they are (Wikimedia turns away browser-looking robots); shops' own sites are read the way a phone sees them. */
const BOT_UA = "JomiezAgent/1.0 (+https://jomiez.com; previews for small businesses)";
const LIBRARIES = /(^|\.)(wikimedia\.org|wikipedia\.org|openverse\.org|flickr\.com|staticflickr\.com)$/i;

/** Fetches an image from the web and reads its size. */
export async function fetchImage(url: string, maxBytes = 12_000_000) {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  const res = await safeFetch(url, { maxBytes, timeoutMs: 20_000, userAgent: LIBRARIES.test(host) ? BOT_UA : PHONE_UA });
  if (res.status >= 400 || !res.type.startsWith("image/") || /svg/.test(res.type)) throw new Error(`Not a usable picture (${res.status} ${res.type}).`);
  const meta = await sharp(res.body).metadata();
  return { url, data: res.body, w: meta.width ?? 0, h: meta.height ?? 0, alpha: Boolean(meta.hasAlpha), format: meta.format ?? "" };
}

/** A copy for a preview, as wide as `w` at most. */
export async function keepImage(img: { url: string; data: Buffer; w: number; h: number }, folder: string, name: string, w: number, alt?: string): Promise<Picture> {
  const scale = Math.min(1, w / Math.max(1, img.w));
  const size = { w: Math.round(img.w * scale), h: Math.round(img.h * scale) };
  if (cloudinaryConfigured) {
    const publicId = `jomiez-previews/${folder}/${name}`;
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ public_id: publicId, overwrite: true, resource_type: "image" }, (err) => (err ? reject(err) : resolve()));
      stream.end(img.data);
    });
    const url = cloudinary.url(publicId, { secure: true, transformation: [{ width: w, crop: "limit" }, { fetch_format: "auto", quality: "auto" }] });
    return { url, ...size, alt };
  }
  return { url: proxied(img.url, w), ...size, alt };
}

/** The image route's work: fetch, shrink, re-encode (alpha kept for logos). */
export async function shrink(url: string, w: number) {
  const img = await fetchImage(url, 15_000_000);
  const out = await sharp(img.data).rotate().resize({ width: Math.min(w, 2000), withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  return out;
}

/** A logo's strongest colours (up to two, distinct hues), skipping white, black and greys. */
export async function logoColours(data: Buffer): Promise<string[]> {
  const { data: px, info } = await sharp(data).resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < px.length; i += info.channels) {
    const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    if (sat < 0.35 || max < 60) continue;
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    const bin = Math.floor(((h * 60 + 360) % 360) / 20); // 18 hue bins
    const cur = bins.get(bin) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n += sat;
    cur.r += r * sat;
    cur.g += g * sat;
    cur.b += b * sat;
    bins.set(bin, cur);
  }
  const ranked = [...bins.entries()].filter(([, v]) => v.n >= 5).sort((a, b) => b[1].n - a[1].n);
  const picked: typeof ranked = [];
  for (const entry of ranked) {
    // A second colour only if its hue is clearly different from the first.
    if (picked.every(([bin]) => Math.min(Math.abs(bin - entry[0]), 18 - Math.abs(bin - entry[0])) >= 3)) picked.push(entry);
    if (picked.length === 2) break;
  }
  const hex = (v: number, n: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return picked.map(([, v]) => `#${hex(v.r, v.n)}${hex(v.g, v.n)}${hex(v.b, v.n)}`);
}
