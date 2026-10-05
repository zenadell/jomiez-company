import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/*
 * Reading web pages. Other websites go through `safeFetch`, which refuses
 * private and internal addresses (so a link can't be used to reach the server's
 * own network) and caps size and time. Pages come back as readable text.
 */

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateIp(ip: string) {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")) return true;
  const mapped = v6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? privateV4(mapped[1]) : false;
}

export async function assertPublic(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http and https addresses can be read.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("That address is private.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("That address is private.");
}

export async function safeFetch(input: string, { maxBytes = 1_500_000, timeoutMs = 15_000 } = {}) {
  let url = new URL(input);
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "JomiezAgent/1.0 (+https://jomiez.com)", accept: "text/html,application/json,text/plain,image/*;q=0.8,*/*;q=0.5" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return { url: url.toString(), status: res.status, type: res.headers.get("content-type") ?? "", body: Buffer.concat(chunks) };
  }
  throw new Error("Too many redirects.");
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const strip = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export type Outline = {
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
};

/** A page as something readable: title, description, headings, body text, links and images. */
export function outline(html: string, max = 12_000): Outline {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = decode(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? "");
  const headings = [...body.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => `${"#".repeat(Number(m[1]))} ${strip(m[2])}`).filter((h) => h.length > 2);
  const links = [...body.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: decode(m[1]), text: strip(m[2]) || (m[0].match(/aria-label=["']([^"']+)/)?.[1] ?? "") }))
    .filter((l, i, all) => all.findIndex((x) => x.href === l.href && x.text === l.text) === i)
    .slice(0, 120);
  const images = [...body.matchAll(/<img\s[^>]*>/gi)]
    .map((m) => ({ alt: decode(m[0].match(/alt=["']([^"']*)/)?.[1] ?? ""), src: m[0].match(/src=["']([^"']+)/)?.[1] ?? "" }))
    .slice(0, 60);
  const text = strip(
    body
      .replace(/<(h[1-6]|p|li|div|section|br|tr)[^>]*>/gi, "\n$&")
      .replace(/<\/(h[1-6]|p|li)>/gi, "$&\n"),
  ).slice(0, max);
  return { title, description, headings, text, links, images };
}

/** The site's own address, for reading its pages. */
export function siteOrigin(fromRequest?: string | null) {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    fromRequest ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}
