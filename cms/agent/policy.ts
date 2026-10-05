/*
 * What the agent may do on its own. Every action has a risk; the autonomy
 * setting decides which risks run straight away, which wait for a person's
 * approval (with the exact change shown), and which are never allowed.
 */

export type Risk =
  | "read" // looking at anything it's allowed to see
  | "note" // its own plan, memory and reports
  | "draft" // changes visitors can't see until published
  | "live" // changes visitors see: publishing, settings without drafts, redirects, routines
  | "delete"
  | "email"
  | "web"; // reading other websites

export type Mode = "ask" | "drafts" | "trusted" | "full";
export type Decision = "auto" | "ask" | "deny";

export type Permissions = {
  mode: Mode;
  deletes: "never" | "ask" | "auto";
  email: "never" | "ask" | "auto";
  web: boolean;
};

export function decide(risk: Risk, p: Permissions): Decision {
  switch (risk) {
    case "read":
    case "note":
      return "auto";
    case "web":
      return p.web ? "auto" : "deny";
    case "draft":
      return p.mode === "ask" ? "ask" : "auto";
    case "live":
      return p.mode === "trusted" || p.mode === "full" ? "auto" : "ask";
    case "delete":
      if (p.deletes === "never") return "deny";
      return p.deletes === "auto" && p.mode === "full" ? "auto" : "ask";
    case "email":
      if (p.email === "never") return "deny";
      return p.email === "auto" && p.mode === "full" ? "auto" : "ask";
  }
}

export const MODE_TEXT: Record<Mode, string> = {
  ask: "Every change waits for approval, even drafts.",
  drafts: "Drafts and notes happen straight away; anything that goes live (publishing, settings without drafts, redirects, routines), deleting and email wait for approval.",
  trusted: "Drafts, publishing and settings happen straight away; deleting and email wait for approval.",
  full: "Everything happens straight away, except what the owner has set to always ask or never allow.",
};
