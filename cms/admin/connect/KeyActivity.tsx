"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/* On an access key: the calls it made recently, newest first. */

type Call = { at: string; ip: string; via: string; what: string; ok: boolean; note?: string };

export function KeyActivity() {
  const { id } = useDocumentInfo();
  const [calls, setCalls] = useState<Call[] | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/connect/log?key=${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { calls?: Call[] }) => setCalls(d.calls ?? []))
      .catch(() => setCalls([]));
  }, [id]);
  if (!id) return null;
  return (
    <div className="jz-connect__log">
      <h4>Recent calls</h4>
      {!calls ? (
        <p>Loading…</p>
      ) : !calls.length ? (
        <p>None yet.</p>
      ) : (
        <table>
          <tbody>
            {calls.slice(0, 40).map((c, i) => (
              <tr key={i} className={c.ok ? "" : "is-bad"}>
                <td>{new Date(c.at).toLocaleString()}</td>
                <td>{c.what.replace(/_/g, " ")}</td>
                <td>{c.ok ? "ok" : "refused"}</td>
                <td>{c.note ?? ""}</td>
                <td>
                  {c.via === "mcp" ? "MCP" : "API"} · {c.ip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
