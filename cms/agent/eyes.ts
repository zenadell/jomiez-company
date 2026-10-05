import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { generateText } from "ai";
import type { Browser, Page } from "playwright-core";
import { buildModel, type ProviderId } from "./providers";
import { assertPublic, safeFetch } from "./web";

/*
 * The agent's eyes: a real browser for screenshots and pages built with
 * JavaScript, a way to look at any image or screenshot and say what's in it,
 * and image making (Gemini) for pictures that belong to nobody else.
 *
 * The browser is a fresh, empty one for every job (no cookies, no admin
 * session) and every request it makes is checked: private and internal
 * addresses are refused, so a page can't use it to reach the server's network.
 */

/* ---------- The browser ---------- */

const MAC_BROWSERS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];
const WINDOWS_BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

/** The Chromium build matching @sparticuz/chromium-min's version. */
const CHROMIUM = "153.0.0";

async function launch(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  // A browser service (e.g. Browserless), when the server is too small to run one.
  if (process.env.BROWSER_WS_ENDPOINT) return chromium.connectOverCDP(process.env.BROWSER_WS_ENDPOINT);
  const local = process.env.BROWSER_EXECUTABLE_PATH || [...MAC_BROWSERS, ...WINDOWS_BROWSERS].find((p) => fs.existsSync(p));
  if (local) return chromium.launch({ executablePath: local, headless: true });
  if (process.platform !== "linux") throw new Error("No browser found. Install Google Chrome, or set BROWSER_EXECUTABLE_PATH.");
  // On Linux servers (Render): a self-contained Chromium, fetched the first time it's
  // needed and kept in /tmp (so computers that never take screenshots never download it).
  const { default: bundled } = await import("@sparticuz/chromium-min");
  const pack = process.env.CHROMIUM_PACK_URL || `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM}/chromium-v${CHROMIUM}-pack.${process.arch === "arm64" ? "arm64" : "x64"}.tar`;
  return chromium.launch({ executablePath: await bundled.executablePath(pack), args: bundled.args, headless: true });
}

export const DEVICES = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
} as const;

/** Opens an address in a fresh browser, runs `work`, and always closes it. */
export async function withPage<T>(
  address: string,
  opts: { device?: keyof typeof DEVICES; ownOrigin: string },
  work: (page: Page) => Promise<T>,
): Promise<T> {
  const url = new URL(address);
  const own = new URL(opts.ownOrigin).origin;
  if (url.origin !== own) await assertPublic(url);
  const browser = await launch();
  const allowed = new Map<string, boolean>();
  try {
    const d = DEVICES[opts.device ?? "desktop"];
    const context = await browser.newContext({
      viewport: { width: d.width, height: d.height },
      deviceScaleFactor: d.deviceScaleFactor,
      isMobile: d.isMobile,
      hasTouch: d.isMobile,
      ...(d.isMobile
        ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }
        : {}),
    });
    // Every request the page makes is checked, not just the first.
    await context.route("**/*", async (route) => {
      try {
        const u = new URL(route.request().url());
        if (u.origin === own) return route.continue();
        if (!["http:", "https:"].includes(u.protocol)) return route.abort();
        if (!allowed.has(u.host)) allowed.set(u.host, await assertPublic(u).then(() => true, () => false));
        return allowed.get(u.host) ? route.continue() : route.abort();
      } catch {
        return route.abort();
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.goto(url.toString(), { waitUntil: "load", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {});
    return await work(page);
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Scrolls through the page so lazy images load and scroll animations play, then back to the top. */
export async function wake(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight && y < 30_000; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

/* ---------- Screenshots, kept briefly for the transcript ---------- */

type Shot = { at: number; type: string; data: Buffer };
const shots = ((globalThis as { __jomiezShots?: Map<string, Shot> }).__jomiezShots ??= new Map());

export function keepShot(data: Buffer, type = "image/jpeg") {
  const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  shots.set(id, { at: Date.now(), type, data });
  // The newest 40 are kept; they're for looking at during a conversation, not for storage.
  for (const key of [...shots.keys()].slice(0, Math.max(0, shots.size - 40))) shots.delete(key);
  return { id, url: `/api/agent/shot?id=${id}` };
}

export const getShot = (id: string) => shots.get(id) ?? null;

/* ---------- Gemini models, chosen from what the key can use ---------- */

type GoogleModel = { id: string; methods: string[] };
const modelCache = new Map<string, { at: number; models: GoogleModel[] }>();

async function googleModels(key: string): Promise<GoogleModel[]> {
  const hit = modelCache.get(key);
  if (hit && Date.now() - hit.at < 3_600_000) return hit.models;
  const base = (process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const res = await fetch(`${base}/v1beta/models?pageSize=200`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Gemini wouldn't list its models (${res.status}).`);
  const j = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const models = (j.models ?? []).map((m) => ({ id: m.name.replace(/^models\//, ""), methods: m.supportedGenerationMethods ?? [] }));
  modelCache.set(key, { at: Date.now(), models });
  return models;
}

const version = (id: string) => Number(/(\d+(?:\.\d+)?)/.exec(id)?.[1] ?? 0);

/** The newest everyday Gemini model that can look at images ("flash", not lite, not preview if a stable one exists). */
export async function pickVisionModel(key: string) {
  const ids = (await googleModels(key))
    .filter((m) => m.methods.includes("generateContent") && /^gemini-/.test(m.id))
    .map((m) => m.id)
    .filter((id) => !/(tts|live|audio|image|embedding|thinking|exp|robotics|computer|native|learnlm|aqa)/i.test(id));
  const score = (id: string) => version(id) * 10 + (/flash/.test(id) ? 3 : 0) - (/lite/.test(id) ? 2 : 0) - (/preview/.test(id) ? 1 : 0);
  return ids.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** The newest model that makes images: a Gemini image model, else Imagen. */
export async function pickImageModel(key: string) {
  const models = await googleModels(key);
  const gemini = models.filter((m) => /^gemini-.*image/.test(m.id) && m.methods.includes("generateContent") && !/tts|live/.test(m.id));
  const imagen = models.filter((m) => /^imagen-/.test(m.id) && m.methods.includes("predict"));
  const best = (list: GoogleModel[]) => list.map((m) => m.id).sort((a, b) => version(b) - version(a) || Number(/preview/.test(a)) - Number(/preview/.test(b)))[0];
  return best(gemini) ?? best(imagen) ?? null;
}

/* ---------- Seeing ---------- */

export type Sight = {
  /** A Gemini key: used first, it sees well and cheaply. */
  geminiKey?: string;
  visionModel?: string;
  imageModel?: string;
  /** The main model, used when there's no Gemini key and it can see (Claude, GPT, Gemini). */
  main?: { provider: ProviderId; model: string; apiKey: string; baseURL?: string | null };
};

const SEEING_PROVIDERS: ProviderId[] = ["anthropic", "openai", "google"];

export const canSee = (s: Sight) => Boolean(s.geminiKey || (s.main && SEEING_PROVIDERS.includes(s.main.provider)));

/** Fetches an image to look at: a screenshot id, a site path or any public address. */
export async function loadImage(ref: string, ownOrigin: string): Promise<{ data: Buffer; type: string }> {
  const shotId = /^s[a-z0-9]{8,}$/.exec(ref)?.[0] ?? /[?&]id=(s[a-z0-9]+)/.exec(ref)?.[1];
  if (shotId) {
    const shot = getShot(shotId);
    if (!shot) throw new Error("That screenshot has expired; take it again.");
    return { data: shot.data, type: shot.type };
  }
  const url = new URL(ref, ownOrigin);
  const res = url.origin === new URL(ownOrigin).origin ? await fetch(url, { signal: AbortSignal.timeout(20_000) }) : null;
  if (res) {
    if (!res.ok) throw new Error(`That image answered ${res.status}.`);
    return { data: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") ?? "image/jpeg" };
  }
  const got = await safeFetch(url.toString(), { maxBytes: 12_000_000, timeoutMs: 30_000 });
  if (got.status >= 400) throw new Error(`That image answered ${got.status}.`);
  if (!got.type.startsWith("image/")) throw new Error(`That address isn't an image (${got.type || "unknown type"}).`);
  return { data: got.body, type: got.type.split(";")[0] };
}

/** Looks at one or more images and answers a question about them, in words. */
export async function see(sight: Sight, images: { data: Buffer; type: string }[], question: string): Promise<string> {
  const prompt = `${question}\n\nAnswer plainly and specifically: what you actually see (layout, text, colours, people, objects, mood), anything that looks broken, cut off, overlapping or out of place, and where it is. Don't guess at what isn't visible.`;
  if (sight.geminiKey) {
    const model = sight.visionModel || (await pickVisionModel(sight.geminiKey));
    if (!model) throw new Error("This Gemini key has no model that can look at images.");
    const base = process.env.GEMINI_API_BASE_URL?.replace(/\/$/, "");
    const ai = new GoogleGenAI({ apiKey: sight.geminiKey, ...(base ? { httpOptions: { baseUrl: base } } : {}) });
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.type, data: i.data.toString("base64") } })), { text: prompt }] }],
    });
    return (res.text ?? "").trim() || "(It saw nothing it could describe.)";
  }
  if (sight.main && SEEING_PROVIDERS.includes(sight.main.provider)) {
    const { text } = await generateText({
      model: buildModel(sight.main),
      messages: [{ role: "user", content: [...images.map((i) => ({ type: "image" as const, image: i.data, mediaType: i.type })), { type: "text" as const, text: prompt }] }],
    });
    return text.trim();
  }
  throw new Error("Seeing needs a Gemini key (Agent settings → Voice, or GEMINI_API_KEY), or a main model that can see images (Claude, GPT or Gemini).");
}

/* ---------- Finding the images on a page ---------- */

export type FoundImage = { src: string; alt: string; width: number; height: number; near: string };

export async function imagesOn(page: Page): Promise<FoundImage[]> {
  await wake(page);
  const found = await page.evaluate(() => {
    const out: { src: string; alt: string; width: number; height: number; near: string }[] = [];
    const nearText = (el: Element) => {
      let node: Element | null = el;
      for (let i = 0; i < 6 && node; i++, node = node.parentElement) {
        const h = node.querySelector("h1,h2,h3,h4,figcaption,[class*=title],[class*=name]");
        const t = (h?.textContent || "").replace(/\s+/g, " ").trim();
        if (t) return t.slice(0, 120);
      }
      return "";
    };
    const best = (img: HTMLImageElement) => {
      const set = img.srcset || img.getAttribute("data-srcset") || "";
      const widest = set
        .split(",")
        .map((s) => s.trim().split(/\s+/))
        .filter((p) => p[0])
        .sort((a, b) => parseFloat(b[1] || "0") - parseFloat(a[1] || "0"))[0]?.[0];
      return widest || img.currentSrc || img.src || img.getAttribute("data-src") || "";
    };
    for (const img of Array.from(document.images)) {
      const r = img.getBoundingClientRect();
      out.push({ src: best(img), alt: img.alt || "", width: img.naturalWidth || Math.round(r.width), height: img.naturalHeight || Math.round(r.height), near: nearText(img) });
    }
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg !== "none" ? /url\(["']?([^"')]+)["']?\)/.exec(bg) : null;
      if (!m || m[1].startsWith("data:")) continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 20_000) continue;
      out.push({ src: m[1], alt: el.getAttribute("aria-label") || "", width: Math.round(r.width), height: Math.round(r.height), near: nearText(el) });
    }
    const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
    if (og) out.push({ src: og, alt: "Share image (og:image)", width: 1200, height: 630, near: document.title });
    return out;
  });
  const base = page.url();
  const seen = new Set<string>();
  // Resized copies (Next.js /_next/image) point back at the original file: list the original.
  const original = (src: string) => {
    try {
      const u = new URL(src, base);
      const inner = u.pathname === "/_next/image" ? u.searchParams.get("url") : null;
      return inner ? new URL(inner, base).toString() : u.toString();
    } catch {
      return "";
    }
  };
  return found
    .map((f) => ({ ...f, src: original(f.src) }))
    .filter((f) => f.src && !f.src.startsWith("data:") && f.width * f.height >= 120 * 120 && !seen.has(f.src) && seen.add(f.src))
    .sort((a, b) => b.width * b.height - a.width * a.height);
}

/* ---------- Making images ---------- */

export async function makeImage(sight: Sight, prompt: string, aspect: string): Promise<{ data: Buffer; type: string; model: string }> {
  if (!sight.geminiKey) throw new Error("Making images needs a Gemini key (Agent settings → Voice, or GEMINI_API_KEY).");
  const model = sight.imageModel || (await pickImageModel(sight.geminiKey));
  if (!model) throw new Error("This Gemini key has no image model.");
  const base = process.env.GEMINI_API_BASE_URL?.replace(/\/$/, "");
  const ai = new GoogleGenAI({ apiKey: sight.geminiKey, ...(base ? { httpOptions: { baseUrl: base } } : {}) });
  if (/^imagen-/.test(model)) {
    const res = await ai.models.generateImages({ model, prompt, config: { numberOfImages: 1, aspectRatio: aspect } });
    const bytes = res.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) throw new Error("The image model returned nothing (it may have refused the prompt).");
    return { data: Buffer.from(bytes, "base64"), type: res.generatedImages?.[0]?.image?.mimeType || "image/png", model };
  }
  const res = await ai.models.generateContent({
    model,
    contents: `${prompt}\n\nAspect ratio ${aspect}. No text, letters, logos or watermarks in the image.`,
    config: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: aspect } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error(`The image model returned no image${res.text ? `: ${res.text.slice(0, 200)}` : " (it may have refused the prompt)"}.`);
  return { data: Buffer.from(part.inlineData.data, "base64"), type: part.inlineData.mimeType || "image/png", model };
}

/* ---------- Licensed photos ---------- */

export type Photo = { url: string; thumb: string; by: string; source: string; license: string; page: string; width: number; height: number; alt: string };

/**
 * Photos that may be used on a business site without asking: Pexels (with
 * PEXELS_API_KEY) or Openverse's public-domain and CC0 images (no key needed).
 */
export async function findPhotos(query: string, orientation?: "landscape" | "portrait" | "square"): Promise<Photo[]> {
  if (process.env.PEXELS_API_KEY) {
    const u = new URL("https://api.pexels.com/v1/search");
    u.searchParams.set("query", query);
    u.searchParams.set("per_page", "15");
    if (orientation) u.searchParams.set("orientation", orientation);
    const res = await fetch(u, { headers: { authorization: process.env.PEXELS_API_KEY }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Pexels answered ${res.status}.`);
    const j = (await res.json()) as {
      photos?: { url: string; width: number; height: number; alt?: string; photographer: string; src: { original: string; large2x: string; medium: string } }[];
    };
    return (j.photos ?? []).map((p) => ({
      url: p.src.large2x || p.src.original,
      thumb: p.src.medium,
      by: p.photographer,
      source: "Pexels",
      license: "Pexels licence (free for commercial use, no permission needed)",
      page: p.url,
      width: p.width,
      height: p.height,
      alt: p.alt ?? "",
    }));
  }
  const u = new URL("https://api.openverse.org/v1/images/");
  u.searchParams.set("q", query);
  u.searchParams.set("license", "cc0,pdm");
  u.searchParams.set("page_size", "15");
  if (orientation) u.searchParams.set("aspect_ratio", orientation === "landscape" ? "wide" : orientation === "portrait" ? "tall" : "square");
  const res = await fetch(u, { headers: { "user-agent": "JomiezAgent/1.0 (+https://jomiez.com)" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Openverse answered ${res.status}.`);
  const j = (await res.json()) as {
    results?: { url: string; thumbnail?: string; creator?: string; source?: string; license: string; foreign_landing_url?: string; width?: number; height?: number; title?: string }[];
  };
  return (j.results ?? []).map((p) => ({
    url: p.url,
    thumb: p.thumbnail ?? p.url,
    by: p.creator ?? "unknown",
    source: `Openverse (${p.source ?? "various"})`,
    license: p.license === "cc0" ? "CC0 (public domain dedication)" : "Public domain",
    page: p.foreign_landing_url ?? p.url,
    width: p.width ?? 0,
    height: p.height ?? 0,
    alt: p.title ?? "",
  }));
}
