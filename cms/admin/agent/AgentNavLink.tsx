"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgentStatus } from "./useAgent";

/* The agent console in the admin's sidebar, with what needs attention: approvals and unread notices. */
export function AgentNavLink() {
  const { status } = useAgentStatus(30_000);
  const here = usePathname()?.startsWith("/admin/agent");
  const count = (status?.waiting ?? 0) + (status?.unread ?? 0);
  return (
    <Link className={`jz-navlink${here ? " is-here" : ""}`} href="/admin/agent">
      <span className={`jz-orb jz-orb--tiny${status?.working ? " is-working" : ""}`} aria-hidden="true" />
      <span>{status?.name ?? "Agent"} console</span>
      {count > 0 && (
        <span className="jz-badge" title={`${status?.waiting ?? 0} waiting for approval, ${status?.unread ?? 0} new notices`}>
          {count}
        </span>
      )}
    </Link>
  );
}
