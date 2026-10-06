"use client";

import { useState } from "react";

/*
 * Sending email from your own Gmail through a small Google Apps Script, over
 * an ordinary web address. Hosts like Render's free plan block the email ports
 * that a Gmail password (SMTP) needs; this works everywhere and costs nothing.
 */

const SCRIPT = `// Jomiez → your Gmail. Set the password, then Deploy → New deployment → Web app.
const PASSWORD = 'CHANGE-ME: the same password you type in Jomiez';

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.password !== PASSWORD) return out({ ok: false, error: 'wrong password' });
    if (!d.test) GmailApp.sendEmail(d.to, d.subject, d.text, { htmlBody: d.html, name: d.name || undefined });
    return out({ ok: true, from: Session.getEffectiveUser().getEmail(), left: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}`;

export function GmailScript() {
  const [copied, setCopied] = useState(false);
  const [test, setTest] = useState<{ busy?: boolean; ok?: boolean; text?: string }>({});
  return (
    <div className="jz-gscript">
      <ol>
        <li>
          Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com</a> signed in to the Gmail you&apos;ll send from, and replace everything in the new project with the script below.
        </li>
        <li>Change <code>CHANGE-ME…</code> to a long password of your own (any 20+ letters and numbers), and type the same password below.</li>
        <li>
          Click <strong>Deploy → New deployment</strong>, choose <strong>Web app</strong>, set <em>Execute as: Me</em> and <em>Who has access: Anyone</em>, then Deploy and allow access when Google asks.
        </li>
        <li>
          Copy the <strong>Web app URL</strong> (it ends in <code>/exec</code>) into the box below, save, then send yourself a test.
        </li>
      </ol>
      <div className="jz-gscript__code">
        <pre>{SCRIPT}</pre>
        <button
          type="button"
          className="jz-btn jz-btn--ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(SCRIPT).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy the script"}
        </button>
      </div>
      <div className="jomiez-setup__test">
        <button
          type="button"
          disabled={test.busy}
          onClick={async () => {
            setTest({ busy: true });
            const res = await fetch("/api/outreach/test-email", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
            const out = (await res.json().catch(() => ({ ok: false, message: `The server answered ${res.status}.` }))) as { ok?: boolean; message?: string };
            setTest({ ok: Boolean(out.ok), text: out.message });
          }}
        >
          {test.busy ? "Sending…" : "Send me a test email (save first)"}
        </button>
        {test.text && <span className={test.ok ? "is-ok" : "is-bad"}>{test.text}</span>}
      </div>
    </div>
  );
}
