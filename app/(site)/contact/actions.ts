"use server";

import { headers } from "next/headers";
import { fill, payloadClient } from "@/lib/cms";

/*
 * The contact form's backend. A message is checked, filtered for spam, saved
 * to the admin's Inbox, and (when email is set up) sent to the team, with an
 * automatic reply to the visitor. Spam is turned away quietly: bots see the
 * same thank-you as people.
 */

export type InquiryState = {
  status: "idle" | "sent" | "invalid" | "error";
  errors?: Partial<Record<"name" | "email" | "message", string>>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

// Best effort: per server instance, which is enough to stop a burst from one address.
const recent = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}

const field = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  // A field people never see (bots fill it in), and a form sent faster than any person types.
  if (field(form, "website", 200)) return { status: "sent" };
  const openedAt = Number(form.get("t"));
  if (openedAt && Date.now() - openedAt < 2500) return { status: "sent" };

  const name = field(form, "name", 120);
  const email = field(form, "email", 200);
  const company = field(form, "company", 160);
  const budget = field(form, "budget", 80);
  const message = field(form, "message", 5000);

  const errors: InquiryState["errors"] = {};
  if (!name) errors.name = "Please tell us your name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  if (message.length < 10) errors.message = "Please tell us a little more.";
  if (Object.keys(errors).length) return { status: "invalid", errors };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (limited(ip)) return { status: "sent" };

  try {
    const payload = await payloadClient();
    const inquiry = await payload.create({
      collection: "inquiries",
      overrideAccess: true,
      data: {
        name,
        email,
        company: company || undefined,
        budget: budget || undefined,
        message,
        status: "new",
        source: { page: h.get("referer") ?? "/contact", userAgent: (h.get("user-agent") ?? "").slice(0, 300) },
      },
    });

    const site = await payload.findGlobal({ slug: "site", overrideAccess: true, depth: 0 });
    const to = site.notifications?.to || site.email;
    const adminLink = `${site.url.replace(/\/$/, "")}/admin/collections/inquiries/${inquiry.id}`;

    // Emails are best effort: the message is already safe in the Inbox.
    try {
      await payload.sendEmail({
        to,
        replyTo: email,
        subject: `New message from ${name}${budget ? ` (${budget})` : ""}`,
        text: `${name} <${email}>${company ? `\n${company}` : ""}${budget ? `\nBudget: ${budget}` : ""}\n\n${message}\n\nOpen in the admin: ${adminLink}`,
        html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;${company ? `<br>${escapeHtml(company)}` : ""}${budget ? `<br>Budget: ${escapeHtml(budget)}` : ""}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p><a href="${adminLink}">Open in the admin</a></p>`,
      });
      if (site.notifications?.autoReply && site.notifications.autoReplyBody) {
        const body = fill(site.notifications.autoReplyBody, { name: name.split(" ")[0] });
        await payload.sendEmail({
          to: email,
          replyTo: to,
          subject: site.notifications.autoReplySubject || `Thank you for contacting ${site.name}`,
          text: body,
          html: `<p style="white-space:pre-wrap">${escapeHtml(body)}</p>`,
        });
      }
    } catch (err) {
      payload.logger.error({ err, msg: "Contact form: the message was saved but an email could not be sent." });
    }

    return { status: "sent" };
  } catch (err) {
    console.error("Contact form: could not save the message.", err);
    return { status: "error" };
  }
}
