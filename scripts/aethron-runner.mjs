#!/usr/bin/env node
/*
 * The Aethron runner: lets Keeper (on jomiez.com) use the Aethron app on this
 * Mac, and puts finished previews online.
 *
 *   JOMIEZ_KEY=jz_… node scripts/aethron-runner.mjs
 *
 * The key is an access key with only the "Aethron runner" permission (admin →
 * Agent → Access keys → Connect an agent). The runner reaches out to jomiez.com
 * over HTTPS and asks for work; nothing on this Mac is opened to the internet.
 * It only ever runs Aethron's preview tools (the list below), whatever it's
 * sent, and only uploads files from Aethron's own previews folder.
 *
 * Settings (environment variables, all optional except the key):
 *   JOMIEZ_URL    https://www.jomiez.com
 *   AETHRON_BIN   /Applications/Aethron.app/Contents/MacOS/Aethron
 *   AETHRON_DATA  ~/Library/Application Support/Aethron
 *   --check       connect, list Aethron's tools, and stop
 *
 * Needs Node 18 or newer. No packages to install.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";

const VERSION = "1.0.0";
const SITE = (process.env.JOMIEZ_URL || "https://www.jomiez.com").replace(/\/$/, "");
const KEY = process.env.JOMIEZ_KEY || "";
const BIN = process.env.AETHRON_BIN || "/Applications/Aethron.app/Contents/MacOS/Aethron";
const ARGS = (process.env.AETHRON_ARGS || "--mcp").split(" ").filter(Boolean);
const DATA = process.env.AETHRON_DATA || path.join(os.homedir(), "Library", "Application Support", "Aethron");
const CHECK = process.argv.includes("--check");

// The only Aethron tools the runner will run (the same list as cms/sites/aethron.ts).
const ALLOWED = new Set(["create_project", "fetch", "inventory", "preview_pages", "make_preview", "preview_ribbon", "get_content", "set_content_bulk", "add_block", "export_preview", "learn_brand", "search_brand", "delete_project"]);

const MAX_FILE = 50 * 1024 * 1024;
const MAX_FILES = 6000;
const TYPES = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8", cjs: "text/javascript; charset=utf-8",
  json: "application/json", map: "application/json", txt: "text/plain; charset=utf-8", xml: "application/xml", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wasm: "application/wasm", pdf: "application/pdf", webmanifest: "application/manifest+json",
};

const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!/^jz_[A-Za-z0-9_-]{43}$/.test(KEY)) {
  console.error("Set JOMIEZ_KEY to an access key with the “Aethron runner” permission (admin → Agent → Access keys).");
  process.exit(1);
}

/* ---------- jomiez.com ---------- */

async function api(action, body, { tries = 6 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(`${SITE}/api/v1/runner/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${KEY}`, "user-agent": `aethron-runner/${VERSION}` },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(90_000),
      });
      const out = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        console.error(`jomiez.com refused the key: ${out.error ?? res.status}. Make a new one with only the “Aethron runner” permission.`);
        process.exit(1);
      }
      // Too many requests: wait as long as the server says, then try again (an answer is never dropped for this).
      if (res.status === 429 && i < 20) {
        await sleep(Math.min(60, Number(res.headers.get("retry-after")) || 5) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(out.error || `jomiez.com answered ${res.status}`);
      return out;
    } catch (err) {
      if (i >= tries) throw err;
      await sleep(Math.min(30_000, 1000 * 2 ** i));
    }
  }
}

/* ---------- Aethron (MCP over stdio) ---------- */

let child = null;
let seq = 1;
const pending = new Map();
let aethronInfo = "";

function startAethron() {
  return new Promise((resolve, reject) => {
    log(`Starting Aethron: ${BIN} ${ARGS.join(" ")}`);
    child = spawn(BIN, ARGS, { stdio: ["pipe", "pipe", "pipe"] });
    child.on("error", (err) => reject(new Error(`Couldn't start Aethron (${err.message}). Is it installed at ${BIN}? Set AETHRON_BIN if not.`)));
    child.on("exit", (code) => {
      log(`Aethron stopped (code ${code}).`);
      for (const [, p] of pending) p.reject(new Error("Aethron stopped while working."));
      pending.clear();
      child = null;
    });
    createInterface({ input: child.stderr }).on("line", (l) => process.env.AETHRON_VERBOSE && log("[aethron]", l));
    createInterface({ input: child.stdout }).on("line", (line) => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        return; // not a protocol message
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.error) p.reject(new Error(msg.error.message || "Aethron error"));
        else p.resolve(msg.result);
      }
    });
    resolve();
  });
}

function rpc(method, params, timeoutMs = 120_000) {
  if (!child) return Promise.reject(new Error("Aethron isn't running."));
  const id = seq++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Aethron didn't answer ${method} within ${Math.round(timeoutMs / 1000)} s.`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
}

async function connectAethron() {
  await startAethron();
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "jomiez-aethron-runner", version: VERSION } }, 60_000);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  aethronInfo = `${init?.serverInfo?.name ?? "Aethron"} ${init?.serverInfo?.version ?? ""}`.trim();
  const { tools = [] } = (await rpc("tools/list", {}, 60_000)) ?? {};
  return tools.filter((t) => ALLOWED.has(t.name)).map((t) => ({ name: t.name, description: String(t.description ?? "").slice(0, 4000), inputSchema: t.inputSchema }));
}

/* ---------- Uploading an exported preview ---------- */

async function walk(dir, base = dir, out = []) {
  for (const name of await readdir(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const st = await lstat(full);
    if (st.isSymbolicLink()) continue; // never follow a link out of the folder
    if (st.isDirectory()) await walk(full, base, out);
    else if (st.isFile()) {
      if (st.size > MAX_FILE) throw new Error(`${path.relative(base, full)} is over 50 MB.`);
      out.push(full);
      if (out.length > MAX_FILES) throw new Error(`More than ${MAX_FILES} files.`);
    }
  }
  return out;
}

async function upload({ project, slug }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(project)) throw new Error("That isn't a preview name.");
  const root = path.join(DATA, "previews");
  const folder = path.resolve(root, project);
  if (!folder.startsWith(root + path.sep)) throw new Error("That folder isn't one of Aethron's previews.");
  const paths = await walk(folder);
  const files = [];
  const data = new Map();
  for (const full of paths) {
    const buf = await readFile(full);
    const hash = createHash("sha256").update(buf).digest("hex");
    const ext = path.extname(full).slice(1).toLowerCase();
    files.push({ path: path.relative(folder, full).split(path.sep).join("/"), hash, size: buf.length, type: TYPES[ext] ?? "application/octet-stream" });
    data.set(hash, full);
  }
  const { upload: targets = [], already_stored = 0 } = await api("upload", { slug, files });
  let sent = 0;
  let bytes = 0;
  const queue = [...targets];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let t = queue.shift(); t; t = queue.shift()) {
        const buf = await readFile(data.get(t.hash));
        for (let i = 1; ; i++) {
          const res = await fetch(t.url, { method: t.method, headers: t.headers, body: buf, signal: AbortSignal.timeout(300_000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
          if (res.ok) break;
          if (i >= 3) throw new Error(`Upload failed (${res.status} ${(await res.text()).slice(0, 200)}).`);
          await sleep(2000 * i);
        }
        sent++;
        bytes += buf.length;
      }
    }),
  );
  const done = await api("publish", { slug, project, files });
  return `Uploaded ${sent} new files (${(bytes / 1048576).toFixed(1)} MB); ${already_stored} were already stored. ${done.files} files online.`;
}

/* ---------- The work ---------- */

async function handle(job) {
  if (job.type === "upload") return { ok: true, result: await upload(job) };
  if (job.type !== "mcp" || !ALLOWED.has(job.tool)) return { ok: false, result: `The runner doesn't run ${job.tool ?? job.type}.` };
  if (!child) await connectAethron();
  const long = job.tool === "export_preview" || job.tool === "fetch";
  const result = await rpc("tools/call", { name: job.tool, arguments: job.args ?? {} }, long ? 20 * 60_000 : 5 * 60_000);
  return { ok: !result?.isError, result };
}

async function main() {
  const tools = await connectAethron();
  log(`Aethron is ready (${aethronInfo}); ${tools.length} preview tools.`);
  const hello = await api("hello", { name: os.hostname(), version: VERSION, aethron: aethronInfo, tools });
  log(`Connected to ${SITE}. Previews are stored in ${hello.storage === "supabase" ? "Supabase" : "the server's own disk"}.`);
  if (CHECK) {
    for (const t of tools) log(`  ${t.name}`);
    child?.kill();
    return;
  }
  log("Waiting for Keeper. Leave this window open (Ctrl+C stops it).");
  for (;;) {
    let job;
    try {
      ({ job } = await api("next", { wait: 20 }));
    } catch (err) {
      log(`Can't reach ${SITE} (${err.message}); trying again.`);
      await sleep(10_000);
      continue;
    }
    if (!job) continue;
    log(`→ ${job.type === "upload" ? `upload ${job.slug}` : job.tool}`);
    // Keep saying "still here" while a long job runs.
    const beat = setInterval(() => api("hello", { name: os.hostname(), version: VERSION, aethron: aethronInfo }).catch(() => {}), 30_000);
    let out;
    try {
      out = await handle(job);
    } catch (err) {
      out = { ok: false, result: err.message };
    } finally {
      clearInterval(beat);
    }
    log(`${out.ok ? "✓" : "✗"} ${job.type === "upload" ? "upload" : job.tool}${out.ok ? "" : `: ${String(typeof out.result === "string" ? out.result : JSON.stringify(out.result)).slice(0, 200)}`}`);
    await api("result", { id: job.id, ok: out.ok, result: out.result }).catch((err) => log(`Couldn't send the answer back (${err.message}).`));
  }
}

process.on("SIGINT", () => {
  child?.kill();
  process.exit(0);
});

main().catch((err) => {
  console.error(err.message);
  child?.kill();
  process.exit(1);
});
