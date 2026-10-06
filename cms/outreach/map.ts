import { createHmac, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { cloudinaryConfigured } from "../storage/cloudinary";
import type { Picture } from "./images";

/*
 * The street map on a preview's "Visit" section: a still picture made from
 * OpenStreetMap's tiles around the business, centred on it (the page draws
 * the pin, in their colour). A picture loads faster than a map widget and can
 * be styled to match the page. Made once per preview: kept in Cloudinary when
 * it's set up, else drawn by this site's map route (signed, so it only draws
 * places a preview asked for) and kept by browsers.
 */

export const MAP_W = 1024;
export const MAP_H = 640;
const ZOOM = 16;
const TILE = 256;
const UA = "JomiezAgent/1.0 (+https://jomiez.com)";

const key = () => createHmac("sha256", process.env.PAYLOAD_SECRET || "local-development-secret-change-me").update("jomiez-preview-maps").digest();
const point = (lat: number, lon: number) => `${lat.toFixed(5)},${lon.toFixed(5)}`;
const sign = (c: string) => createHmac("sha256", key()).update(c).digest("base64url").slice(0, 24);

export function verifyMap(c: string, sig: string) {
  const want = Buffer.from(sign(c));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** The map route's address for a point. */
export const mapRoute = (lat: number, lon: number) => {
  const c = point(lat, lon);
  return `/preview/map?${new URLSearchParams({ c, s: sign(c) })}`;
};

/** Draws the map: the tiles that cover the picture, stitched and cropped around the point. */
export async function drawMap(lat: number, lon: number): Promise<Buffer> {
  const scale = TILE * 2 ** ZOOM;
  const x = ((lon + 180) / 360) * scale;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  const left = Math.round(x - MAP_W / 2);
  const top = Math.round(y - MAP_H / 2);
  const tx0 = Math.floor(left / TILE);
  const ty0 = Math.floor(top / TILE);
  const tx1 = Math.floor((left + MAP_W - 1) / TILE);
  const ty1 = Math.floor((top + MAP_H - 1) / TILE);
  const jobs: { tx: number; ty: number }[] = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push({ tx, ty });

  // Two at a time, as OpenStreetMap's tile policy asks.
  const tiles: { input: Buffer; left: number; top: number }[] = [];
  let i = 0;
  await Promise.all(
    [0, 1].map(async () => {
      while (i < jobs.length) {
        const { tx, ty } = jobs[i++];
        const res = await fetch(`https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`, { headers: { "user-agent": UA, referer: "https://www.jomiez.com/" }, signal: AbortSignal.timeout(15_000) });
        if (!res.ok) throw new Error(`Map tile ${res.status}`);
        tiles.push({ input: Buffer.from(await res.arrayBuffer()), left: (tx - tx0) * TILE, top: (ty - ty0) * TILE });
      }
    }),
  );
  const canvas = sharp({ create: { width: (tx1 - tx0 + 1) * TILE, height: (ty1 - ty0 + 1) * TILE, channels: 3, background: "#eeeeee" } }).composite(tiles);
  const stitched = await canvas.png().toBuffer();
  return sharp(stitched)
    .extract({ left: left - tx0 * TILE, top: top - ty0 * TILE, width: MAP_W, height: MAP_H })
    .webp({ quality: 80 })
    .toBuffer();
}

/** The map picture for a preview: in Cloudinary when it's set up, else the map route. */
export async function keepMap(lat: number, lon: number, folder: string): Promise<Picture> {
  if (cloudinaryConfigured) {
    const data = await drawMap(lat, lon);
    const publicId = `jomiez-previews/${folder}/map`;
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ public_id: publicId, overwrite: true, resource_type: "image" }, (err) => (err ? reject(err) : resolve()));
      stream.end(data);
    });
    return { url: cloudinary.url(publicId, { secure: true, transformation: [{ fetch_format: "auto", quality: "auto" }] }), w: MAP_W, h: MAP_H, alt: "Map" };
  }
  return { url: mapRoute(lat, lon), w: MAP_W, h: MAP_H, alt: "Map" };
}
