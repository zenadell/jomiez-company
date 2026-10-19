/*
 * Catching lead replies (cms/outreach/replies.ts), end to end against a real
 * database, a fake Google Script and a scripted model. No network, no keys.
 *
 *   npm run test:replies
 *
 * Uses its own throwaway database file, never jomiez.db.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "jomiez-replies-"));
process.env.DATABASE_URI = `file:${path.join(dir, "test.db")}`;
process.env.PAYLOAD_SECRET ||= "test-secret-for-the-replies-test-only-0123456789";
process.env.GMAIL_SCRIPT_URL = "https://script.google.com/macros/s/TEST/exec";
process.env.GMAIL_SCRIPT_PASSWORD = "test-password";
process.env.AGENT_CLOCK = "off";

const { getPayload } = await import("payload");
const { MockLanguageModelV4 } = await import("ai/test");
const config = (await import("../payload.config")).default;
const replies = await import("../cms/outreach/replies");
const send = await import("../cms/outreach/send");

let failed = 0;
let passed = 0;
function check(name: string, ok: unknown, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${!ok && detail !== undefined ? `  → ${JSON.stringify(detail)}` : ""}`);
}

/* ---------- The rules, on their own ---------- */

check("address from a display name", send.addressOf("Ada Obi <Ada@Shop.ng>") === "ada@shop.ng");
check("address on its own", send.addressOf("ada@shop.ng") === "ada@shop.ng");
check("no address", send.addressOf("Ada Obi") === "");

const quoted = "Yes please, send me the price.\n\nOn Tue, 7 Oct 2026 at 10:02, Tim <tim@jomiez.com> wrote:\n> Hi, we made a preview for you\n> stop";
check("their own words: quoted message removed", replies.ownWords(quoted) === "Yes please, send me the price.", replies.ownWords(quoted));
check("their own words: '>' lines removed", replies.ownWords("Thanks!\n> old text") === "Thanks!");
check("their own words: phone signature removed", replies.ownWords("Call me\n\nSent from my iPhone") === "Call me");

for (const yes of ["STOP", "stop.", "Unsubscribe", "Please stop emailing me", "Please remove me from your list", "Do not contact us again, thanks."]) check(`asks to stop: “${yes}”`, replies.asksToStop(yes));
for (const no of ["Yes, I'd like that. Can you call me?", "Don't hesitate to contact me on WhatsApp", "We can't stop now, the shop is busy. How much is it?"]) check(`doesn't ask to stop: “${no}”`, !replies.asksToStop(no));

check("out of office by subject", replies.isAutoReply("Automatic reply: A quick idea", "I am away"));
check("a real reply is not automatic", !replies.isAutoReply("Re: A quick idea", "Sounds good, how much?"));

const L = (id: number, email: string, domain?: string) => ({ id, name: `Lead ${id}`, status: "contacted", email, domain }) as never;
const pool = [L(1, "ada@shopa.ng", "shopa.ng"), L(2, "bola@gmail.com"), L(3, "info@clinic.co.uk")];
check("match: exact address", (replies.matchLead("Ada <ADA@shopa.ng>", pool) as { id: number } | null)?.id === 1);
check("match: someone else at their company", (replies.matchLead("Chidi <chidi@clinic.co.uk>", pool) as { id: number } | null)?.id === 3);
check("no match: a stranger on Gmail is not 'the business at gmail.com'", replies.matchLead("x <someone@gmail.com>", pool) === null);
check("senders: addresses and company domains, never webmail domains", JSON.stringify(replies.sendersFor(pool).sort()) === JSON.stringify(["ada@shopa.ng", "bola@gmail.com", "clinic.co.uk", "info@clinic.co.uk", "shopa.ng"]), replies.sendersFor(pool));

/* ---------- End to end ---------- */

const payload = await getPayload({ config });

const now = Date.now();
const day = 86_400_000;
const sentLog = (at: number) => [{ at: new Date(at).toISOString(), what: "Sent by email" }];
async function lead(name: string, email: string, extra: Record<string, unknown> = {}) {
  return payload.create({
    collection: "leads",
    data: { name, email, status: "contacted", contactedAt: new Date(now - 2 * day).toISOString(), log: sentLog(now - 2 * day), messages: { emailSubject: "A quick idea", emailBody: "Hi, we made a preview for you." }, ...extra } as never,
    overrideAccess: true,
  });
}
const a = await lead("Shop A", "ada@shopa.ng", { domain: "shopa.ng" });
const b = await lead("Bola Hair", "bola@gmail.com");
const c = await lead("Clinic C", "info@clinic.co.uk");
const d = await lead("Diner D", "hello@dinerd.com");
const e = await lead("Estate E", "nobody@estate-e.com");
const f = await payload.create({ collection: "leads", data: { name: "Not yet F", email: "f@ffood.com", status: "checked" } as never, overrideAccess: true });

const mail = (id: string, from: string, subject: string, text: string, at = now - day) => ({ id, thread: `t-${id}`, from, subject, text, at });
let scriptAnswer: Record<string, unknown> = {};
const calls: Record<string, unknown>[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith("https://script.google.com/")) return realFetch(input, init);
  const body = JSON.parse(String(init?.body ?? "{}"));
  calls.push(body);
  if (body.password !== "test-password") return new Response(JSON.stringify({ ok: false, error: "wrong password" }));
  if (body.action === "replies") return new Response(JSON.stringify(scriptAnswer));
  return new Response(JSON.stringify({ ok: true, version: 2, from: "owner@gmail.com", left: 99 }));
}) as typeof fetch;

scriptAnswer = {
  ok: true,
  version: 2,
  replies: [
    mail("m-a", "Ada Obi <ada@shopa.ng>", "Re: A quick idea", quoted),
    mail("m-b", "bola@gmail.com", "Re: A quick idea", "STOP"),
    mail("m-c", "Clinic <info@clinic.co.uk>", "Automatic reply: A quick idea", "I am out of the office until Monday."),
    mail("m-d", "hello@dinerd.com", "Re: A quick idea", "No thanks, we are not interested at the moment."),
    mail("m-old", "ada@shopa.ng", "Hello", "An email from before we ever wrote to them", now - 10 * day),
    mail("m-x", "stranger@random.org", "Hi", "Who is this?"),
    mail("m-f", "f@ffood.com", "Hi", "Hello there"),
  ],
  bounces: [mail("m-bounce", "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)", "Your message wasn't delivered to nobody@estate-e.com because the address couldn't be found.")],
};

const prompts: string[] = [];
const model = new MockLanguageModelV4({
  doGenerate: async (opts) => {
    const prompt = JSON.stringify(opts.prompt);
    prompts.push(prompt);
    const answer = /not interested/i.test(prompt)
      ? { intent: "not_interested", gist: "They said no thanks for now." }
      : { intent: "interested", gist: "They want the price.", emailBody: "Hi Ada, thanks for getting back to me. The price depends on what you need; could you tell me a little about your shop? Tim, Jomiez", whatsapp: "Hi Ada, thanks! Tell me a little about your shop and I'll send the price. Tim" };
    return {
      content: [{ type: "text", text: JSON.stringify(answer) }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } },
      warnings: [],
    } as never;
  },
});

const res = await replies.checkReplies(payload, { force: true, model: model as never });
const get = async (id: number | string) => (await payload.findByID({ collection: "leads", id, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown> & { messages: Record<string, unknown>; log: { what: string }[] };

check("the script was asked about our leads only", JSON.stringify(((calls[0]?.senders as string[]) ?? []).sort()) === JSON.stringify(["ada@shopa.ng", "bola@gmail.com", "clinic.co.uk", "dinerd.com", "estate-e.com", "hello@dinerd.com", "info@clinic.co.uk", "nobody@estate-e.com", "shopa.ng"]), calls[0]?.senders);
check("asked as 'test' too, so the first version of the script sends nothing", calls[0]?.test === true);

const A = await get(a.id);
check("an interested reply marks the lead Replied", A.status === "replied", A.status);
check("…and drafts the email answer", String(A.messages.emailBody).startsWith("Hi Ada"), A.messages.emailBody);
check("…with a Re: subject", A.messages.emailSubject === "Re: A quick idea", A.messages.emailSubject);
check("…and no automatic 'no reply' follow-up any more", Number(A.followUps) >= 1);
const reply = await payload.kv.get<{ text: string; messageId: string; intent: string }>(send.replyKey(a.id));
check("their words are kept, without our quoted email", reply?.text === "Yes please, send me the price.", reply?.text);
check("the model saw their words only between the markers", prompts.some((p) => p.includes("<<<REPLY") && p.includes("Yes please, send me the price.") && !p.includes("> stop")));
check("a 'STOP' reply never reaches the model", !prompts.some((p) => p.includes("STOP\\n")) && prompts.length === 2, prompts.length);

const B = await get(b.id);
check("“STOP” is honoured: asked not to be contacted", B.status === "stopped", B.status);
check("…and remembered for good", ((await payload.kv.get<string[]>("outreach:suppressed")) ?? []).includes("bola@gmail.com"));

const C = await get(c.id);
check("an out-of-office leaves the lead as it was", C.status === "contacted", C.status);
check("…and is noted in its history", C.log.some((l) => /Automatic reply/.test(l.what)));

const D = await get(d.id);
check("a polite no becomes Not interested", D.status === "lost", D.status);

const E = await get(e.id);
check("a bounce sets the address aside", E.email === null || E.email === "", E.email);
check("…and says so in its history", E.log.some((l) => /bounced/.test(l.what) && l.what.includes("nobody@estate-e.com")));

const F = await get(f.id);
check("someone we never contacted isn't touched", F.status === "checked", F.status);
check("the result counts what it read", res?.replied.length === 1 && res.stopped.length === 1 && res.notInterested.length === 1 && res.autoReplies.length === 1 && res.bounced.length === 1, res);

check("within ten minutes, it doesn't look again on its own", (await replies.checkReplies(payload, { model: model as never })) === null);
const again = await replies.checkReplies(payload, { force: true, model: model as never });
check("a reply already read is never read twice", again?.checked === 0 && again.replied.length === 0, again);

/* Answering: into the same Gmail conversation, to whoever wrote, outside the daily limit. */
const before = (await payload.kv.get<number>(`outreach:emails:${new Date().toISOString().slice(0, 10)}`)) ?? 0;
calls.length = 0;
await send.sendLeadEmail(payload, a.id);
const sent = calls.find((x) => x.to);
check("the answer goes into the same conversation", sent?.replyTo === "m-a", sent?.replyTo);
check("…to the address that wrote", sent?.to === "ada@shopa.ng", sent?.to);
check("…and doesn't use up a first-email slot", ((await payload.kv.get<number>(`outreach:emails:${new Date().toISOString().slice(0, 10)}`)) ?? 0) === before);
check("…and is remembered as answered", Boolean((await payload.kv.get<{ answeredAt?: string }>(send.replyKey(a.id)))?.answeredAt));
check("the lead is back under Sent, waiting for their next reply", (await get(a.id)).status === "contacted");

/* A script from before this change can't read: said plainly, nothing changes. */
scriptAnswer = { ok: true, from: "owner@gmail.com", left: 99 };
const old = await replies.checkReplies(payload, { force: true, model: model as never });
const state = await payload.kv.get<{ ok: boolean; message: string }>(replies.STATE_KEY);
check("the first version of the script is named, not mistaken for 'nothing new'", state?.ok === false && /first version/.test(state.message), state);
check("…and nothing was changed", old?.checked === 0);

/* Without a model: the reply is still caught, with their words as the gist and no draft. */
const g = await lead("Garage G", "g@garage-g.com");
scriptAnswer = { ok: true, version: 2, replies: [mail("m-g", "g@garage-g.com", "Re: A quick idea", "Interesting. What would it cost?", now - 1000)], bounces: [] };
await payload.kv.delete("outreach:replies:since");
await replies.checkReplies(payload, { force: true, model: null });
const G = await get(g.id);
check("no model: still marked Replied", G.status === "replied", G.status);
check("…with their words as the gist", (await payload.kv.get<{ gist: string }>(send.replyKey(g.id)))?.gist === "Interesting. What would it cost?");
check("…and the first email left as it was (nothing invented)", G.messages.emailBody === "Hi, we made a preview for you.");

globalThis.fetch = realFetch;
console.log(`\n${passed} passed, ${failed} failed`);
rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
