import fs from "node:fs";
import os from "node:os";
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
/** The browser takes about 300 MB on top of the site: below this, starting one would crash the site. */
const BROWSER_NEEDS_MB = 1500;

/** The memory this server may use: its container's limit when it has one, else the machine's. */
function memoryMB() {
  let limit = os.totalmem();
  for (const file of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
    try {
      const n = Number(fs.readFileSync(file, "utf8").trim());
      if (Number.isFinite(n) && n > 0) limit = Math.min(limit, n);
    } catch {}
  }
  return Math.round(limit / 2 ** 20);
}

const localBrowser = () => process.env.BROWSER_EXECUTABLE_PATH || [...MAC_BROWSERS, ...WINDOWS_BROWSERS].find((p) => fs.existsSync(p));

/** Whether this server can open a real browser, and if not, why. */
export function browserAvailable(): { ok: true } | { ok: false; why: string } {
  if (process.env.BROWSER_WS_ENDPOINT || localBrowser()) return { ok: true };
  if (process.platform !== "linux") return { ok: false, why: "No browser found. Install Google Chrome, or set BROWSER_EXECUTABLE_PATH." };
  if (memoryMB() < BROWSER_NEEDS_MB) {
    return {
      ok: false,
      why: `This server has ${memoryMB()} MB of memory, and a browser needs about 300 MB more than the site uses. Set BROWSER_WS_ENDPOINT to a browser service (Browserless has a free plan), or move to a plan with 2 GB.`,
    };
  }
  return { ok: true };
}

async function launch(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  // A browser service (e.g. Browserless), when the server is too small to run one.
  if (process.env.BROWSER_WS_ENDPOINT) return chromium.connectOverCDP(process.env.BROWSER_WS_ENDPOINT);
  const local = localBrowser();
  if (local) return chromium.launch({ executablePath: local, headless: true });
  const can = browserAvailable();
  if (!can.ok) throw new Error(`A browser isn't available on this server. ${can.why}`);
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

/* ---------- Screenshots without a browser here ---------- */

/**
 * A screenshot from a screenshot service (Microlink), for servers with no room
 * for a browser (Render's free plan). Free without an account, with a small
 * daily allowance per server address; MICROLINK_API_KEY lifts it. This site's
 * pages get a throwaway query, so the service never answers with an old copy.
 */
export async function serviceShot(
  address: string,
  opts: { device?: keyof typeof DEVICES; ownOrigin: string; fullPage?: boolean; selector?: string },
): Promise<Buffer> {
  const url = new URL(address);
  await assertPublic(url);
  if (url.origin === new URL(opts.ownOrigin).origin) url.searchParams.set("jzshot", Date.now().toString(36));
  const d = DEVICES[opts.device ?? "desktop"];
  const key = process.env.MICROLINK_API_KEY;
  const api = new URL(key ? "https://pro.microlink.io" : "https://api.microlink.io");
  const q = api.searchParams;
  q.set("url", url.toString());
  q.set("screenshot", "true");
  q.set("meta", "false");
  q.set("screenshot.type", "jpeg");
  q.set("viewport.width", String(d.width));
  q.set("viewport.height", String(d.height));
  q.set("viewport.deviceScaleFactor", String(d.deviceScaleFactor));
  q.set("viewport.isMobile", String(d.isMobile));
  q.set("waitForTimeout", "1500");
  if (opts.fullPage) q.set("screenshot.fullPage", "true");
  if (opts.selector) q.set("screenshot.element", opts.selector);
  const res = await fetch(api, { headers: key ? { "x-api-key": key } : {}, signal: AbortSignal.timeout(60_000) });
  const out = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: { screenshot?: { url?: string } } } | null;
  if (res.status === 429) {
    throw new Error(
      "The screenshot service has used today's free allowance (it's shared per server and resets daily). For dependable screenshots, set BROWSER_WS_ENDPOINT to a browser service (Browserless has a free plan).",
    );
  }
  const shotUrl = out?.data?.screenshot?.url;
  if (!res.ok || out?.status !== "success" || !shotUrl) {
    throw new Error(`The screenshot service couldn't take it (${res.status}${out?.message ? `: ${out.message.slice(0, 160)}` : ""}).`);
  }
  const got = await safeFetch(shotUrl, { maxBytes: 20_000_000, timeoutMs: 30_000 });
  if (got.status >= 400 || !got.type.startsWith("image/")) throw new Error(`The screenshot service's image didn't load (${got.status}).`);
  return got.body;
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
  /** The main model: used when there's no Gemini key, or Gemini fails. Most current models can see (Claude, GPT, Gemini, DeepSeek…). */
  main?: { provider: ProviderId; model: string; apiKey: string; baseURL?: string | null };
};

export const canSee = (s: Sight) => Boolean(s.geminiKey || s.main);

/** What went wrong with a model provider, in plain words, naming the cause (not just "it failed"). */
export function providerProblem(err: unknown): string {
  // After retries, the AI SDK wraps the last answer: that's the one with the reason.
  const last = (err as { lastError?: unknown } | null)?.lastError;
  if (last) return providerProblem(last);
  const e = err as { message?: string; status?: number; statusCode?: number; responseBody?: string; code?: number | string };
  const status = e?.statusCode ?? e?.status ?? (typeof e?.code === "number" ? e.code : undefined);
  const text = `${e?.message ?? String(err)} ${e?.responseBody ?? ""}`;
  if (status === 402 || /\b402\b|prepay|credit|balance|billing|payment required|insufficient.?(funds|quota)/i.test(text)) return "the account is out of credit (402). Top it up, or remove that key";
  if (status === 429 || /\b429\b|rate.?limit|resource.?exhausted|too many requests/i.test(text)) return "too many requests right now (429); try again in a minute";
  if (status === 401 || status === 403 || /\b40[13]\b|api.?key|unauthori[sz]ed|permission/i.test(text)) return "it refused the key (check it in Agent settings → Your providers)";
  if (/image|vision|multimodal|unsupported (content|media)|does not support/i.test(text)) return "this model doesn't accept images";
  if (/model/i.test(text) && /not.?found|does not exist|unknown|not exist/i.test(text)) return "it doesn't know that model name";
  return (e?.message ?? String(err)).replace(/\s+/g, " ").slice(0, 200);
}

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
  // Gemini first (cheap and good at it), then the main model: one failing doesn't stop the other.
  const failed: string[] = [];
  if (sight.geminiKey) {
    let model = sight.visionModel || "";
    try {
      model ||= (await pickVisionModel(sight.geminiKey)) ?? "";
      if (!model) throw new Error("This Gemini key has no model that can look at images.");
      const base = process.env.GEMINI_API_BASE_URL?.replace(/\/$/, "");
      const ai = new GoogleGenAI({ apiKey: sight.geminiKey, ...(base ? { httpOptions: { baseUrl: base } } : {}) });
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.type, data: i.data.toString("base64") } })), { text: prompt }] }],
      });
      return (res.text ?? "").trim() || "(It saw nothing it could describe.)";
    } catch (err) {
      failed.push(`Gemini${model ? ` (${model})` : ""}: ${providerProblem(err)}.`);
    }
  }
  if (sight.main) {
    try {
      const { text } = await generateText({
        model: buildModel(sight.main),
        messages: [{ role: "user", content: [...images.map((i) => ({ type: "file" as const, data: i.data, mediaType: i.type })), { type: "text" as const, text: prompt }] }],
      });
      if (failed.length) return `${text.trim()}\n\n(Seen with the main model, ${sight.main.model}. ${failed[0]})`;
      return text.trim();
    } catch (err) {
      failed.push(`The main model (${sight.main.model}): ${providerProblem(err)}.`);
    }
  }
  if (!failed.length) throw new Error("Seeing needs a model that can look at images: add one in Agent settings → Your providers (or set GEMINI_API_KEY).");
  throw new Error(`Couldn't look at the image. ${failed.join(" ")}`);
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
  return tidy(found, page.url());
}

/** Original files (not resized copies), no tiny icons or repeats, largest first. Sizes of 0 are unknown. */
function tidy(found: FoundImage[], base: string): FoundImage[] {
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
    .filter((f) => f.src && !f.src.startsWith("data:") && (!f.width || f.width * f.height >= 120 * 120) && !seen.has(f.src) && seen.add(f.src))
    .sort((a, b) => b.width * b.height - a.width * a.height);
}

/** The images in a page's HTML, for servers without a browser: images added later by JavaScript are missed. */
export async function imagesInHtml(address: string, ownOrigin: string): Promise<FoundImage[]> {
  const url = new URL(address);
  const html =
    url.origin === new URL(ownOrigin).origin
      ? await (await fetch(url, { signal: AbortSignal.timeout(20_000) })).text()
      : (await safeFetch(url.toString(), { maxBytes: 5_000_000, timeoutMs: 30_000 })).body.toString("utf8");
  const unescape = (v: string) => v.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const attr = (tag: string, name: string) => {
    const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
    return unescape(m?.[1] ?? m?.[2] ?? "");
  };
  const found: FoundImage[] = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const set = attr(tag, "srcset") || attr(tag, "data-srcset");
    const widest = set
      .split(/,\s+/)
      .map((p) => p.trim().split(/\s+/))
      .filter((p) => p[0])
      .sort((a, b) => parseFloat(b[1] || "0") - parseFloat(a[1] || "0"))[0]?.[0];
    const heading = [...html.slice(Math.max(0, (m.index ?? 0) - 4000), m.index).matchAll(/<(h[1-4]|figcaption)[^>]*>([\s\S]*?)<\/\1>/gi)].pop()?.[2] ?? "";
    found.push({
      src: widest || attr(tag, "src") || attr(tag, "data-src"),
      alt: attr(tag, "alt"),
      width: Number(attr(tag, "width")) || 0,
      height: Number(attr(tag, "height")) || 0,
      near: heading.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120),
    });
  }
  const og = /<meta[^>]+property=["']og:image["'][^>]*>/i.exec(html)?.[0];
  if (og) found.push({ src: attr(og, "content"), alt: "Share image (og:image)", width: 1200, height: 630, near: "" });
  return tidy(found, url.toString());
}

/* ---------- Making images ---------- */

export async function makeImage(sight: Sight, prompt: string, aspect: string): Promise<{ data: Buffer; type: string; model: string }> {
  if (!sight.geminiKey) throw new Error("Making images needs a Gemini key (Agent settings → Your providers, or GEMINI_API_KEY).");
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
