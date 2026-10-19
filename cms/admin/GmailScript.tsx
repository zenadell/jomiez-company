"use client";

import { useState } from "react";

/*
 * Sending email from your own Gmail through a small Google Apps Script, over
 * an ordinary web address. Hosts like Render's free plan block the email ports
 * that a Gmail password (SMTP) needs; this works everywhere and costs nothing.
 * Version 2 also reads replies from the businesses that were emailed (cms/outreach/replies.ts).
 */

const SCRIPT = `// Jomiez → your Gmail. Set the password, then Deploy → New deployment → Web app.
// Version 2: it also reads replies from the businesses you emailed, so Jomiez marks them for you.
const PASSWORD = 'CHANGE-ME: the same password you type in Jomiez';

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.password !== PASSWORD) return out({ ok: false, error: 'wrong password' });
    if (d.action === 'replies') return out(Object.assign({ ok: true, version: 2 }, readReplies(d)));
    if (!d.test) {
      let answered = false;
      if (d.replyTo) {
        // An answer to their reply goes into the same conversation.
        try {
          GmailApp.getMessageById(d.replyTo).reply(d.text, { htmlBody: d.html, name: d.name || undefined });
          answered = true;
        } catch (replyErr) {}
      }
      if (!answered) {
        try {
          GmailApp.sendEmail(d.to, d.subject, d.text, { htmlBody: d.html, name: d.name || undefined });
        } catch (gmailErr) {
          // Some accounts refuse GmailApp ("Gmail operation not allowed"); MailApp sends from the same address.
          MailApp.sendEmail({ to: d.to, subject: d.subject, body: d.text, htmlBody: d.html, name: d.name || undefined });
        }
      }
    }
    return out({ ok: true, version: 2, from: Session.getEffectiveUser().getEmail(), left: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Messages from the addresses Jomiez asks about, since a time (seconds), and bounced emails.
function readReplies(d) {
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  const after = Math.floor(Number(d.since) || Date.now() / 1000 - 7 * 86400);
  const senders = (d.senders || []).map(String).filter(function (s) { return /^[\\w.@+-]+$/.test(s); }).slice(0, 400);
  const replies = [];
  const seen = {};
  const take = function (m, t) {
    const id = m.getId();
    if (seen[id] || m.getDate().getTime() < after * 1000) return null;
    seen[id] = 1;
    return { id: id, thread: t.getId(), from: m.getFrom(), subject: m.getSubject(), at: m.getDate().getTime(), text: m.getPlainBody().slice(0, 6000) };
  };
  for (let i = 0; i < senders.length; i += 25) {
    const q = 'after:' + after + ' -in:sent -in:chats from:(' + senders.slice(i, i + 25).join(' OR ') + ')';
    GmailApp.search(q, 0, 50).forEach(function (t) {
      t.getMessages().forEach(function (m) {
        if (m.getFrom().toLowerCase().indexOf(me) >= 0) return;
        const r = take(m, t);
        if (r) replies.push(r);
      });
    });
  }
  const bounces = [];
  GmailApp.search('after:' + after + ' from:(mailer-daemon OR postmaster)', 0, 30).forEach(function (t) {
    t.getMessages().forEach(function (m) {
      const r = take(m, t);
      if (r) bounces.push(r);
    });
  });
  return { replies: replies, bounces: bounces };
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
        <li>
          Already set it up before? Paste the new script over the old one (keep your password), then <strong>Deploy → Manage deployments → ✎ Edit → Version: New version → Deploy</strong>. The address stays the same. Version 2 also reads the replies from businesses you emailed, so they&apos;re marked for you and Keeper drafts your answer.
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
