import { z } from "zod";
import { logCall } from "@/cms/connect/auth";
import { callOp, opNamed, opsFor } from "@/cms/connect/ops";
import { connect, noStore } from "@/cms/connect/serve";

/*
 * Keeper as an MCP server (Model Context Protocol, "Streamable HTTP" with
 * plain JSON answers), so Claude Code and other agents can use it as tools:
 *
 *   claude mcp add --transport http jomiez https://www.jomiez.com/api/mcp \
 *     --header "Authorization: Bearer jz_…"
 *
 * Every request needs the access key. The tools a client sees are only the
 * ones its key may use. The same operations are on the web API at /api/v1.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `This is Keeper, the AI operator of jomiez.com (Jomiez Innovation's website and admin). With these tools you can see what Keeper is doing (keeper_status, list_conversations, get_conversation, list_activity), look at outreach leads and settings, give Keeper tasks in plain words (ask_keeper), answer its approval requests (answer_approval) and control it (stop_conversation, undo_changes, set_keeper, set_routine), as far as this access key allows.
Keeper does the work with its own tools and the owner's permissions; you describe what you want. Long tasks keep running after ask_keeper answers: check them with get_conversation. Never claim Keeper did something unless a result shows it.`;

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const reply = (id: Rpc["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const fail = (id: Rpc["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

const schemaOf = (input: z.ZodType) => {
  const { $schema: _drop, ...schema } = z.toJSONSchema(input, { io: "input" }) as Record<string, unknown>;
  void _drop;
  return { type: "object", ...schema };
};

export async function POST(req: Request) {
  const c = await connect(req);
  if ("refusal" in c) return c.refusal;
  const { ctx } = c;
  const raw = (await req.json().catch(() => null)) as Rpc | Rpc[] | null;
  if (!raw || typeof raw !== "object") return Response.json(fail(null, -32700, "Send a JSON-RPC message."), { status: 400, headers: noStore });

  const answer = async (m: Rpc): Promise<object | null> => {
    if (m.id === undefined || m.id === null) return null; // a notification: nothing to answer
    switch (m.method) {
      case "initialize": {
        const asked = String(m.params?.protocolVersion ?? "");
        const client = m.params?.clientInfo as { name?: string; version?: string } | undefined;
        await logCall(ctx.payload, { key: ctx.key.id, name: ctx.key.name, ip: ctx.ip, via: "mcp", what: "connect", ok: true, note: client?.name ? `${client.name} ${client.version ?? ""}`.trim().slice(0, 80) : undefined }).catch(() => undefined);
        return reply(m.id, {
          protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "jomiez-keeper", title: "Jomiez · Keeper", version: "1.0.0" },
          instructions: INSTRUCTIONS,
        });
      }
      case "ping":
        return reply(m.id, {});
      case "tools/list":
        return reply(m.id, {
          tools: opsFor(ctx.key.scopes).map((o) => ({
            name: o.name,
            description: o.description,
            inputSchema: schemaOf(o.input),
            annotations: { readOnlyHint: !o.scope || o.scope === "read", destructiveHint: o.name === "undo_changes", openWorldHint: o.name === "ask_keeper" },
          })),
        });
      case "tools/call": {
        const name = String(m.params?.name ?? "");
        // A tool this key may not use is answered as a tool error that says which permission it needs.
        if (!opNamed(name)) return fail(m.id, -32602, `No tool called ${name}.`);
        const out = await callOp(ctx, name, m.params?.arguments ?? {}, "mcp");
        if (!out.ok) return reply(m.id, { content: [{ type: "text", text: out.error }], isError: true });
        const result = out.result as Record<string, unknown>;
        return reply(m.id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false });
      }
      case "resources/list":
        return reply(m.id, { resources: [] });
      case "prompts/list":
        return reply(m.id, { prompts: [] });
      default:
        return fail(m.id, -32601, `Unknown method ${m.method}.`);
    }
  };

  if (Array.isArray(raw)) {
    const answers = (await Promise.all(raw.map(answer))).filter(Boolean);
    return answers.length ? Response.json(answers, { headers: noStore }) : new Response(null, { status: 202 });
  }
  const one = await answer(raw);
  return one ? Response.json(one, { headers: noStore }) : new Response(null, { status: 202 });
}

/* No server-to-client stream and no sessions: every answer comes back on its POST. */
const notHere = () => new Response(null, { status: 405, headers: { allow: "POST" } });
export const GET = notHere;
export const DELETE = notHere;
