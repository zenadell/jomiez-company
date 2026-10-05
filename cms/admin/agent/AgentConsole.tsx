"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Composer, Transcript } from "./Chat";
import { Markdown } from "./Markdown";
import { useAgentStatus, useThread } from "./useAgent";
import { MicIcon, VoiceBar, VoiceCaptions, VoiceHello } from "./Voice";
import { useVoice } from "./useVoice";

/*
 * The agent console (/admin/agent): every conversation on the left, the work in
 * the middle, and on the right its plan, every change it made (undoable), and
 * today's usage. The bell lists everything it did on its own.
 */

type ThreadRow = { id: number; title: string; status: string; source: string; updatedAt: string };
type Notice = { id: string; at: string; kind: string; title: string; body: string; link: string; read?: boolean };

const SUGGESTIONS = [
  { title: "Check the whole site", text: "Audit the whole site (SEO, image descriptions, broken links, placeholder text) and fix what you safely can as drafts. Then list what needs my decision." },
  { title: "Write a journal post", text: "Write a journal post about how Chaka AI remembers each customer's conversation, in the site's voice. Save it as a draft with a search title and description." },
  { title: "Create a page", text: "Create a Partners page from the site's sections, add it to the top menu, and save it as a draft for me to review." },
  { title: "Sort the inbox", text: "Go through the inbox: mark spam, summarise each real message in its notes, and draft replies for the promising leads." },
  { title: "Sharpen search listings", text: "Improve every page's Google title and description so each is clear, distinct and the right length." },
  { title: "A Monday briefing", text: "Every Monday at 08:00, check the site and the inbox, then pin a short briefing to the dashboard. Set that up as a routine." },
];

const STATUS_TEXT: Record<string, string> = {
  idle: "Done",
  running: "Working",
  waiting: "Needs you",
  stopped: "Stopped",
  error: "Error",
};

const SOURCE_ICON: Record<string, string> = { console: "◆", page: "✎", routine: "↻", inbox: "✉", voice: "◉" };

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export function AgentConsole() {
  const { status, refresh } = useAgentStatus(15_000);
  const api = useThread({ onDone: () => void refresh() });
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [filter, setFilter] = useState<"all" | "waiting" | "routine" | "inbox">("all");
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [undoResult, setUndoResult] = useState<string[] | null>(null);
  const voice = useVoice();
  const talking = voice.active;

  // When a voice conversation ends (or drops), open its saved transcript so it can be continued by typing or undone.
  const wasTalking = useRef(false);
  useEffect(() => {
    if (talking) {
      wasTalking.current = true;
      return;
    }
    const id = voice.state.threadId;
    if (wasTalking.current && id) {
      wasTalking.current = false;
      void api.load(id);
      window.history.replaceState(null, "", `/admin/agent?thread=${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking, voice.state.threadId]);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/agent/threads", { credentials: "include", cache: "no-store" });
    if (res.ok) setThreads((await res.json()).docs ?? []);
  }, []);

  useEffect(() => {
    const first = setTimeout(loadThreads, 0);
    const t = setInterval(loadThreads, 20_000);
    window.addEventListener("jomiez-agent-changed", loadThreads);
    // Opened from a notice or email: go straight to that conversation.
    const id = new URLSearchParams(window.location.search).get("thread");
    if (id) void api.load(id);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      window.removeEventListener("jomiez-agent-changed", loadThreads);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadThreads]);

  const open = (id: number) => {
    setUndoResult(null);
    void api.load(String(id));
    window.history.replaceState(null, "", `/admin/agent?thread=${id}`);
  };
  const fresh = () => {
    setUndoResult(null);
    api.reset();
    window.history.replaceState(null, "", "/admin/agent");
  };

  const openNotices = async () => {
    if (notices) {
      setNotices(null);
      return;
    }
    const res = await fetch("/api/agent/notices", { credentials: "include", cache: "no-store" });
    setNotices(res.ok ? (await res.json()).notices : []);
    await fetch("/api/agent/seen", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
    void refresh();
  };

  const shown = threads.filter((t) => (filter === "all" ? true : filter === "waiting" ? t.status === "waiting" : t.source === filter));
  const live = api.changes.filter((c) => !c.undone);
  const name = status?.name ?? "Agent";
  const disabledReason = status && !status.ready ? status.setup || "The agent is switched off." : null;
  const voiceUnavailable = !status ? "…" : !status.enabled ? "The agent is switched off." : status.voice?.ready ? null : status.voice?.setup || "Voice isn't set up.";
  const startTalk = () => {
    setUndoResult(null);
    voice.clearError();
    void voice.start(null);
  };
  const voiceChanges = talking ? voice.state.items.filter((i) => i.kind === "change") : [];

  const hello = (
    <div className="jz-hello">
      <span className="jz-orb jz-orb--big" aria-hidden="true" />
      <h2>What shall we grow today?</h2>
      <p>
        {name} can read and change anything on jomiez.com, look after the inbox, research, audit and work on a schedule. It asks
        before anything you haven&apos;t allowed, and every change can be undone.
      </p>
      {!voiceUnavailable && (
        <button type="button" className="jz-btn jz-btn--talk" onClick={startTalk}>
          <MicIcon /> Talk to {name}
        </button>
      )}
      <div className="jz-suggest">
        {SUGGESTIONS.map((s) => (
          <button key={s.title} type="button" disabled={Boolean(disabledReason)} onClick={() => void api.send(s.text)}>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="jz-console">
      <header className="jz-console__head">
        <div className="jz-console__who">
          <span className={`jz-orb${status?.working || voice.state.phase === "working" ? " is-working" : ""}`} aria-hidden="true" />
          <div>
            <h1>{name}</h1>
            <p>
              {status ? (status.ready ? `${status.model} · ${modeText(status.mode)}` : "Not set up yet") : "…"}
            </p>
          </div>
        </div>
        <div className="jz-console__tools">
          <button type="button" className="jz-bell" onClick={() => void openNotices()} aria-label="What it did on its own">
            <span aria-hidden="true">🔔</span>
            {status?.unread ? <span className="jz-badge">{status.unread}</span> : null}
          </button>
          {status?.canConfigure && (
            <Link className="jz-btn jz-btn--ghost" href="/admin/globals/agent">
              Settings
            </Link>
          )}
        </div>
        {notices && (
          <div className="jz-notices">
            <p className="jz-notices__head">What it did on its own</p>
            {notices.length === 0 && <p className="jz-notices__empty">Nothing yet. Routines and new-message sorting will show up here.</p>}
            {notices.map((n) => (
              <a key={n.id} className={`jz-notices__item jz-notices__item--${n.kind}`} href={n.link.replace(/^https?:\/\/[^/]+/, "")}>
                <strong>{n.title}</strong>
                <span>{ago(n.at)}</span>
              </a>
            ))}
          </div>
        )}
      </header>

      {status && !status.ready && (
        <div className="jz-setup">
          <strong>{status.canConfigure ? "Give it a mind" : "Not set up yet"}</strong>
          <span>{status.setup}</span>
          {status.canConfigure && (
            <Link className="jz-btn jz-btn--yes" href="/admin/globals/agent">
              Open Agent settings
            </Link>
          )}
        </div>
      )}

      <div className="jz-console__body">
        <aside className="jz-console__list">
          <button type="button" className="jz-btn jz-btn--new" onClick={fresh} disabled={talking}>
            + New task
          </button>
          <div className="jz-filters">
            {(["all", "waiting", "routine", "inbox"] as const).map((f) => (
              <button key={f} type="button" className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>
                {{ all: "All", waiting: "Needs you", routine: "Routines", inbox: "Inbox" }[f]}
              </button>
            ))}
          </div>
          <nav>
            {shown.length === 0 && <p className="jz-muted">No conversations yet.</p>}
            {shown.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`jz-thread${(talking ? voice.state.threadId : api.threadId) === String(t.id) ? " is-open" : ""}`}
                disabled={talking}
                title={talking ? "End the voice conversation first" : undefined}
                onClick={() => open(t.id)}
              >
                <span className="jz-thread__title">
                  <span aria-hidden="true">{SOURCE_ICON[t.source] ?? "◆"}</span> {t.title}
                </span>
                <span className={`jz-thread__meta jz-thread__meta--${t.status}`}>
                  {STATUS_TEXT[t.status] ?? t.status} · {ago(t.updatedAt)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="jz-console__chat">
          {talking ? (
            <h2 className="jz-console__title">
              <span className="jz-live-dot" aria-hidden="true" /> Talking with {name}
            </h2>
          ) : (
            api.title && <h2 className="jz-console__title">{api.title}</h2>
          )}
          {talking ? (
            <Transcript
              api={voice.api}
              empty={<VoiceHello voice={voice} name={name} />}
              tail={voice.state.you || voice.state.agent ? <VoiceCaptions voice={voice} /> : null}
              follow={voice.state.you.length + voice.state.agent.length}
            />
          ) : (
          <Transcript api={api} empty={hello} />
          )}
          {talking ? (
            <VoiceBar voice={voice} name={name} />
          ) : (
            <Composer
              api={api}
              disabledReason={disabledReason}
              notice={voice.state.error}
              talk={status?.voice ? { start: startTalk, unavailable: voiceUnavailable } : null}
            />
          )}
        </main>

        <aside className="jz-console__side">
          {api.plan.length > 0 && (
            <section>
              <p className="jz-side__head">Plan</p>
              <ol className="jz-plan">
                {api.plan.map((s, i) => (
                  <li key={i} className={s.done ? "is-done" : ""}>
                    {s.title}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {talking ? (
            <section>
              <p className="jz-side__head">Changes while talking</p>
              {voiceChanges.length === 0 && <p className="jz-muted">None yet.</p>}
              <ul className="jz-changes">
                {voiceChanges.map((c, i) =>
                  c.kind === "change" ? (
                    <li key={i}>
                      <span>{c.action}</span> {c.title}
                    </li>
                  ) : null,
                )}
              </ul>
              {voiceChanges.length > 0 && <p className="jz-muted">Each can be undone when the conversation ends.</p>}
            </section>
          ) : (
            <section>
              <p className="jz-side__head">Changes in this conversation</p>
              {api.changes.length === 0 && <p className="jz-muted">None yet.</p>}
              <ul className="jz-changes">
                {api.changes.map((c, i) => (
                  <li key={i} className={c.undone ? "is-undone" : ""}>
                    <span>{c.action === "update" ? "changed" : c.action}</span> {c.title}
                  </li>
                ))}
              </ul>
              {live.length > 0 && (
                <button
                  type="button"
                  className="jz-btn jz-btn--ghost"
                  disabled={api.busy}
                  onClick={async () => {
                    if (!window.confirm(`Undo all ${live.length} changes from this conversation?`)) return;
                    setUndoResult(await api.undo());
                  }}
                >
                  Undo all {live.length}
                </button>
              )}
              {undoResult && <p className="jz-muted">{undoResult.join(" · ")}</p>}
            </section>
          )}
          {status?.briefing && (
            <section>
              <p className="jz-side__head">Latest briefing</p>
              <div className="jz-briefing">
                <strong>{status.briefing.title}</strong>
                <Markdown text={status.briefing.body} />
              </div>
            </section>
          )}
          {status && (
            <section>
              <p className="jz-side__head">Today</p>
              <p className="jz-muted">
                {status.usage.runs} of {status.limits.runs} tasks · {Math.round(status.usage.tokens / 1000)}k of{" "}
                {Math.round(status.limits.tokens / 1000)}k tokens
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export function modeText(mode: string) {
  return (
    {
      ask: "asks before every change",
      drafts: "drafts freely, asks before going live",
      trusted: "publishes on its own",
      full: "full autonomy",
    }[mode] ?? mode
  );
}
