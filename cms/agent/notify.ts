import type { Payload } from "payload";
import type { Recorded } from "./docs";

/*
 * The owner hears about everything the agent does on its own (routines and new
 * contact messages): a notice in the admin (the bell on the Agent console) and
 * an email with what it did, what it changed and anything waiting for approval.
 */

export type Notice = {
  id: string;
  at: string;
  kind: "routine" | "inbox" | "approval" | "error";
  title: string;
  body: string;
  link: string;
  read?: boolean;
};

const KEY = "agent:notices";

export async function listNotices(payload: Payload): Promise<Notice[]> {
  return (await payload.kv.get<Notice[]>(KEY)) ?? [];
}

export async function markNoticesRead(payload: Payload) {
  const all = await listNotices(payload);
  await payload.kv.set(
    KEY,
    all.map((n) => ({ ...n, read: true })),
  );
}

async function addNotice(payload: Payload, n: Omit<Notice, "id" | "at">) {
  const all = await listNotices(payload);
  const notice: Notice = { ...n, id: `n${Date.now().toString(36)}`, at: new Date().toISOString() };
  await payload.kv.set(KEY, [notice, ...all].slice(0, 100));
  return notice;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type RunReport = {
  kind: "routine" | "inbox";
  name: string;
  status: string;
  threadId: number;
  summary: string;
  changes: Recorded[];
  waiting: string[];
  origin: string;
};

/** Where notices are emailed: Agent settings, else ADMIN_NOTIFY_EMAIL, else the site's contact email. */
export async function notifyAddress(payload: Payload, configured?: string | null): Promise<string | null> {
  if (configured?.trim()) return configured.trim();
  if (process.env.ADMIN_NOTIFY_EMAIL) return process.env.ADMIN_NOTIFY_EMAIL;
  try {
    const site = (await payload.findGlobal({ slug: "site", depth: 0, overrideAccess: true })) as { email?: string; notifications?: { to?: string } };
    return site.notifications?.to || site.email || null;
  } catch {
    return null;
  }
}

/** Tells the owner about an automatic run: always in the admin, and by email when an address is known. */
export async function reportAutomaticRun(payload: Payload, r: RunReport, opts: { email: boolean; to: string | null; agentName: string }) {
  const link = `${r.origin}/admin/agent?thread=${r.threadId}`;
  const verb = r.kind === "inbox" ? `read ${r.name}` : `ran “${r.name}”`;
  const outcome =
    r.status === "error"
      ? "and hit a problem"
      : r.waiting.length
        ? `and needs your approval for ${r.waiting.length} ${r.waiting.length === 1 ? "thing" : "things"}`
        : r.changes.length
          ? `and made ${r.changes.length} ${r.changes.length === 1 ? "change" : "changes"}`
          : "(no changes)";
  const title = `${opts.agentName} ${verb} ${outcome}`;
  const changeLines = r.changes.map((c) => `• ${c.action === "update" ? "changed" : c.action} ${c.title}`);
  const body = [r.summary.trim(), changeLines.length ? `Changes:\n${changeLines.join("\n")}` : "", r.waiting.length ? `Waiting for you:\n${r.waiting.map((w) => `• ${w}`).join("\n")}` : ""]
    .filter(Boolean)
    .join("\n\n");

  await addNotice(payload, { kind: r.status === "error" ? "error" : r.waiting.length ? "approval" : r.kind, title, body: body.slice(0, 4000), link });

  if (!opts.email || !opts.to) return;
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:620px">
<p style="font-size:17px;font-weight:600;margin:0 0 12px">${esc(title)}</p>
${r.summary.trim() ? `<p style="white-space:pre-wrap;margin:0 0 16px">${esc(r.summary.trim().slice(0, 3000))}</p>` : ""}
${changeLines.length ? `<p style="margin:0 0 4px;font-weight:600">Changes</p><ul style="margin:0 0 16px;padding-left:18px">${r.changes.map((c) => `<li>${esc(`${c.action === "update" ? "changed" : c.action} ${c.title}`)}</li>`).join("")}</ul>` : ""}
${r.waiting.length ? `<p style="margin:0 0 4px;font-weight:600">Waiting for your approval</p><ul style="margin:0 0 16px;padding-left:18px">${r.waiting.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
<p style="margin:20px 0"><a href="${esc(link)}" style="background:#141414;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Open in the admin</a></p>
<p style="color:#777;font-size:13px">Everything it did can be undone from that page. Turn these emails off in Agent settings → Automation.</p>
</div>`;
  try {
    await payload.sendEmail({ to: opts.to, subject: title, text: `${body}\n\nOpen in the admin: ${link}`, html });
  } catch (err) {
    payload.logger.error({ err, msg: "Couldn't email the agent notice" });
  }
}
