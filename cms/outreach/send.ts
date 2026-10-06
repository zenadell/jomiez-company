import nodemailer from "nodemailer";
import type { Payload } from "payload";
import { suppress } from "./find";
import { loadOutreach } from "./settings";

/*
 * Sending, always by the owner's hand:
 * - WhatsApp and texts open on the owner's own phone with the message filled in
 *   (wa.me and sms: links); they press send. Free, and it's their own number.
 * - Email goes from the owner's Gmail (an app password), a few a day, with
 *   their address and a one-tap "don't email me again" link, as the UK and US
 *   rules for business email ask.
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
  return { left: Math.max(0, s.dailyEmails - sent), ready: Boolean(s.gmail && s.gmailPassword) };
}

/** Sends the lead's email from the owner's Gmail. */
export async function sendLeadEmail(payload: Payload, id: number | string) {
  const s = await loadOutreach(payload);
  if (!s.gmail || !s.gmailPassword) throw new Error("Email isn't set up yet: add your Gmail address and an app password in Clients → Finding clients → Email.");
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
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: s.gmail, pass: s.gmailPassword.replace(/\s+/g, "") } });
  try {
    await transport.sendMail({
      from: s.senderName ? `"${s.senderName.replace(/"/g, "")} · Jomiez" <${s.gmail}>` : s.gmail,
      to,
      subject: m.emailSubject.trim(),
      text,
      html,
      headers: { "List-Unsubscribe": `<${stop}>, <mailto:${s.gmail}?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
  } catch (err) {
    const msg = (err as Error).message || String(err);
    if (/535|Username and Password not accepted|BadCredentials/i.test(msg)) throw new Error("Gmail didn't accept the address and app password. Make a new app password at myaccount.google.com/apppasswords and paste it in Clients → Finding clients → Email.");
    throw new Error(`Gmail didn't send it: ${msg.slice(0, 200)}`);
  }
  await payload.kv.set(key, sent + 1);
  return markSent(payload, id, "email");
}
