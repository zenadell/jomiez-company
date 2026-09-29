// Builds the Jomiez logo files from the master artwork (scripts/brand/jomiez-logo.webp):
// the full-colour icon for the site, plus the favicon, app icon and Apple touch icon.
// In the master the "Z" is cut out (transparent); here it is filled white so the icon
// reads the same on any background.
// Usage: node scripts/brand-assets.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "scripts/brand/jomiez-logo.webp");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const alpha = (x, y) => data[(y * W + x) * C + 3];

// Bounds of the rounded square, measured from the inside out (the file has stray pixels on its edges).
// Each probe starts inside the square but clear of both the "Z" and the big rounded corners.
const scanOut = (x, y, dx, dy) => { while (x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H && alpha(x + dx, y + dy) >= 128) { x += dx; y += dy; } return dx ? x : y; };
const at = (fx, fy) => [Math.round(W * fx), Math.round(H * fy)];
const top = scanOut(...at(0.5, 0.16), 0, -1);
const bottom = scanOut(...at(0.5, 0.73), 0, 1);
const left = scanOut(...at(0.2, 0.5), -1, 0);
const right = scanOut(...at(0.77, 0.5), 1, 0);
const w = right - left + 1, h = bottom - top + 1;

// Crop to the square; flood-fill the "Z" hole (everything transparent that isn't connected to the outside).
const crop = await sharp(src).extract({ left, top, width: w, height: h }).ensureAlpha().raw().toBuffer();
const outside = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
while (stack.length) {
  const i = stack.pop();
  if (outside[i] || crop[i * C + 3] >= 250) continue;
  outside[i] = 1;
  const x = i % w, y = (i / w) | 0;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - w);
  if (y < h - 1) stack.push(i + w);
}
for (let i = 0; i < w * h; i++) {
  if (outside[i]) continue;
  const a = crop[i * C + 3] / 255;
  for (let k = 0; k < 3; k++) crop[i * C + k] = Math.round(crop[i * C + k] * a + 255 * (1 - a));
  crop[i * C + 3] = 255;
}
const icon = () => sharp(crop, { raw: { width: w, height: h, channels: C } });
const square = (size, background = { r: 0, g: 0, b: 0, alpha: 0 }) =>
  icon().resize(size, size, { fit: "contain", background });

fs.mkdirSync(path.join(root, "public/media/brand"), { recursive: true });
await square(256).png({ compressionLevel: 9, palette: true, quality: 95, dither: 0.6 }).toFile(path.join(root, "public/media/brand/jomiez-icon.png"));
await square(512).png({ compressionLevel: 9, palette: true, quality: 95, dither: 0.6 }).toFile(path.join(root, "app/icon.png"));
await square(180, { r: 255, g: 255, b: 255, alpha: 1 }).flatten({ background: "#ffffff" }).png({ compressionLevel: 9, palette: true, quality: 95 }).toFile(path.join(root, "app/apple-icon.png"));

// favicon.ico with 16, 32 and 48px PNG entries.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => square(s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
fs.writeFileSync(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...pngs]));
console.log(`icon ${w}x${h} from (${left}, ${top}); wrote public/media/brand/jomiez-icon.png, app/icon.png, app/apple-icon.png, app/favicon.ico`);
