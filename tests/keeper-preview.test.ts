/*
 * Keeper and template previews: a conversation left with an unanswered tool
 * call (a stop, a crash, a deploy mid-run) is repaired instead of going dead;
 * a preview always shows home, about and contact, whatever the template calls
 * them; and one request makes one preview per lead (no migrating template
 * after template), with another only when the owner asked in their own words.
 * A throwaway database and a scripted model; nothing reaches the network.
 *
 *   npm run test:keeper
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "jomiez-keeper-"));
process.env.DATABASE_URI = `file:${path.join(dir, "test.db")}`;
process.env.PAYLOAD_SECRET ||= "test-secret-for-the-keeper-test-only-0123456789";
process.env.AGENT_CLOCK = "off";

const { repairHistory, UNFINISHED } = await import("../cms/agent/history");
const { previewPages } = await import("../cms/sites/make");
const { mayMakePreview, recordTry, quotes } = await import("../cms/sites/once");
const { socialLink, HIDE_HREF } = await import("../cms/sites/fill");
const { anchorTexts, linkTarget } = await import("../cms/sites/links");
const { streamText } = await import("ai");
const { MockLanguageModelV4 } = await import("ai/test");

let failed = 0;
let passed = 0;
function check(name: string, ok: unknown, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || detail === undefined ? "" : `\n     ${JSON.stringify(detail).slice(0, 400)}`}`);
}

/* ---------- A conversation that was stopped mid-step ---------- */
type M = Parameters<typeof repairHistory>[0][number];
const call = (id: string, name = "make_site_preview") => ({ type: "tool-call" as const, toolCallId: id, toolName: name, input: {} });
const result = (id: string, name = "make_site_preview") => ({ type: "tool-result" as const, toolCallId: id, toolName: name, output: { type: "json" as const, value: { ok: true } } });
const broken: M[] = [
  { role: "user", content: "Make a new homepage preview for one of the leads" },
  { role: "assistant", content: [{ type: "text", text: "On it." }, call("call_00_a"), call("call_00_Ky7Z", "screenshot")] },
  { role: "tool", content: [result("call_00_a")] },
  { role: "assistant", content: "[The owner stopped me here, before I finished.]" },
  { role: "tool", content: [result("call_ghost")] },
  { role: "user", content: "stop" },
] as M[];

const fixed = repairHistory(broken);
const toolMsg = fixed.messages[2] as { role: string; content: { toolCallId: string; output: { value: unknown } }[] };
check("the unanswered call gets an answer, next to the ones that arrived", toolMsg.role === "tool" && toolMsg.content.map((p) => p.toolCallId).join() === "call_00_a,call_00_Ky7Z");
check("…which says it didn't finish (so it isn't taken as done)", toolMsg.content[1]?.output.value === UNFINISHED);
check("an answer to a call that was never made is dropped", !JSON.stringify(fixed.messages).includes("call_ghost"));
check("everything else is kept, in order", fixed.messages.length === 5 && fixed.messages[4].content === "stop", fixed.messages.map((m) => m.role));
check("a whole history is left as it is", repairHistory(fixed.messages).repaired === 0);

const approval: M[] = [
  { role: "user", content: "publish it" },
  { role: "assistant", content: [call("c1", "publish"), { type: "tool-approval-request", approvalId: "ap1", toolCallId: "c1" }] },
  { role: "tool", content: [{ type: "tool-approval-response", approvalId: "ap1", approved: false, reason: "no" }] },
] as M[];
check("a call the owner answered (an approval) isn't touched", repairHistory(approval).repaired === 0);

// The model's own library refuses what the providers refuse: proof the repaired history goes through.
const model = new MockLanguageModelV4({
  doStream: async () => ({
    stream: new ReadableStream({
      start(c) {
        c.enqueue({ type: "text-start", id: "t" });
        c.enqueue({ type: "text-delta", id: "t", delta: "Stopped. Here's where things are." });
        c.enqueue({ type: "text-end", id: "t" });
        c.enqueue({ type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } } });
        c.close();
      },
    }),
  }),
});
const answer = async (messages: M[]) => {
  try {
    const r = streamText({ model, messages, onError: () => {} });
    let text = "";
    for await (const part of r.fullStream) {
      if (part.type === "error") return { ok: false, text: String((part.error as Error)?.message ?? part.error) };
      if (part.type === "text-delta") text += part.text;
    }
    return { ok: true, text };
  } catch (err) {
    return { ok: false, text: String((err as Error).message ?? err) };
  }
};
const before = await answer(broken);
check("the broken history is refused with the owner's exact error", !before.ok && /Tool result is missing for tool call call_00_Ky7Z/.test(before.text), before);
const after = await answer(fixed.messages);
check("the repaired one gets an answer", after.ok && after.text.length > 0, after);

// What a run keeps step by step (cms/agent/run.ts onStepEnd) is the whole run, not just its last step.
{
  const { tool, isStepCount } = await import("ai");
  const { z } = await import("zod");
  let n = 0;
  const finish = { type: "finish" as const, finishReason: { unified: "tool-calls" as const, raw: "tool_calls" }, usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } } };
  const twoSteps = new MockLanguageModelV4({
    doStream: async () => {
      const first = n++ === 0;
      return {
        stream: new ReadableStream({
          start(c) {
            if (first) c.enqueue({ type: "tool-call", toolCallId: "s1", toolName: "look", input: "{}" });
            else {
              c.enqueue({ type: "text-start", id: "t" });
              c.enqueue({ type: "text-delta", id: "t", delta: "done" });
              c.enqueue({ type: "text-end", id: "t" });
            }
            c.enqueue(first ? finish : { ...finish, finishReason: { unified: "stop" as const, raw: "stop" } });
            c.close();
          },
        }),
      };
    },
  });
  let soFar: unknown[] = [];
  const r = streamText({
    model: twoSteps,
    messages: [{ role: "user", content: "go" }],
    tools: { look: tool({ inputSchema: z.object({}), execute: async () => ({ seen: true }) }) },
    stopWhen: isStepCount(3),
    onStepEnd: (step) => {
      soFar = [...soFar, ...((step as { response?: { messages?: unknown[] } }).response?.messages ?? [])];
    },
  });
  await r.consumeStream();
  const all = await r.responseMessages;
  check("the messages kept step by step are the whole run", JSON.stringify(soFar) === JSON.stringify(all) && all.length === 3, { kept: soFar.length, all: all.length });
}

/* ---------- Which pages a lead sees ---------- */
const chatora = ["home", "menu", "about", "reservation", "licensing"];
check("a restaurant: home, about and its reservation page (its contact page)", previewPages(chatora).join() === "home,about,reservation", previewPages(chatora));
check("…whatever the model asked for", previewPages(chatora, ["home"]).join() === "home,about,reservation");
check("an extra page asked for is added", previewPages(chatora, ["menu"]).join() === "home,about,reservation,menu");
check("never the whole template", !previewPages(chatora, ["all"]).includes("all"));
check("a page the template doesn't have is ignored", previewPages(chatora, ["pricing"]).join() === "home,about,reservation");
check("a salon: about-us and book", previewPages(["home", "services", "about-us", "book", "blog/post-1"]).join() === "home,about-us,book");
check("contact wins over a booking page when both exist", previewPages(["home", "booking", "contact", "our-story"]).join() === "home,our-story,contact");
check("a template with no about or contact still gets home", previewPages(["home", "work"]).join() === "home");

/* ---------- The template designer's social links ---------- */
const theirs = ["https://wa.me/447000000000", "https://www.instagram.com/chatora.city/"];
check("the designer's Instagram becomes the business's", socialLink("https://www.instagram.com/gola.design/", "https://www.instagram.com/gola.design/", theirs) === "https://www.instagram.com/chatora.city/");
check("the designer's X is hidden when the business has no X", socialLink("https://x.com/gola99", "https://x.com/gola99", theirs) === HIDE_HREF);
check("…even if the model pointed it at their WhatsApp", socialLink("https://x.com/gola99", "https://wa.me/447000000000", theirs) === HIDE_HREF);
check("a link that isn't social is left to the model", socialLink("tel:+440000", "tel:+447000000000", theirs) === "tel:+447000000000");
check("the hidden address is one Aethron hides", /framer\.com\/marketplace/.test(HIDE_HREF));

/* ---------- Every link on a published preview (cms/sites/links.ts) ---------- */
{
  // The Qitchen template's own footer and promo links, as its live site has them.
  const html = `<a href="https://gola.supply"><p>© Gola Templates</p></a>
    <a href="https://www.framer.com/@pawel-gola/?tab=marketplace&amp;via=pawelgola"><div>More Templates</div></a>
    <a href="https://www.framer.com/community/marketplace/templates/qitchen/?via=pawelgola">Use for Free</a>
    <a href="https://www.framer.com/marketplace/templates/salon/">Book Now</a>
    <a href="https://www.framer.com/marketplace/templates/salon/"><span>Contact us</span></a>
    <a href="https://www.instagram.com/gola.design/" aria-label="Instagram"></a>
    <a href="./reservation">Book a Table</a>`;
  const texts = anchorTexts(html);
  const ctx = { texts, business: ["https://wa.me/442045978339", "tel:+442045978339"], contactPage: "reservation", templateHosts: ["qitchen.framer.website"] };
  const to = (href: string, current = href) => linkTarget(href, current, ctx)?.to ?? "(left)";
  check("button words are read from the template's own page", texts.get("https://www.framer.com/@pawel-gola/?tab=marketplace&via=pawelgola")?.[0] === "More Templates", [...texts.keys()]);
  check("the designer's studio link goes to the preview's home", to("https://gola.supply") === "./index.html");
  check("…unless the model already pointed it at the business", linkTarget("https://gola.supply", "tel:+442045978339", ctx) === null);
  check("a “More Templates” sales link stays hidden", to("https://www.framer.com/@pawel-gola/?tab=marketplace&via=pawelgola") === "(left)");
  check("a “Use for Free” sales link stays hidden", to("https://www.framer.com/community/marketplace/templates/qitchen/?via=pawelgola") === "(left)");
  check("“Book Now” / “Contact us” buttons on a sales link go to the contact page", to("https://www.framer.com/marketplace/templates/salon/") === "./reservation.html");
  check("…and are reported even once done (so publishing doesn't hide them again)", linkTarget("https://www.framer.com/marketplace/templates/salon/", "./reservation.html", ctx)?.cta === true);
  check("without a contact page they call the business", linkTarget("https://www.framer.com/marketplace/templates/salon/", "https://www.framer.com/marketplace/templates/salon/", { ...ctx, contactPage: null })?.to === "https://wa.me/442045978339");
  check("the designer's Instagram is hidden", to("https://www.instagram.com/gola.design/") === HIDE_HREF);
  check("links between the template's own pages are left alone", to("./reservation") === "(left)" && to("https://qitchen.framer.website/about") === "(left)");
  check("a map link is left alone", to("https://www.google.com/maps/search/?api=1&query=x") === "(left)");
}

/* ---------- One preview per lead per request ---------- */
check("the owner's words must really be theirs", quotes("Ok try a different template for Chatora please", "try a different template") && !quotes("make a preview", "try a different template for them"));
check("…and at least four of them", !quotes("use another one", "another one"));

const { getPayload } = await import("payload");
const config = (await import("../payload.config")).default;
const payload = await getPayload({ config });

const thread = await payload.create({ collection: "agent-threads", data: { title: "t", status: "idle", messages: [], events: [{ kind: "user", text: "Make a new homepage preview for one of the restaurant leads", at: "2026-10-20T01:00:00.000Z" }], changes: [], pending: [] } as never, overrideAccess: true });
const threadId = String(thread.id);
const passedSite = { verdict: "pass", uploaded: "ok", template: { name: "Qitchen" } };

let gate = await mayMakePreview(payload, { threadId, leadId: 7, site: null });
check("the first preview for a lead is allowed", gate.ok, gate);
await recordTry(payload, { threadId, leadId: 7, at: gate.ok ? gate.at : "", passed: true });
gate = await mayMakePreview(payload, { threadId, leadId: 7, site: passedSite, ownerAsked: "Make a new homepage preview" });
check("after it passes, another for the same request is refused (even quoting the request)", !gate.ok && /finished/.test(gate.refused), gate);
check("…and Keeper is told to fix it in place instead", !gate.ok && /aethron tool/.test(gate.refused));

gate = await mayMakePreview(payload, { threadId, leadId: 8, site: null });
await recordTry(payload, { threadId, leadId: 8, at: gate.ok ? gate.at : "", passed: false });
check("after one failure, one more try is allowed", (await mayMakePreview(payload, { threadId, leadId: 8, site: null })).ok);
await recordTry(payload, { threadId, leadId: 8, at: gate.ok ? gate.at : "", passed: false });
gate = await mayMakePreview(payload, { threadId, leadId: 8, site: null });
check("after two failures it stops and reports", !gate.ok && /Two tries/.test(gate.refused), gate);

// A new message from the owner about a lead that already has a finished preview.
await payload.update({ collection: "agent-threads", id: thread.id, data: { events: [{ kind: "user", text: "Chatora's preview looks off, use a different template for them", at: "2026-10-20T02:00:00.000Z" }] } as never, overrideAccess: true });
gate = await mayMakePreview(payload, { threadId, leadId: 7, site: passedSite });
check("replacing a finished preview without the owner asking is refused", !gate.ok && /already has a finished preview from “Qitchen”/.test(gate.refused), gate);
gate = await mayMakePreview(payload, { threadId, leadId: 7, site: passedSite, ownerAsked: "a better template would be nice" });
check("…words the owner never wrote don't count", !gate.ok);
gate = await mayMakePreview(payload, { threadId, leadId: 7, site: passedSite, ownerAsked: "use a different template for them" });
check("…the owner's own words do, once", gate.ok, gate);

const routine = await payload.create({ collection: "agent-threads", data: { title: "routine", status: "idle", messages: [], events: [], changes: [], pending: [] } as never, overrideAccess: true });
gate = await mayMakePreview(payload, { threadId: String(routine.id), leadId: 7, site: passedSite, ownerAsked: "use a different template for them" });
check("a routine (nobody typing) never replaces a finished preview", !gate.ok);

console.log(`\n${passed} passed, ${failed} failed`);
rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
