import nodemailer from "nodemailer";
import type { Payload } from "payload";
import { suppress } from "./find";
import { loadOutreach } from "./settings";

/*
 * Sending, always by the owner's hand:
 * - WhatsApp and texts open on the owner's own phone with the message filled in
 *   (wa.me and sms: links); they press send. Free, and it's their own number.
 * - Email goes from the owner's Gmail, a few a day, with their address and a
 *   one-tap "don't email me again" link, as the UK and US rules for business
 *   email ask. Either through a small Google Script of theirs (an ordinary web
 *   address, so it works on hosts that block email ports, like Render's free
 *   plan) or with a Gmail app password where those ports are open.
 * Whoever asks not to be contacted is never contacted again, even if their
 * lead is deleted later (find.ts keeps a list).
 */

export type Channel = "whatsapp" | "sms" | "email";

const site = () => (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.jomiez.com").replace(/\/$/, "");

export const stopUrl = (token: string) => `${site()}/api/outreach/stop?t=${encodeURIComponent(token)}`;

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** "?&body=" works on both iPhone and Android. */
export function smsLink(phone: string, text: string) {
  return `sms:${phone}?&body=${encodeURIComponent(text)}`;
}

type Lead = Record<string, unknown> & { id: number | string; name: string };

async function get(payload: Payload, id: number | string) {
  return (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead;
}

const logged = (lead: Lead, what: string) => [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what }];

/** Records that a message went out (the owner pressed send in WhatsApp or Messages, or the email was sent). */
export async function markSent(payload: Payload, id: number | string, channel: Channel) {
  const lead = await get(payload, id);
  const followUp = Boolean((lead.messages as { followUp?: boolean } | null)?.followUp);
  const how = { whatsapp: "on WhatsApp", sms: "as a text", email: "by email" }[channel];
  await payload.update({
    collection: "leads",
    id,
    data: {
      status: "contacted",
      contactedAt: new Date().toISOString(),
      followUps: (Number(lead.followUps) || 0) + (followUp ? 1 : 0),
      log: logged(lead, `${followUp ? "Follow-up sent" : "Sent"} ${how}`),
    } as never,
    overrideAccess: true,
  });
  return { id, name: lead.name, status: "contacted" as const };
}

/** Takes back a "sent" mark (the owner tapped WhatsApp but didn't send after all). */
export async function unmarkSent(payload: Payload, id: number | string) {
  const lead = await get(payload, id);
  if (lead.status !== "contacted") return { id, status: lead.status };
  const followUp = Boolean((lead.messages as { followUp?: boolean } | null)?.followUp);
  await payload.update({
    collection: "leads",
    id,
    data: { status: "ready", followUps: Math.max(0, (Number(lead.followUps) || 0) - (followUp ? 1 : 0)), log: logged(lead, "Marked as not sent") } as never,
    overrideAccess: true,
  });
  return { id, status: "ready" as const };
}

export async function setStatus(payload: Payload, id: number | string, status: string, note?: string) {
  const lead = await get(payload, id);
  if (status === "stopped") return stopLead(payload, { id });
  if (lead.status === "stopped" && !["won", "replied"].includes(status)) throw new Error(`${lead.name} asked not to be contacted.`);
  const label: Record<string, string> = { replied: "They replied", won: "Won: they're a client", lost: "Not interested", skipped: "Skipped", ready: "Back to ready", checked: "Back to checked" };
  await payload.update({
    collection: "leads",
    id,
    data: { status, log: logged(lead, `${label[status] ?? status}${note ? `: ${note}` : ""}`) } as never,
    overrideAccess: true,
  });
  return { id, name: lead.name, status };
}

/** They asked not to be contacted (from the link in an email, a "stop" reply, or the owner). */
export async function stopLead(payload: Payload, by: { id?: number | string; token?: string }) {
  let lead: Lead | null = null;
  if (by.id != null) lead = await get(payload, by.id);
  else if (by.token) {
    const { docs } = await payload.find({ collection: "leads", where: { stopToken: { equals: by.token } }, limit: 1, depth: 0, overrideAccess: true });
    lead = (docs[0] as unknown as Lead) ?? null;
  }
  if (!lead) return null;
  await suppress(payload, [lead.phone as string, lead.email as string, lead.domain as string]);
  if (lead.status !== "stopped") {
    await payload.update({ collection: "leads", id: lead.id, data: { status: "stopped", log: logged(lead, by.token ? "Asked not to be contacted (from the email link)" : "Asked not to be contacted") } as never, overrideAccess: true });
  }
  return { id: lead.id, name: lead.name };
}

const today = () => new Date().toISOString().slice(0, 10);

export async function emailsLeftToday(payload: Payload) {
  const s = await loadOutreach(payload);
  const sent = (await payload.kv.get<number>(`outreach:emails:${today()}`)) ?? 0;
  return { left: Math.max(0, s.dailyEmails - sent), ready: Boolean((s.gmailScriptUrl && s.gmailScriptSecret) || (s.gmail && s.gmailPassword)) };
}

type Mail = { to: string; subject: string; text: string; html: string; name: string; headers?: Record<string, string> };

/** Through the owner's Google Script (cms/admin/GmailScript.tsx). Returns the sending address. */
async function viaScript(url: string, password: string, mail: Mail | null): Promise<{ from?: string; left?: number }> {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mail ? { password, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, name: mail.name } : { password, test: true }),
    signal: AbortSignal.timeout(45_000),
  });
  const raw = await res.text();
  let out: { ok?: boolean; error?: string; from?: string; left?: number } | null = null;
  try {
    out = JSON.parse(raw);
  } catch {
    out = null;
  }
  if (!out) {
    throw new Error(
      res.status === 404 || /not found/i.test(raw)
        ? "Google says that script address doesn't exist: copy the Web app URL again from Deploy → Manage deployments."
        : "Google answered with a sign-in page instead of the script: in Deploy → Manage deployments, set Who has access to Anyone.",
    );
  }
  if (!out.ok) throw new Error(/wrong password/.test(out.error ?? "") ? "The script's password doesn't match the one saved in Clients → Finding clients → Email." : `The Gmail script couldn't send it: ${(out.error ?? "unknown error").slice(0, 200)}`);
  return { from: out.from, left: out.left };
}

/** Through Gmail's mail server with an app password (hosts that allow email ports). */
async function viaSmtp(user: string, pass: string, mail: Mail) {
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass: pass.replace(/\s+/g, "") }, connectionTimeout: 15_000 });
  try {
    await transport.sendMail({ from: mail.name ? `"${mail.name.replace(/"/g, "")}" <${user}>` : user, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, headers: mail.headers });
  } catch (err) {
    const msg = (err as Error).message || String(err);
    if (/535|Username and Password not accepted|BadCredentials/i.test(msg)) throw new Error("Gmail didn't accept the address and app password. Make a new app password at myaccount.google.com/apppasswords and paste it in Clients → Finding clients → Email.");
    if (/ENETUNREACH|ETIMEDOUT|timeout|ECONNREFUSED|EHOSTUNREACH/i.test(msg)) {
      throw new Error("This server can't reach Gmail's mail server: the host blocks email ports (Render's free plan does). Set up the Google Script in Clients → Finding clients → Email instead; it takes two minutes.");
    }
    throw new Error(`Gmail didn't send it: ${msg.slice(0, 200)}`);
  }
}

async function deliver(payload: Payload, mail: Mail) {
  const s = await loadOutreach(payload);
  if (s.gmailScriptUrl && s.gmailScriptSecret) return viaScript(s.gmailScriptUrl, s.gmailScriptSecret, mail);
  if (s.gmail && s.gmailPassword) return viaSmtp(s.gmail, s.gmailPassword, mail);
  throw new Error("Email isn't set up yet: add the Google Script (or a Gmail app password) in Clients → Finding clients → Email.");
}

/** A test email to the sending Gmail itself, from the settings screen. */
export async function sendTestEmail(payload: Payload) {
  const s = await loadOutreach(payload);
  let to = s.gmail;
  if (s.gmailScriptUrl && s.gmailScriptSecret) to = (await viaScript(s.gmailScriptUrl, s.gmailScriptSecret, null)).from || to;
  if (!to) throw new Error("Add your Gmail address first.");
  await deliver(payload, {
    to,
    subject: "Jomiez: email to leads works",
    text: "This is a test from Clients → Finding clients. Emails to leads will go from this Gmail.",
    html: "<p>This is a test from Clients → Finding clients. Emails to leads will go from this Gmail.</p>",
    name: s.senderName ? `${s.senderName} · Jomiez` : "Jomiez",
  });
  return to;
}

/** Sends the lead's email from the owner's Gmail. */
export async function sendLeadEmail(payload: Payload, id: number | string) {
  const s = await loadOutreach(payload);
  if (!(s.gmailScriptUrl && s.gmailScriptSecret) && !(s.gmail && s.gmailPassword)) throw new Error("Email isn't set up yet: add the Google Script in Clients → Finding clients → Email.");
  const lead = await get(payload, id);
  if (lead.status === "stopped") throw new Error(`${lead.name} asked not to be contacted.`);
  const to = typeof lead.email === "string" ? lead.email : "";
  if (!to) throw new Error(`There's no email address for ${lead.name}.`);
  const m = (lead.messages ?? {}) as { emailSubject?: string; emailBody?: string };
  if (!m.emailSubject || !m.emailBody) throw new Error(`No email has been written for ${lead.name} yet.`);
  const key = `outreach:emails:${today()}`;
  const sent = (await payload.kv.get<number>(key)) ?? 0;
  if (sent >= s.dailyEmails) throw new Error(`Today's ${s.dailyEmails} emails have gone out. The rest wait for tomorrow (Gmail flags new accounts that send many emails to strangers).`);
  const stop = stopUrl(String(lead.stopToken ?? ""));
  const footer = [`—`, [s.senderName || "Jomiez", "Jomiez", s.address].filter(Boolean).join(" · "), `If you'd rather not get emails from us, tell me or use this link and you won't hear from us again: ${stop}`].join("\n");
  const text = `${m.emailBody.trim()}\n\n${footer}`;
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">${m.emailBody
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`)
    .join("")}<p style="margin-top:28px;font-size:12px;color:#777">${esc([s.senderName || "Jomiez", "Jomiez", s.address].filter(Boolean).join(" · "))}<br><a href="${stop}" style="color:#777">Don't email me again</a></p></div>`;
  await deliver(payload, {
    to,
    subject: m.emailSubject.trim(),
    text,
    html,
    name: s.senderName ? `${s.senderName} · Jomiez` : "Jomiez",
    headers: { "List-Unsubscribe": `<${stop}>${s.gmail ? `, <mailto:${s.gmail}?subject=unsubscribe>` : ""}`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  await payload.kv.set(key, sent + 1);
  return markSent(payload, id, "email");
}
