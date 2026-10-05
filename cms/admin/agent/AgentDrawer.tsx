"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Composer, Transcript } from "./Chat";
import { useAgentStatus, useThread } from "./useAgent";
import { VoiceBar, VoiceCaptions, VoiceHello } from "./Voice";
import { useVoice } from "./useVoice";

/*
 * The agent on every admin screen: a button in the corner opens a panel that
 * knows which page you're editing ("tighten this headline" means this one).
 * When it changes the page you're looking at, the page reloads to show it
 * (during a voice conversation, a button offers the reload instead, so the
 * conversation isn't cut off).
 */

const HIDDEN = /^\/admin\/(agent|login|logout|create-first-user|forgot|reset|verify)(\/|$)/;
const STORE = "jz-agent-drawer-thread";

function pageContext(pathname: string) {
  if (!/^\/admin\/(globals|collections)\//.test(pathname)) return null;
  const title = document.title
    .replace(/\s*[·|-]\s*Jomiez admin\s*$/i, "")
    .replace(/\s*-\s*Payload\s*$/i, "")
    .replace(/^(Editing|Creating)\s*[-–—:]\s*/i, "")
    .trim();
  return { path: pathname, title: title || undefined };
}

function Panel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname() ?? "";
  const { status } = useAgentStatus(60_000);
  const touched = useRef(new Set<string>());
  const api = useThread({
    onChange: (e) => touched.current.add(e.admin),
    onDone: () => {
      const here = window.location.pathname;
      if (touched.current.has(here)) {
        touched.current.clear();
        // Show the agent's change on the screen that's open.
        window.setTimeout(() => window.location.reload(), 900);
      }
      touched.current.clear();
    },
  });
  const [context, setContext] = useState<{ path: string; title?: string } | null>(null);
  const [voiceTouched, setVoiceTouched] = useState<string[]>([]);
  const voice = useVoice({ onChange: (e) => setVoiceTouched((t) => (t.includes(e.admin) ? t : [...t, e.admin])) });
  const talking = voice.active;

  // When the voice conversation ends, keep its transcript here (and show any change it made to this page).
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
      if (voiceTouched.includes(window.location.pathname)) window.setTimeout(() => window.location.reload(), 900);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking, voice.state.threadId]);

  useEffect(() => {
    const t = window.setTimeout(() => setContext(pageContext(pathname)), 300);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE);
      if (saved) void api.load(saved);
    } catch {
      // Private mode: start fresh.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (api.threadId) sessionStorage.setItem(STORE, api.threadId);
    } catch {
      // Private mode: nothing to keep.
    }
  }, [api.threadId]);

  const disabledReason = status && !status.ready ? status.setup || "The agent is switched off." : null;
  const voiceUnavailable = !status ? "…" : !status.enabled ? "The agent is switched off." : status.voice?.ready ? null : status.voice?.setup || "Voice isn't set up.";
  const name = status?.name ?? "Agent";
  const changedHere = talking && voiceTouched.includes(pathname);

  return (
    <aside className="jz-drawer" aria-label={`${status?.name ?? "Agent"}`}>
      <header className="jz-drawer__head">
        <span className={`jz-orb${api.busy || voice.state.phase === "working" ? " is-working" : ""}`} aria-hidden="true" />
        <div className="jz-drawer__who">
          <strong>{status?.name ?? "Agent"}</strong>
          <span>{talking ? "Live voice conversation" : context?.title ? `Here: ${context.title}` : "Ask for anything on the site"}</span>
        </div>
        <button
          type="button"
          className="jz-icon-btn"
          title="New conversation"
          disabled={talking}
          onClick={() => {
            api.reset();
            try {
              sessionStorage.removeItem(STORE);
            } catch {
              // ignore
            }
          }}
        >
          +
        </button>
        <Link className="jz-icon-btn" title="Open in the console" href={api.threadId ? `/admin/agent?thread=${api.threadId}` : "/admin/agent"}>
          ⤢
        </Link>
        <button type="button" className="jz-icon-btn" title="Close" onClick={onClose}>
          ×
        </button>
      </header>
      {changedHere && (
        <button type="button" className="jz-reload" onClick={() => window.location.reload()}>
          {name} changed this page. Reload to see it (ends the conversation).
        </button>
      )}
      {talking ? (
        <Transcript
          api={voice.api}
          empty={<VoiceHello voice={voice} name={name} />}
          tail={voice.state.you || voice.state.agent ? <VoiceCaptions voice={voice} /> : null}
          follow={voice.state.you.length + voice.state.agent.length}
        />
      ) : (
        <Transcript
          api={api}
          empty={
            <div className="jz-drawer__hello">
              <p>
                {context?.title
                  ? `Ask about “${context.title}”: rewrite a section, add something, check it, publish it.`
                  : "Ask it to change anything on the site, write something, check the site or sort the inbox."}
              </p>
              {context?.title && (
                <div className="jz-suggest jz-suggest--small">
                  {["Tighten the wording on this page", "Check this page for problems", "What would make this page better?"].map((s) => (
                    <button key={s} type="button" disabled={Boolean(disabledReason)} onClick={() => void api.send(s, context)}>
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />
      )}
      {talking ? (
        <VoiceBar voice={voice} name={name} />
      ) : (
        <Composer
          api={api}
          context={context}
          disabledReason={disabledReason}
          placeholder="What should it do?"
          notice={voice.state.error}
          talk={
            status?.voice
              ? {
                  start: () => {
                    setVoiceTouched([]);
                    voice.clearError();
                    void voice.start(context);
                  },
                  unavailable: voiceUnavailable,
                }
              : null
          }
        />
      )}
    </aside>
  );
}

export function AgentDrawer({ children }: { children?: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const hidden = HIDDEN.test(pathname) || !pathname.startsWith("/admin");
  return (
    <>
      {children}
      {!hidden && !open && (
        <button type="button" className="jz-fab" onClick={() => setOpen(true)} aria-label="Ask the agent">
          <span className="jz-orb" aria-hidden="true" />
        </button>
      )}
      {!hidden && open && <Panel onClose={() => setOpen(false)} />}
    </>
  );
}
