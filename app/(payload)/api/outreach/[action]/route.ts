import config from "@payload-config";
import { getPayload, type Where } from "payload";
import { emailsLeftToday, markSent, sendLeadEmail, sendTestEmail, setStatus, smsLink, stopLead, unmarkSent, whatsappLink, type Channel } from "@/cms/outreach/send";
import { loadOutreach } from "@/cms/outreach/settings";
import { makePreview, previewLink, writeLead, writerModel } from "@/cms/outreach/write";
import { push } from "@/cms/app/push";
import { originOf } from "@/cms/preview";

/*
 * Finding clients (cms/outreach).
 * For anyone (the link at the end of an email, "Not interested" on a preview):
 *   GET  stop?t=…    asks "stop contacting me?"; POST does it (also one-click from mail apps)
 *   GET  get?t=…     "Get this website" on a template preview: tells the owner, opens a WhatsApp chat with them
 * For the phone app, signed in:
 *   GET  leads?tab=ready|contacted|replied|won|all   the list, with ready-made WhatsApp and text links
 *   GET  summary     counts for the home screen
 *   GET  shot?id=…   the small screenshot of a lead's current website
 *   POST lead        { id, do: sent|unsent|status|save|email|rewrite|preview, … }
 *   POST test-email  a test email to the sending Gmail (from the settings screen)
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Params = { params: Promise<{ action: string }> };

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const page = (title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f3ef;color:#1c1612;font:17px/1.55 system-ui,-apple-system,sans-serif;padding:24px}main{max-width:440px;background:#fff;border-radius:22px;padding:30px;box-shadow:0 20px 50px -30px rgba(0,0,0,.4)}h1{font-size:24px;margin:0 0 10px;letter-spacing:-.01em}p{margin:0 0 18px;color:#5b524b}button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:13px 22px;background:#1c1612;color:#fff;cursor:pointer}</style></head><body><main>${body}</main></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === originOf(req.headers);
}

type Lead = Record<string, unknown> & { id: number; name: string };

function forApp(l: Lead) {
  const m = (l.messages ?? {}) as { whatsapp?: string; sms?: string; emailSubject?: string; emailBody?: string; followUp?: boolean };
  const phone = typeof l.phone === "string" ? l.phone : null;
  const preview = (l.preview ?? {}) as { slug?: string; views?: number; lastViewedAt?: string };
  const check = (l.check ?? {}) as { kind?: string; scores?: Record<string, number> };
  return {
    id: l.id,
    name: l.name,
    kind: l.kind ?? null,
    area: l.area ?? null,
    country: l.country ?? null,
    status: l.status,
    score: l.score ?? null,
    phone,
    email: l.email ?? null,
    website: l.website ?? null,
    summary: l.summary ?? null,
    review: l.review ?? null,
    hasShot: Boolean(l.shot),
    check: { kind: check.kind ?? null, scores: check.scores ?? null },
    messages: m,
    links: {
      whatsapp: phone && m.whatsapp ? whatsappLink(phone, m.whatsapp) : null,
      sms: phone && m.sms ? smsLink(phone, m.sms) : null,
      call: phone ? `tel:${phone}` : null,
    },
    preview: preview.slug ? { url: previewLink(preview.slug), views: preview.views ?? 0, lastViewedAt: preview.lastViewedAt ?? null } : null,
    contactedAt: l.contactedAt ?? null,
    updatedAt: l.updatedAt,
    notes: l.notes ?? null,
    log: ((l.log as { at: string; what: string }[]) ?? []).slice(-6),
  };
}

const TABS: Record<string, Where> = {
  ready: { status: { equals: "ready" } },
  contacted: { status: { equals: "contacted" } },
  replied: { status: { equals: "replied" } },
  won: { status: { equals: "won" } },
  all: { status: { not_in: ["stopped"] } },
};

export async function GET(req: Request, { params }: Params) {
  const { action } = await params;
  const payload = await getPayload({ config });
  const url = new URL(req.url);

  // "Get this website" on a preview made from a template: tell the owner, then open a chat with them.
  if (action === "get") {
    const token = url.searchParams.get("t") ?? "";
    const { docs } = token ? await payload.find({ collection: "leads", where: { stopToken: { equals: token } }, limit: 1, depth: 0, overrideAccess: true }) : { docs: [] };
    const lead = docs[0] as unknown as (Lead & { preview?: { slug?: string }; log?: unknown[] }) | undefined;
    const s = await loadOutreach(payload);
    const site = (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.jomiez.com").replace(/\/$/, "");
    if (!lead || lead.status === "stopped") return Response.redirect(`${site}/contact`, 302);
    const key = `outreach:get:${lead.id}`;
    if (!(await payload.kv.get(key))) {
      await payload.kv.set(key, Date.now());
      await payload.update({ collection: "leads", id: lead.id, data: { log: [...((lead.log as unknown[]) ?? []), { at: new Date().toISOString(), what: "Tapped “Get this website” on their preview" }] } as never, overrideAccess: true }).catch(() => undefined);
      await push(payload, { title: `${lead.name} wants their website`, body: "They tapped “Get this website” on their preview. Reply while they're interested.", url: `/app?lead=${lead.id}`, tag: `get-${lead.id}` }).catch(() => undefined);
    }
    const link = lead.preview?.slug ? previewLink(lead.preview.slug) : site;
    return Response.redirect(
      s.senderPhone ? `https://wa.me/${s.senderPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw the website preview for ${lead.name} (${link}). I'd like to know more.`)}` : `${site}/contact`,
      302,
    );
  }

  if (action === "stop") {
    const token = url.searchParams.get("t") ?? "";
    const { docs } = token ? await payload.find({ collection: "leads", where: { stopToken: { equals: token } }, limit: 1, depth: 0, overrideAccess: true }) : { docs: [] };
    const lead = docs[0] as unknown as Lead | undefined;
    if (!lead) return page("Not found", `<h1>That link has expired</h1><p>If you'd like us to stop contacting you, reply to our message with “stop” and we won't again.</p>`);
    if (lead.status === "stopped") return page("Done", `<h1>You won't hear from us again</h1><p>${esc(lead.name)} is off our list. Sorry for the bother.</p>`);
    return page(
      "Stop messages",
      `<h1>Stop messages from Jomiez?</h1><p>We contacted ${esc(lead.name)} about a website. Press the button and we won't contact you again.</p><form method="post"><button type="submit">Yes, don't contact me again</button></form>`,
    );
  }

  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return json({ error: "Sign in first." }, 401);

  if (action === "summary") {
    const n = async (status: string) => (await payload.count({ collection: "leads", where: { status: { equals: status } }, overrideAccess: true })).totalDocs;
    const s = await loadOutreach(payload);
    const last = await payload.kv.get<{ at: string; found: number; written: number; notes: string[] }>("outreach:last");
    return json({ enabled: s.enabled, ready: await n("ready"), contacted: await n("contacted"), replied: await n("replied"), won: await n("won"), last, email: await emailsLeftToday(payload) });
  }

  if (action === "leads") {
    const tab = url.searchParams.get("tab") ?? "ready";
    const where = TABS[tab] ?? TABS.ready;
    const sort = tab === "ready" ? "-score" : "-updatedAt";
    const found = await payload.find({ collection: "leads", where, sort, limit: 60, depth: 0, overrideAccess: true, select: { shot: false } });
    const docs = found.docs as unknown as Lead[];
    const totalDocs = found.totalDocs;
    const one = url.searchParams.get("lead");
    let extra: Lead | null = null;
    if (one && !docs.some((d) => String(d.id) === one)) extra = (await payload.findByID({ collection: "leads", id: one, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as Lead | null;
    return json({ tab, total: totalDocs, leads: [...(extra ? [extra] : []), ...docs].map(forApp), email: await emailsLeftToday(payload) });
  }

  if (action === "shot") {
    const id = url.searchParams.get("id");
    const lead = id ? ((await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as Lead | null) : null;
    const shot = typeof lead?.shot === "string" ? lead.shot : "";
    const m = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(shot);
    if (!m) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(m[2], "base64"), { headers: { "content-type": m[1], "cache-control": "private, max-age=86400" } });
  }

  return json({ error: "Unknown action." }, 404);
}

export async function POST(req: Request, { params }: Params) {
  const { action } = await params;
  const payload = await getPayload({ config });

  // From the confirm page, or a mail app's one-click unsubscribe.
  if (action === "stop") {
    const token = new URL(req.url).searchParams.get("t") ?? "";
    const done = token ? await stopLead(payload, { token }) : null;
    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded") && (await req.clone().text()).includes("List-Unsubscribe=One-Click")) return new Response(null, { status: 200 });
    return done ? page("Done", `<h1>You won't hear from us again</h1><p>${esc(done.name)} is off our list. Sorry for the bother.</p>`) : page("Not found", `<h1>That link has expired</h1><p>Reply to our message with “stop” and we won't contact you again.</p>`);
  }

  if (!sameOrigin(req)) return json({ error: "Wrong origin." }, 403);
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return json({ error: "Sign in first." }, 401);
  if (action === "test-email") {
    try {
      const to = await sendTestEmail(payload);
      return json({ ok: true, message: `Sent to ${to}. Check that inbox.` });
    } catch (err) {
      return json({ ok: false, message: (err as Error).message });
    }
  }
  if (action !== "lead") return json({ error: "Unknown action." }, 404);

  const body = (await req.json().catch(() => ({}))) as {
    id?: number | string;
    do?: string;
    channel?: Channel;
    status?: string;
    note?: string;
    instructions?: string;
    messages?: { whatsapp?: string; sms?: string; emailSubject?: string; emailBody?: string };
  };
  if (body.id == null) return json({ error: "Which lead?" }, 400);
  const id = body.id;
  const reply = async () => json({ lead: forApp((await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead) });
  try {
    switch (body.do) {
      case "sent":
        if (!["whatsapp", "sms", "email"].includes(String(body.channel))) return json({ error: "Sent how?" }, 400);
        await markSent(payload, id, body.channel as Channel);
        return reply();
      case "unsent":
        await unmarkSent(payload, id);
        return reply();
      case "status":
        if (!["replied", "won", "lost", "skipped", "stopped", "ready", "checked"].includes(String(body.status))) return json({ error: "Unknown status." }, 400);
        await setStatus(payload, id, String(body.status), body.note);
        return reply();
      case "save": {
        const lead = (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Lead;
        const clean = Object.fromEntries(Object.entries(body.messages ?? {}).filter(([k, v]) => ["whatsapp", "sms", "emailSubject", "emailBody"].includes(k) && typeof v === "string"));
        await payload.update({ collection: "leads", id, data: { messages: { ...((lead.messages as object) ?? {}), ...clean } } as never, overrideAccess: true });
        return reply();
      }
      case "email":
        await sendLeadEmail(payload, id);
        return reply();
      case "rewrite":
      case "preview": {
        const model = await writerModel(payload);
        const s = await loadOutreach(payload);
        const url = body.do === "preview" ? (await makePreview(payload, id, { model })).url : null;
        await writeLead(payload, id, { model, settings: s, previewUrl: url, extra: body.instructions?.slice(0, 400) });
        return reply();
      }
      default:
        return json({ error: "Unknown request." }, 400);
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
}
