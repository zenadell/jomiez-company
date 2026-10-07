import { callOp, opsFor } from "@/cms/connect/ops";
import { connect, noStore } from "@/cms/connect/serve";

/*
 * The agent API: Keeper for other programs, with an access key
 * (Authorization: Bearer jz_…; make one in the admin under Agent → Access keys).
 * Every answer is JSON. The same operations are on the MCP server at /api/mcp.
 *
 *   GET   /api/v1                              this key, and what it may call
 *   GET   /api/v1/status                       Keeper on/ready, model, waiting, usage
 *   GET   /api/v1/conversations                ?limit ?status ?search ?page
 *   GET   /api/v1/conversations/:id            ?last ?reasoning
 *   POST  /api/v1/conversations                { message, wait? }     a new task
 *   POST  /api/v1/conversations/:id            { message, wait? }     more in a conversation
 *   POST  /api/v1/conversations/:id/approvals  { approval_id, approve, note?, wait? }
 *   POST  /api/v1/conversations/:id/stop
 *   POST  /api/v1/conversations/:id/undo       { run_id? }
 *   GET   /api/v1/activity                     ?limit
 *   GET   /api/v1/leads                        ?status ?search ?limit ?page
 *   GET   /api/v1/leads/:id
 *   GET   /api/v1/settings
 *   GET   /api/v1/routines
 *   PATCH /api/v1/routines/:id                 { enabled }
 *   PATCH /api/v1/keeper                       { enabled?, provider?, model? }
 *
 * For the Aethron runner on the owner's Mac (a key with only the "runner" permission):
 *   POST  /api/v1/runner/hello | next | result | upload | publish   (scripts/aethron-runner.mjs)
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Params = { params: Promise<{ path?: string[] }> };

/** Which operation a method and path mean, and the arguments the path itself carries. */
function route(method: string, path: string[]): { op: string; args?: Record<string, unknown> } | null {
  const [a, id, b] = path;
  // The Aethron runner's addresses name an action, not an id.
  if (a === "runner" && method === "POST" && id && !b) {
    const op = ({ hello: "runner_hello", next: "runner_next", result: "runner_result", upload: "runner_upload", publish: "runner_publish" } as Record<string, string>)[id];
    return op ? { op } : null;
  }
  const key = `${method} ${[a, id ? ":id" : "", b].filter(Boolean).join("/")}`;
  const table: Record<string, string> = {
    "GET ": "whoami",
    "GET status": "keeper_status",
    "GET conversations": "list_conversations",
    "GET conversations/:id": "get_conversation",
    "POST conversations": "ask_keeper",
    "POST conversations/:id": "ask_keeper",
    "POST conversations/:id/approvals": "answer_approval",
    "POST conversations/:id/stop": "stop_conversation",
    "POST conversations/:id/undo": "undo_changes",
    "GET activity": "list_activity",
    "GET leads": "list_leads",
    "GET leads/:id": "get_lead",
    "GET settings": "get_settings",
    "GET routines": "list_routines",
    "PATCH routines/:id": "set_routine",
    "PATCH keeper": "set_keeper",
  };
  const op = table[key];
  if (!op) return null;
  if (!id) return { op };
  // A conversation's id is conversation_id for the operations that continue one.
  const named = ["ask_keeper", "answer_approval", "stop_conversation", "undo_changes"].includes(op) ? "conversation_id" : "id";
  return { op, args: { [named]: id } };
}

async function handle(req: Request, { params }: Params) {
  const { path = [] } = await params;
  const found = route(req.method, path);
  if (!found) return Response.json({ error: `No ${req.method} /api/v1/${path.join("/")}. GET /api/v1 lists what's there.` }, { status: 404, headers: noStore });
  const c = await connect(req);
  if ("refusal" in c) return c.refusal;
  const query = Object.fromEntries(new URL(req.url).searchParams);
  const body = req.method === "GET" ? {} : ((await req.json().catch(() => ({}))) as Record<string, unknown>);
  const out = await callOp(c.ctx, found.op, { ...query, ...body, ...found.args }, "api");
  if (!out.ok) return Response.json({ error: out.error }, { status: out.status, headers: noStore });
  if (found.op === "whoami") {
    const ops = opsFor(c.ctx.key.scopes).map((o) => o.name);
    return Response.json({ ...(out.result as object), can_call: ops, mcp: `${c.ctx.origin}/api/mcp` }, { headers: noStore });
  }
  return Response.json(out.result, { headers: noStore });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
