"use client";

import Link from "next/link";
import { modeText } from "./AgentConsole";
import { Markdown } from "./Markdown";
import { useAgentStatus } from "./useAgent";

/* The agent at the top of the dashboard: what it's doing, what waits for you, and its latest briefing. */
export function DashboardAgent() {
  const { status } = useAgentStatus(30_000);
  if (!status) return null;
  const line = !status.ready
    ? status.setup || "Switched off."
    : status.waiting
      ? `${status.waiting} ${status.waiting === 1 ? "thing needs" : "things need"} your approval.`
      : status.working
        ? "Working on something right now."
        : `Ready. It ${modeText(status.mode)}.`;
  return (
    <div className="jz-dash-agent">
      <span className={`jz-orb jz-orb--big${status.working ? " is-working" : ""}`} aria-hidden="true" style={{ width: 52, height: 52 }} />
      <div className="jz-dash-agent__text">
        <strong>{status.name}</strong>
        <span>{line}</span>
      </div>
      {status.unread > 0 && <span className="jz-badge">{status.unread} new</span>}
      <Link className="jz-btn jz-btn--yes" href={status.ready ? "/admin/agent" : "/admin/globals/agent"}>
        {status.ready ? "Open the console" : status.canConfigure ? "Set it up" : "Open"}
      </Link>
      {status.briefing && (
        <div className="jz-dash-agent__brief">
          <strong>{status.briefing.title}</strong>
          <Markdown text={status.briefing.body} />
        </div>
      )}
    </div>
  );
}
