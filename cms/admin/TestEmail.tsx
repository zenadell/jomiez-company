"use client";

import { useState } from "react";

/** Sends a test email to the signed-in admin, to prove the email setup end to end. */
export function TestEmail() {
  const [state, setState] = useState<{ busy?: boolean; ok?: boolean; text?: string }>({});
  return (
    <div className="jomiez-setup__test">
      <button
        type="button"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true });
          const res = await fetch("/api/agent/test-email", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
          const out = await res.json().catch(() => ({ ok: false, message: `The server answered ${res.status}.` }));
          setState({ ok: Boolean(out.ok), text: out.message });
        }}
      >
        {state.busy ? "Sending…" : "Send a test email"}
      </button>
      {state.text && <span className={state.ok ? "is-ok" : "is-bad"}>{state.text}</span>}
    </div>
  );
}
