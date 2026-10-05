"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AgentStatus } from "@/cms/admin/agent/useAgent";
import { Sheet } from "./Sheet";
import { ago, isIOS, isStandalone, post, pushSupported, tap, turnOffPush, turnOnPush, type Me, type Notice } from "./lib";

type Model = { id: string; label?: string };

/* Switching the agent's model: every provider with a key, and the models that key can use. */
export function ModelSheet({ open, onClose, status, onSwitched }: { open: boolean; onClose: () => void; status: AgentStatus | null; onSwitched: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Model" tall>
      <ModelPicker status={status} onSwitched={onSwitched} onClose={onClose} />
    </Sheet>
  );
}

/* Mounted each time the sheet opens, so it starts on the model in use. */
function ModelPicker({ status, onSwitched, onClose }: { status: AgentStatus | null; onSwitched: () => void; onClose: () => void }) {
  const [provider, setProvider] = useState(status?.provider ?? "");
  const [models, setModels] = useState<Record<string, Model[] | { error: string }>>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providers = status?.providers ?? [];

  useEffect(() => {
    if (!provider || models[provider]) return;
    let gone = false;
    post<{ models: Model[] }>("/api/agent/models", { provider })
      .then((out) => !gone && setModels((m) => ({ ...m, [provider]: out.models })))
      .catch((err) => !gone && setModels((m) => ({ ...m, [provider]: { error: (err as Error).message } })));
    return () => {
      gone = true;
    };
  }, [provider, models]);

  const list = models[provider];
  const shown = useMemo(() => {
    if (!Array.isArray(list)) return [];
    const q = query.trim().toLowerCase();
    return list.filter((m) => !q || `${m.id} ${m.label ?? ""}`.toLowerCase().includes(q)).slice(0, 150);
  }, [list, query]);

  const choose = async (model: string) => {
    setSaving(model);
    setError(null);
    try {
      await post("/api/agent/switch", { provider, model });
      tap(12);
      onSwitched();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(null);
  };

  if (providers.length === 0) return <p className="ja-muted">No provider has a key yet. Add one in the admin: Agent settings → Your providers.</p>;
  return (
    <>
      <div className="ja-chips" role="tablist">
        {providers.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={p.id === provider} className={p.id === provider ? "is-on" : ""} onClick={() => setProvider(p.id)}>
            {p.label.replace(/ \(.*\)$/, "")}
          </button>
        ))}
      </div>
      {!list ? (
        <p className="ja-muted">
          <span className="ja-spin ja-spin--sm" /> Asking the provider…
        </p>
      ) : !Array.isArray(list) ? (
        <p className="ja-error">{list.error}</p>
      ) : (
        <>
          <input className="ja-search" type="search" placeholder={`Search ${list.length} models`} value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="ja-options">
            {shown.map((m) => {
              const current = provider === status?.provider && m.id === status?.model;
              return (
                <li key={m.id}>
                  <button type="button" className={current ? "is-on" : ""} disabled={Boolean(saving)} onClick={() => void choose(m.id)}>
                    <span>
                      <strong>{saving === m.id ? "Switching…" : m.label || m.id}</strong>
                      {m.label && m.label !== m.id && <code>{m.id}</code>}
                    </span>
                    {current && <span className="ja-check">✓</span>}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="ja-muted">Nothing matches.</li>}
          </ul>
        </>
      )}
      {error && <p className="ja-error">{error}</p>}
    </>
  );
}

/* Account, notifications and the way out. */
export function SettingsSheet({
  open,
  onClose,
  me,
  status,
  onModel,
  onSignOut,
  onPushChanged,
}: {
  open: boolean;
  onClose: () => void;
  me: Me;
  status: AgentStatus | null;
  onModel: () => void;
  onSignOut: () => void;
  onPushChanged: () => void;
}) {
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const supported = pushSupported();
  const needsInstall = isIOS() && !isStandalone();

  const togglePush = async () => {
    setPushBusy(true);
    setPushNote(null);
    try {
      if (me.push.on) {
        await turnOffPush();
      } else {
        const why = await turnOnPush(me.push.key);
        if (why) setPushNote(why);
        else await post("/api/app/test-push").catch(() => {});
      }
      onPushChanged();
    } catch (err) {
      setPushNote((err as Error).message);
    }
    setPushBusy(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings" tall>
      <section className="ja-group">
        <div className="ja-group__row">
          <span className="ja-avatar" aria-hidden="true">
            {(me.user.name || me.user.email).slice(0, 1).toUpperCase()}
          </span>
          <span className="ja-group__main">
            <strong>{me.user.name || "Signed in"}</strong>
            <small>{me.user.email}</small>
          </span>
        </div>
      </section>

      <section className="ja-group">
        <label className="ja-group__row">
          <span className="ja-group__main">
            <strong>Notifications</strong>
            <small>When it needs your approval, or finishes something you left running.</small>
          </span>
          <input type="checkbox" role="switch" className="ja-switch" checked={me.push.on} disabled={pushBusy || (!supported && !needsInstall)} onChange={() => void togglePush()} />
        </label>
        {(pushNote || needsInstall || !supported) && (
          <p className="ja-group__note">
            {pushNote ||
              (needsInstall ? "On iPhone, notifications need the app on your Home Screen: tap Share, then Add to Home Screen, and open it from there." : "This browser can't show notifications.")}
          </p>
        )}
        {me.push.on && (
          <button type="button" className="ja-group__row ja-group__row--link" onClick={() => void post("/api/app/test-push").catch((e) => setPushNote((e as Error).message))}>
            <span className="ja-group__main">
              <strong>Send a test notification</strong>
            </span>
          </button>
        )}
      </section>

      {status?.canConfigure && (
        <section className="ja-group">
          <button type="button" className="ja-group__row ja-group__row--link" onClick={onModel}>
            <span className="ja-group__main">
              <strong>Model</strong>
              <small>{status.model || "Choose one"}</small>
            </span>
            <span className="ja-chevron">›</span>
          </button>
          <Link className="ja-group__row ja-group__row--link" href="/admin/globals/agent">
            <span className="ja-group__main">
              <strong>Agent settings</strong>
              <small>Keys, permissions, voice, routines (opens the admin)</small>
            </span>
            <span className="ja-chevron">↗</span>
          </Link>
        </section>
      )}

      <section className="ja-group">
        <a className="ja-group__row ja-group__row--link" href="/" target="_blank" rel="noopener">
          <span className="ja-group__main">
            <strong>View the site</strong>
          </span>
          <span className="ja-chevron">↗</span>
        </a>
        <Link className="ja-group__row ja-group__row--link" href="/admin">
          <span className="ja-group__main">
            <strong>Open the full admin</strong>
          </span>
          <span className="ja-chevron">↗</span>
        </Link>
      </section>

      <button type="button" className="ja-btn ja-btn--danger-plain ja-btn--block" onClick={onSignOut}>
        Sign out of this phone
      </button>
    </Sheet>
  );
}

/* What it did on its own: routines and new messages. */
export function NoticesSheet({ open, onClose, onOpenThread }: { open: boolean; onClose: () => void; onOpenThread: (id: number) => void }) {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let gone = false;
    void (async () => {
      const res = await fetch("/api/agent/notices", { credentials: "include", cache: "no-store" });
      const list = res.ok ? ((await res.json()).notices as Notice[]) : [];
      if (!gone) setNotices(list);
      await post("/api/agent/seen").catch(() => {});
    })();
    return () => {
      gone = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="What it did on its own" tall>
      {!notices ? (
        <p className="ja-muted">
          <span className="ja-spin ja-spin--sm" />
        </p>
      ) : notices.length === 0 ? (
        <p className="ja-muted">Nothing yet. Routines and new contact messages show up here.</p>
      ) : (
        <ul className="ja-notices">
          {notices.map((n) => {
            const thread = /[?&]thread=(\d+)/.exec(n.link)?.[1];
            return (
              <li key={n.id} className={`is-${n.kind}${n.read ? "" : " is-unread"}`}>
                <button type="button" disabled={!thread} onClick={() => thread && onOpenThread(Number(thread))}>
                  <strong>{n.title}</strong>
                  {n.body && <span>{n.body.split("\n")[0]}</span>}
                  <small>{ago(n.at)}</small>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
