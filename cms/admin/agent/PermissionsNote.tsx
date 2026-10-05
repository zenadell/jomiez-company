"use client";

import { useState } from "react";

/*
 * In Agent settings: the lines it can never cross, whatever the autonomy
 * setting, and a button to check the model connection with the saved settings.
 */
export function PermissionsNote() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="jz-perm-note">
      <p>
        <strong>Always, whatever the setting:</strong> it acts with the permissions of whoever asked (routines: whoever set them up); it can
        never manage the team or passwords, change these settings or see API keys; it reads contact messages sealed off (it may only sort that
        message); everything it does is recorded under Conversations and can be undone; and you are told about everything it does on its own.
      </p>
      <div className="jz-perm-note__test">
        <button
          type="button"
          className="jz-btn jz-btn--ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            try {
              const res = await fetch("/api/agent/test", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
              setResult(await res.json());
            } catch {
              setResult({ ok: false, message: "Couldn't reach the server." });
            }
            setBusy(false);
          }}
        >
          {busy ? "Testing…" : "Test the connection"}
        </button>
        <span className="jz-muted">Uses the saved settings: save first.</span>
      </div>
      {result && <p className={result.ok ? "jz-ok" : "jz-bad"}>{result.message}</p>}
    </div>
  );
}
