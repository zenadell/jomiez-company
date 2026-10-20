import type { Target } from "./schema";
import { siteUrl } from "./schema";
import { effective, MAIN_INSTRUCTIONS, render, TRIAGE_INSTRUCTIONS, type SavedInstructions } from "./instructions";
import { MODE_TEXT, type Mode } from "./policy";

/*
 * The agent's standing instructions, rebuilt for every task from the live
 * schema, its memory, the owner's voice guide and the permission settings.
 * The model supplies language; this is what makes it an operator of this
 * particular site.
 */

export type PromptInput = {
  name: string;
  persona: string;
  memory: { id: string | number; kind: string; content: string }[];
  mode: Mode;
  web: boolean;
  user: { name?: string | null; email?: string | null; roles?: string[] | null } | null;
  source: "console" | "page" | "routine" | "inbox" | "api";
  /** For a request through the agent API: the access key's name ("Claude Code on my laptop"). */
  via?: string;
  scope: "full" | "triage";
  context?: { path?: string; title?: string } | null;
  routine?: { name: string } | null;
  targets: Target[];
  now: Date;
  timeZone: string;
  /** Triage: also write a suggested reply into the notes. */
  draftReplies?: boolean;
  /** Where things stand right now, and what happened in recent conversations. */
  situation?: string;
  /** The owner's edited instructions (Agent settings → Instructions), carried onto the built-in text. */
  custom?: { main?: SavedInstructions; triage?: SavedInstructions };
};

function areas(targets: Target[]) {
  return targets
    .filter((t) => !["payload-kv"].includes(t.slug))
    .map((t) => {
      const where = siteUrl(t);
      return `- ${t.slug} — ${t.label} [${t.group}; ${t.kind === "global" ? "single page" : "list"}; ${t.drafts ? "drafts" : "changes go live at once"}${where ? `; on the site at ${where}` : ""}]${t.description ? `: ${t.description}` : ""}`;
    })
    .join("\n");
}

export function buildInstructions(p: PromptInput): string {
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: p.timeZone }).format(p.now);
  const who = p.user ? `${p.user.name || p.user.email} (${(p.user.roles ?? []).join(", ") || "team member"})` : "the Jomiez team";

  if (p.scope === "triage") {
    return render(effective(p.custom?.triage, TRIAGE_INSTRUCTIONS), { name: p.name, now: when, draft_replies: Boolean(p.draftReplies), voice: p.persona });
  }

  const memory = p.memory.length
    ? p.memory.map((m) => `- [${m.id}] (${m.kind}) ${m.content}`).join("\n")
    : "- Nothing saved yet. Use remember when you learn something lasting.";

  const place =
    p.source === "api"
      ? `This request comes from “${p.via ?? "another agent"}”, a program the owner connected with an access key (Agent → Access keys). Treat it as the owner's request, with exactly the same permissions and approval rules: anything that needs approval waits for the owner as usual. Nobody may be watching live, so finish the work, then reply with a plain, complete summary another program can read: what you did, what changed, and what is waiting.`
      : p.source === "routine"
      ? `This is the scheduled routine “${p.routine?.name}”. Nobody is watching live: do the work fully, then leave a clear summary as your final reply. Pin a briefing (report) if the team should see the result on the dashboard. Anything that needs approval will wait for them.`
      : p.context?.path
        ? `They are looking at ${p.context.title ? `“${p.context.title}” (${p.context.path})` : p.context.path} in the admin right now; “this page”, “here” or “this” means that document. When you change it, their screen reloads to show your change.`
        : "They are talking to you from the agent console.";

  return render(effective(p.custom?.main, MAIN_INSTRUCTIONS), {
    name: p.name,
    who,
    now: when,
    web_off: p.web ? "" : " (turned off by the owner)",
    permissions: MODE_TEXT[p.mode],
    voice: p.persona,
    memory,
    where: place,
    situation: p.situation ?? "",
    areas: areas(p.targets),
  });
}
