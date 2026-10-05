import type { Payload } from "payload";
import { setupStatus } from "../setup";
import { TestEmail } from "./TestEmail";

/*
 * "Going live" on the dashboard (admins): every service the site depends on,
 * whether it's connected, and a test email. Folds away once all is well.
 */
export async function SetupStatus({ payload }: { payload: Payload }) {
  const rows = await setupStatus(payload);
  const problems = rows.filter((r) => !r.ok).length;
  return (
    <details className="jomiez-setup" open={problems > 0}>
      <summary>
        <strong>Going live</strong>
        <span>{problems ? `${problems} to set up` : "Everything is connected"}</span>
      </summary>
      <ul>
        {rows.map((r) => (
          <li key={r.name} className={r.ok ? "is-ok" : r.warn ? "is-warn" : "is-off"}>
            <span aria-hidden="true">{r.ok ? "✓" : r.warn ? "!" : "–"}</span>
            <strong>{r.name}</strong>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
      <TestEmail />
    </details>
  );
}
