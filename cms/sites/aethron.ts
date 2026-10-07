import { relay, runnerStatus } from "./relay";

/*
 * Talking to Aethron, the app that turns a Framer or Webflow template into a
 * personalised site (see the Aethron handoff). Two ways, chosen by settings:
 *
 * - On the owner's Mac (default): through the Aethron runner (relay.ts).
 * - Hosted: when AETHRON_MCP_URL and AETHRON_MCP_TOKEN are set, straight to
 *   its MCP server over HTTPS.
 *
 * Either way the answer comes back the same: did it work, its words, and its
 * data when it sent some.
 */

export type Answer = { ok: boolean; text: string; data: unknown };

/** The Aethron tools Keeper may use: making and filling previews, and preparing templates. */
export const AETHRON_TOOLS = [
  "create_project",
  "fetch",
  "inventory",
  "preview_pages",
  "make_preview",
  "preview_ribbon",
  "get_content",
  "set_content_bulk",
  "add_block",
  "export_preview",
  "learn_brand",
  "search_brand",
  "delete_project",
] as const;

export type AethronTool = (typeof AETHRON_TOOLS)[number];

const hosted = () => {
  const url = process.env.AETHRON_MCP_URL?.trim();
  const token = process.env.AETHRON_MCP_TOKEN?.trim();
  return url && token ? { url, token } : null;
};

export function aethronStatus() {
  const h = hosted();
  if (h) return { mode: "hosted" as const, ready: true, where: new URL(h.url).host };
  const r = runnerStatus();
  return { mode: "runner" as const, ready: r.connected, runner: r };
}

/** An MCP tool result, read the same whichever way it came. */
export function readResult(raw: unknown, ok = true): Answer {
  if (typeof raw === "string") return { ok, text: raw, data: parseJson(raw) };
  const r = (raw ?? {}) as { content?: { type: string; text?: string }[]; structuredContent?: unknown; isError?: boolean };
  const text = (r.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("\n");
  return { ok: ok && !r.isError, text: text || (r.structuredContent ? JSON.stringify(r.structuredContent) : ""), data: r.structuredContent ?? parseJson(text) };
}

function parseJson(text: string): unknown {
  const t = text.trim();
  if (!/^[[{]/.test(t)) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

/* ---------- Hosted: MCP over HTTPS ---------- */

let session: { url: string; id?: string; ready: Promise<void> } | null = null;
let seq = 1;

async function rpc(url: string, token: string, method: string, params: unknown, timeoutMs: number, sessionId?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: seq++, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 202) return { result: null, sessionId: res.headers.get("mcp-session-id") ?? undefined };
  const body = (await res.json().catch(() => null)) as { result?: unknown; error?: { message?: string } } | null;
  if (!res.ok || !body) throw new Error(`Aethron answered ${res.status}${body?.error?.message ? `: ${body.error.message}` : ""}.`);
  if (body.error) throw new Error(`Aethron: ${body.error.message ?? "error"}`);
  return { result: body.result, sessionId: res.headers.get("mcp-session-id") ?? undefined };
}

async function hostedCall(h: { url: string; token: string }, tool: string, args: Record<string, unknown>, timeoutMs: number): Promise<Answer> {
  if (!session || session.url !== h.url) {
    const s: { url: string; id?: string; ready: Promise<void> } = { url: h.url, ready: Promise.resolve() };
    s.ready = (async () => {
      const init = await rpc(h.url, h.token, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "jomiez-keeper", version: "1.0.0" } }, 30_000);
      s.id = init.sessionId;
      await fetch(h.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${h.token}`, ...(s.id ? { "mcp-session-id": s.id } : {}) },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      }).catch(() => undefined);
    })();
    session = s;
  }
  try {
    await session.ready;
    const { result } = await rpc(h.url, h.token, "tools/call", { name: tool, arguments: args }, timeoutMs, session.id);
    return readResult(result);
  } catch (err) {
    session = null;
    return { ok: false, text: (err as Error).message, data: undefined };
  }
}

/* ---------- Either way ---------- */

/** Calls one Aethron tool. Exports take minutes: give them the time. */
export async function aethron(tool: AethronTool, args: Record<string, unknown>, timeoutMs = tool === "export_preview" || tool === "fetch" ? 15 * 60_000 : 3 * 60_000): Promise<Answer> {
  if (!(AETHRON_TOOLS as readonly string[]).includes(tool)) return { ok: false, text: `Keeper may not use the Aethron tool ${tool}.`, data: undefined };
  const h = hosted();
  if (h) return hostedCall(h, tool, args, timeoutMs);
  const r = await relay({ type: "mcp", tool, args }, timeoutMs);
  return readResult(r.result, r.ok);
}

/** Puts an exported preview's files where jomiez.com serves them from (the runner uploads them from the Mac). */
export async function uploadExport(project: string, slug: string): Promise<Answer> {
  if (hosted()) return { ok: true, text: "Served from the hosted Aethron.", data: { hosted: true } };
  const r = await relay({ type: "upload", project, slug }, 20 * 60_000);
  return { ok: r.ok, text: typeof r.result === "string" ? r.result : JSON.stringify(r.result), data: r.result };
}
