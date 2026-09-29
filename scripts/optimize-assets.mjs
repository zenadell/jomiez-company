// Resizes the source images the site uses into public/media.
// Sources: the Aethron mirror of the Spartan AI template (aethron/site/assets/r)
// and Jomiez's own project/service imagery from jomiez.com (scripts/.cache).
// Usage: node scripts/optimize-assets.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const mirror = path.join(root, "aethron/site/assets/r");
const cache = path.join(root, "scripts/.cache");
const out = path.join(root, "public/media");
fs.mkdirSync(out, { recursive: true });

// [source, output name, max width, quality]
const images = [
  ["mirror:2ab54025f282.png", "hero-crt.webp", 2400, 80],
  ["mirror:273c61e9fed6.jpg", "hero-card.jpg", 900, 78],
  ["mirror:19f932c2ea54.png", "footer-cube.webp", 2400, 78],
  // Jomiez project screenshots (jomiez.com)
  ["cache:chaka-ai.png", "work/chaka-ai.jpg", 1800, 82],
  ["cache:chaka-wap.png", "work/chaka-wap.jpg", 1800, 82],
  ["cache:zyro.png", "work/zyro.jpg", 1800, 82],
  ["cache:renok.png", "work/renok.jpg", 1800, 82],
  ["cache:og-image.png", "og.jpg", 1200, 85],
  // Template artwork (services, process, showcase, pricing, insights)
  ["mirror:9fa8f61bc15c.jpg", "showcase-dial.jpg", 2400, 78],
  ["mirror:8eba4e47060b.png", "process-iso.webp", 700, 82],
  ["mirror:40d1a903e080.png", "process-texture.webp", 1200, 70],
  ["mirror:8c3d0a1cef5b.jpg", "pricing-swirl.jpg", 900, 72],
  ["mirror:4a1f09b3a591.jpeg", "articles/modern-cloud.jpg", 1600, 78],
  ["mirror:22d375ca1c12.jpeg", "articles/scalable-systems.jpg", 1600, 78],
  ["mirror:3d7d3dc6d092.jpeg", "articles/high-performance.jpg", 1600, 78],
  ["mirror:c945627bae54.png", "services-iso.webp", 700, 82],
  ["mirror:a178557ac749.png", "services-texture.webp", 1400, 70],
  // Client avatars (jomiez.com)
  ["cache:client-01.avif", "clients/client-1.jpg", 160, 82],
  ["cache:client-02.avif", "clients/client-2.jpg", 160, 82],
  ["cache:client-03.avif", "clients/client-3.jpg", 160, 82],
  ["cache:client-04.avif", "clients/client-4.jpg", 160, 82],
];

const videos = [];

function resolveSrc(ref) {
  const [kind, file] = ref.split(":");
  return path.join(kind === "mirror" ? mirror : cache, file);
}

for (const [ref, name, width, quality] of images) {
  const src = resolveSrc(ref);
  if (!fs.existsSync(src)) {
    console.warn("missing", ref);
    continue;
  }
  const dest = path.join(out, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const img = sharp(src).rotate().resize({ width, withoutEnlargement: true });
    if (name.endsWith(".png")) await img.png({ compressionLevel: 9, palette: true }).toFile(dest);
    else if (name.endsWith(".webp")) await img.webp({ quality }).toFile(dest);
    else await img.jpeg({ quality, mozjpeg: true }).toFile(dest);
    console.log(name, (fs.statSync(dest).size / 1024).toFixed(0) + "KB");
  } catch (err) {
    console.warn("failed", ref, err.message);
  }
}

for (const [ref, name] of videos) {
  const src = resolveSrc(ref);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(out, name));
    console.log(name, (fs.statSync(src).size / 1024).toFixed(0) + "KB (copied)");
  }
}
