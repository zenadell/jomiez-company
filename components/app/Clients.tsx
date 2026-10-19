"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from "./Sheet";
import { ago, post, tap } from "./lib";

/*
 * Clients: the businesses Keeper found that could use a better website, and
 * the message it wrote to each. Read it, change it if you like, then send it
 * yourself: WhatsApp or Messages opens with it filled in (your own number), or
 * the email goes from your Gmail. Then keep track: replied, won, not interested.
 * Email replies are caught from your Gmail on their own (cms/outreach/replies.ts),
 * with an answer drafted; WhatsApp replies are marked by hand.
 */

export type ClientsSummary = {
  enabled: boolean;
  ready: number;
  contacted: number;
  replied: number;
  won: number;
  last?: { at: string; found: number; written: number; notes: string[] } | null;
  email?: { left: number; ready: boolean };
  replies?: { at: string; ok: boolean; message: string } | null;
};

type Lead = {
  id: number;
  name: string;
  kind: string | null;
  area: string | null;
  status: string;
  score: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  summary: string | null;
  review: string | null;
  hasShot: boolean;
  messages: { whatsapp?: string; sms?: string; emailSubject?: string; emailBody?: string; followUp?: boolean };
  links: { whatsapp: string | null; sms: string | null; call: string | null };
  preview: { url: string; views: number; lastViewedAt: string | null } | null;
  contactedAt: string | null;
  updatedAt: string;
  log: { at: string; what: string }[];
  reply: { at: string; from: string; subject: string; text: string; gist: string; intent: string; answeredAt: string | null } | null;
};

const TABS = [
  ["ready", "To send"],
  ["contacted", "Sent"],
  ["replied", "Replied"],
  ["won", "Won"],
] as const;
type Tab = (typeof TABS)[number][0];

export async function fetchClientsSummary(): Promise<ClientsSummary | null> {
  const res = await fetch("/api/outreach/summary", { credentials: "include", cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json()) as ClientsSummary) : null;
}

const POP = { initial: { y: 18, scale: 0.97 }, animate: { y: 0, scale: 1 }, exit: { scale: 0.9, y: -8 }, transition: { type: "spring", stiffness: 420, damping: 32 } } as const;

export function ClientsSheet({ open, onClose, focus, onChanged }: { open: boolean; onClose: () => void; focus?: number | null; onChanged: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Clients" tall>
      <ClientsList focus={focus ?? null} onChanged={onChanged} />
    </Sheet>
  );
}

function ClientsList({ focus, onChanged }: { focus: number | null; onChanged: () => void }) {
  const [tab, setTab] = useState<Tab>("ready");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [email, setEmail] = useState<{ left: number; ready: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: number; name: string; how: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumped = useRef(false);

  const load = useCallback(async (which: Tab) => {
    setError(null);
    const q = new URLSearchParams({ tab: which, ...(focus ? { lead: String(focus) } : {}) });
    const res = await fetch(`/api/outreach/leads?${q}`, { credentials: "include", cache: "no-store" }).catch(() => null);
    if (!res?.ok) {
      setError("Couldn't load your clients. Pull down on the home screen to try again.");
      setLeads([]);
      return;
    }
    const out = (await res.json()) as { leads: Lead[]; email: { left: number; ready: boolean } };
    // A lead opened from a notification: go to its tab the first time.
    const lead = focus && !jumped.current ? out.leads.find((l) => l.id === focus) : null;
    const right = lead ? TABS.find(([id]) => id === lead.status)?.[0] : null;
    jumped.current = true;
    if (right && right !== which) {
      setTab(right);
      return;
    }
    setLeads(out.leads);
    setEmail(out.email);
  }, [focus]);

  useEffect(() => {
    let gone = false;
    void (async () => {
      if (!gone) await load(tab);
    })();
    return () => {
      gone = true;
    };
  }, [tab, load]);

  const replace = (lead: Lead) => setLeads((all) => (all ?? []).map((l) => (l.id === lead.id ? lead : l)).filter((l) => tab === "ready" ? l.status === "ready" : l.status === tab || l.id === focus));
  const act = async (lead: Lead, body: Record<string, unknown>) => {
    const out = await post<{ lead: Lead }>("/api/outreach/lead", { id: lead.id, ...body });
    replace(out.lead);
    onChanged();
    return out.lead;
  };

  const sent = (lead: Lead, how: "whatsapp" | "sms") => {
    tap(12);
    // keepalive: the request finishes even as the phone switches to WhatsApp or Messages.
    void fetch("/api/outreach/lead", { method: "POST", credentials: "include", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ id: lead.id, do: "sent", channel: how }) }).then(() => onChanged());
    setLeads((all) => (all ?? []).filter((l) => l.id !== lead.id));
    setUndo({ id: lead.id, name: lead.name, how: how === "whatsapp" ? "on WhatsApp" : "as a text" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), 9000);
  };

  return (
    <div className="ja-clients">
      <div className="ja-segments ja-segments--sheet" role="tablist" aria-label="Show">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => (setLeads(null), setTab(id))}>
            {tab === id && <motion.span layoutId="ja-clients-seg" className="ja-segments__thumb" transition={{ type: "spring", stiffness: 480, damping: 34 }} />}
            <span className="ja-segments__label">{label}</span>
          </button>
        ))}
      </div>

      {tab === "replied" && <RepliesBar onFound={() => (onChanged(), void load("replied"))} />}
      {error && <p className="ja-error">{error}</p>}
      {leads === null && (
        <div className="ja-leads">
          {[0, 1].map((i) => (
            <div key={i} className="ja-lead is-skeleton" />
          ))}
        </div>
      )}
      {leads && leads.length === 0 && !error && <Empty tab={tab} />}

      <div className="ja-leads">
        <AnimatePresence initial={false} mode="popLayout">
          {leads?.map((lead) => (
            <motion.article key={lead.id} layout="position" className={`ja-lead${lead.id === focus ? " is-focus" : ""}`} {...POP}>
              <LeadCard lead={lead} tab={tab} email={email} onAct={act} onSent={sent} />
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {undo && (
          <motion.div className="ja-toast" initial={{ y: 40, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.9 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}>
            <span>
              Marked as sent to <strong>{undo.name}</strong> {undo.how}.
            </span>
            <button
              type="button"
              onClick={async () => {
                const u = undo;
                setUndo(null);
                await post("/api/outreach/lead", { id: u.id, do: "unsent" }).catch(() => {});
                onChanged();
                void load(tab);
              }}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Email replies are caught on their own; this says when it last looked, and looks now. */
function RepliesBar({ onFound }: { onFound: () => void }) {
  const [state, setState] = useState<{ ok: boolean; message: string; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetchClientsSummary().then((s) => setState(s?.replies ?? null));
  }, []);
  return (
    <div className={`ja-replies${state && !state.ok ? " is-bad" : ""}`}>
      <p>{state ? `${state.message} ${state.ok ? `· ${ago(state.at)}` : ""}` : "Email replies are read from your Gmail every ten minutes."}</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const out = await post<{ ok?: boolean; message?: string; state?: { ok: boolean; message: string; at: string } | null; result?: { replied?: unknown[] } | null }>("/api/outreach/replies").catch((err: Error) => ({ ok: false, message: err.message, state: null, result: null }));
          setState(out.state ?? { ok: false, message: out.message ?? "Couldn't check.", at: new Date().toISOString() });
          setBusy(false);
          tap(10);
          if (out.result?.replied?.length) onFound();
        }}
      >
        {busy ? "Checking…" : "Check now"}
      </button>
    </div>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const text = {
    ready: "No messages waiting. Keeper writes new ones each morning, or ask it: “Find 10 salons in Lekki that need a website”.",
    contacted: "Messages you send show up here, with whether they opened their preview.",
    replied: "Email replies show up here on their own, with an answer ready for you. For a reply on WhatsApp or by text, mark it on their card under Sent.",
    won: "Your new clients will be here.",
  }[tab];
  return (
    <div className="ja-clients__empty">
      <p>{text}</p>
      {tab === "ready" && (
        <Link className="ja-btn ja-btn--plain ja-btn--small" href="/admin/globals/outreach">
          Areas and settings
        </Link>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  tab,
  email,
  onAct,
  onSent,
}: {
  lead: Lead;
  tab: Tab;
  email: { left: number; ready: boolean } | null;
  onAct: (lead: Lead, body: Record<string, unknown>) => Promise<Lead>;
  onSent: (lead: Lead, how: "whatsapp" | "sms") => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lead.messages.whatsapp ?? "");
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState("");
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(lead.messages.emailBody ?? "");
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [readAll, setReadAll] = useState(false);

  const run = async (label: string, body: Record<string, unknown>) => {
    setBusy(label);
    setProblem(null);
    try {
      const next = await onAct(lead, body);
      setDraft(next.messages.whatsapp ?? "");
      setAnswer(next.messages.emailBody ?? "");
      tap(10);
    } catch (err) {
      setProblem((err as Error).message);
    }
    setBusy(null);
  };

  const found = (lead.summary ?? "")
    .split("\n")
    .map((l) => l.replace(/^•\s*/, "").trim())
    .filter(Boolean);
  const where = [lead.kind, lead.area].filter(Boolean).join(" · ");
  const lastSent = [...lead.log].reverse().find((l) => /^(Sent|Follow-up sent)/.test(l.what));
  const chat = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <>
      <header className="ja-lead__head">
        {lead.hasShot ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small screenshot of their current site
          <img className="ja-lead__shot" src={`/api/outreach/shot?id=${lead.id}`} alt="" loading="lazy" />
        ) : (
          <span className="ja-lead__shot is-none" aria-hidden="true">
            {lead.website ? "Site" : "No site"}
          </span>
        )}
        <span className="ja-lead__who">
          <strong>{lead.name}</strong>
          {where && <small>{where}</small>}
          <span className="ja-lead__tags">
            {lead.messages.followUp && tab === "ready" && <span className="ja-tag">Follow-up</span>}
            {!lead.website && <span className="ja-tag is-hot">No website</span>}
            {lead.preview && (
              <a className={`ja-tag${lead.preview.views ? " is-seen" : ""}`} href={lead.preview.url} target="_blank" rel="noopener">
                {lead.preview.views ? `Preview opened ${lead.preview.views}×` : "Preview ↗"}
              </a>
            )}
          </span>
        </span>
        {typeof lead.score === "number" && (
          <span className="ja-lead__score" title="Lead score">
            {lead.score}
          </span>
        )}
      </header>

      {tab === "ready" && (
        <>
          {found.length > 0 && (
            <ul className="ja-lead__found">
              {found.slice(0, open ? 8 : 2).map((f) => (
                <li key={f}>{f}</li>
              ))}
              {(found.length > 2 || lead.review) && (
                <li className="ja-lead__more">
                  <button type="button" onClick={() => setOpen((v) => !v)}>
                    {open ? "Less" : `More (${found.length - 2 > 0 ? `${found.length - 2} more` : "how it looks"})`}
                  </button>
                </li>
              )}
              {open && lead.review && <li className="ja-lead__review">{lead.review}</li>}
            </ul>
          )}

          <div className="ja-lead__msg">
            {editing ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} aria-label="WhatsApp message" />
            ) : (
              <p>{lead.messages.whatsapp || "No message written yet."}</p>
            )}
            <div className="ja-lead__msgbar">
              {editing ? (
                <>
                  <button type="button" onClick={() => (setEditing(false), setDraft(lead.messages.whatsapp ?? ""))}>
                    Cancel
                  </button>
                  <button type="button" className="is-strong" disabled={busy !== null} onClick={async () => (await run("save", { do: "save", messages: { whatsapp: draft } }), setEditing(false))}>
                    {busy === "save" ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setAsking((v) => !v)}>
                    Rewrite…
                  </button>
                  {!lead.preview && (
                    <button type="button" disabled={busy !== null} onClick={() => void run("preview", { do: "preview" })}>
                      {busy === "preview" ? "Making a preview…" : "Add a preview"}
                    </button>
                  )}
                </>
              )}
            </div>
            {asking && !editing && (
              <form
                className="ja-lead__ask"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAsking(false);
                  void run("rewrite", { do: "rewrite", instructions: ask });
                  setAsk("");
                }}
              >
                <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Shorter, more formal, mention bookings…" enterKeyHint="send" />
                <button type="submit" className="ja-btn ja-btn--plain ja-btn--small">
                  Rewrite
                </button>
              </form>
            )}
            {busy === "rewrite" && <p className="ja-lead__busy">Rewriting…</p>}
          </div>

          <div className="ja-lead__send">
            {lead.links.whatsapp && (
              <a className="ja-btn ja-btn--approve" href={lead.links.whatsapp} target="_blank" rel="noopener" onClick={() => onSent(lead, "whatsapp")}>
                WhatsApp
              </a>
            )}
            {lead.links.sms && (
              <a className={`ja-btn ${lead.links.whatsapp ? "ja-btn--plain" : "ja-btn--approve"}`} href={lead.links.sms} onClick={() => onSent(lead, "sms")}>
                Text
              </a>
            )}
            {lead.email && lead.messages.emailBody && (
              <button
                type="button"
                className={`ja-btn ${lead.links.whatsapp || lead.links.sms ? "ja-btn--plain" : "ja-btn--approve"}`}
                disabled={busy !== null || !email?.ready || !email.left}
                title={!email?.ready ? "Set up your Gmail in Clients settings first" : !email.left ? "Today's emails have gone out" : undefined}
                onClick={() => void run("email", { do: "email" })}
              >
                {busy === "email" ? "Sending…" : "Email"}
              </button>
            )}
          </div>
          {lead.email && lead.messages.emailBody && email && !email.ready && <p className="ja-lead__note">To email, set up your Gmail in Clients → Finding clients → Email (a two-minute Google Script).</p>}
          <div className="ja-lead__quiet">
            <button type="button" disabled={busy !== null} onClick={() => void run("skip", { do: "status", status: "skipped" })}>
              Skip
            </button>
            <button type="button" disabled={busy !== null} onClick={() => void run("stop", { do: "status", status: "stopped" })}>
              They asked not to be contacted
            </button>
          </div>
        </>
      )}

      {tab === "replied" && lead.reply && (
        <>
          <div className="ja-lead__reply">
            <small>
              {lead.reply.intent === "interested" ? "Interested" : lead.reply.intent === "question" ? "A question" : "Their reply"} · {ago(lead.reply.at)}
            </small>
            <p className="ja-lead__gist">{lead.reply.gist}</p>
            {readAll ? <p className="ja-lead__words">{lead.reply.text}</p> : null}
            <button type="button" onClick={() => setReadAll((v) => !v)}>
              {readAll ? "Hide their email" : "Read their email"}
            </button>
          </div>
          {!lead.reply.answeredAt && lead.messages.emailBody && (
            <div className="ja-lead__msg is-answer">
              <small>Your answer, drafted by Keeper</small>
              {editingAnswer ? <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8} aria-label="Your answer" /> : <p>{lead.messages.emailBody}</p>}
              <div className="ja-lead__msgbar">
                {editingAnswer ? (
                  <>
                    <button type="button" onClick={() => (setEditingAnswer(false), setAnswer(lead.messages.emailBody ?? ""))}>
                      Cancel
                    </button>
                    <button type="button" className="is-strong" disabled={busy !== null} onClick={async () => (await run("save", { do: "save", messages: { emailBody: answer } }), setEditingAnswer(false))}>
                      {busy === "save" ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditingAnswer(true)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => setAsking((v) => !v)}>
                      Rewrite…
                    </button>
                  </>
                )}
              </div>
              {asking && !editingAnswer && (
                <form
                  className="ja-lead__ask"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAsking(false);
                    void run("answer", { do: "answer", instructions: ask });
                    setAsk("");
                  }}
                >
                  <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Shorter, offer a call on Thursday…" enterKeyHint="send" />
                  <button type="submit" className="ja-btn ja-btn--plain ja-btn--small">
                    Rewrite
                  </button>
                </form>
              )}
              {busy === "answer" && <p className="ja-lead__busy">Rewriting…</p>}
              <div className="ja-lead__send">
                <button type="button" className="ja-btn ja-btn--approve" disabled={busy !== null || !email?.ready} title={!email?.ready ? "Set up your Gmail in Clients settings first" : undefined} onClick={() => void run("email", { do: "email" })}>
                  {busy === "email" ? "Sending…" : "Send by email"}
                </button>
                {lead.links.whatsapp && (
                  <a className="ja-btn ja-btn--plain" href={lead.links.whatsapp} target="_blank" rel="noopener" onClick={() => onSent(lead, "whatsapp")}>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab !== "ready" && (
        <>
          <p className="ja-lead__line">
            {lastSent ? `${lastSent.what} · ${ago(lastSent.at)}` : lead.contactedAt ? `Contacted ${ago(lead.contactedAt)}` : `Updated ${ago(lead.updatedAt)}`}
            {lead.preview?.lastViewedAt ? ` · preview opened ${ago(lead.preview.lastViewedAt)}` : ""}
          </p>
          <div className="ja-lead__send">
            {chat && (
              <a className="ja-btn ja-btn--plain" href={chat} target="_blank" rel="noopener">
                Chat
              </a>
            )}
            {lead.links.call && (
              <a className="ja-btn ja-btn--plain" href={lead.links.call}>
                Call
              </a>
            )}
            {tab === "contacted" && (
              <button type="button" className="ja-btn ja-btn--approve" disabled={busy !== null} onClick={() => void run("replied", { do: "status", status: "replied" })}>
                Replied
              </button>
            )}
            {tab === "replied" && (
              <button type="button" className="ja-btn ja-btn--approve" disabled={busy !== null} onClick={() => void run("won", { do: "status", status: "won" })}>
                Won them
              </button>
            )}
          </div>
          {tab !== "won" && (
            <div className="ja-lead__quiet">
              <button type="button" disabled={busy !== null} onClick={() => void run("lost", { do: "status", status: "lost" })}>
                Not interested
              </button>
              <button type="button" disabled={busy !== null} onClick={() => void run("stop", { do: "status", status: "stopped" })}>
                Asked not to be contacted
              </button>
            </div>
          )}
        </>
      )}
      {problem && <p className="ja-lead__problem">{problem}</p>}
    </>
  );
}
