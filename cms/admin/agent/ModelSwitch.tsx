"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AgentStatus } from "./useAgent";

type Model = { id: string; label?: string };

/*
 * The model in the console's header, as a menu: every provider with a key in
 * Agent settings → Your providers, and the models each key can use, read live
 * from the provider. Picking one switches the agent at once; the conversation
 * carries on with the new model.
 */
export function ModelSwitch({ status, onSwitched }: { status: AgentStatus; onSwitched: () => void }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState(status.provider);
  const [models, setModels] = useState<Record<string, Model[] | { error: string }>>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providers = status.providers ?? [];

  useEffect(() => {
    if (!open || models[provider]) return;
    let gone = false;
    void (async () => {
      try {
        const res = await fetch("/api/agent/models", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider }),
        });
        const out = await res.json();
        if (!gone) setModels((m) => ({ ...m, [provider]: !res.ok || out.error ? { error: out.error || `The provider answered ${res.status}.` } : out.models }));
      } catch (err) {
        if (!gone) setModels((m) => ({ ...m, [provider]: { error: (err as Error).message } }));
      }
    })();
    return () => {
      gone = true;
    };
  }, [open, provider, models]);

  const list = models[provider];
  const shown = useMemo(() => {
    if (!Array.isArray(list)) return [];
    const q = query.trim().toLowerCase();
    return list.filter((m) => !q || `${m.id} ${m.label ?? ""}`.toLowerCase().includes(q));
  }, [list, query]);

  const choose = async (model: string) => {
    setSaving(model);
    setError(null);
    try {
      const res = await fetch("/api/agent/switch", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      const out = await res.json();
      if (!res.ok || out.error) throw new Error(out.error || `Couldn't switch (${res.status}).`);
      setOpen(false);
      setQuery("");
      onSwitched();
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(null);
  };

  return (
    <span className="jz-switch">
      <button
        type="button"
        className="jz-switch__button"
        aria-expanded={open}
        title="Switch model"
        onClick={() => {
          setProvider(status.provider);
          setError(null);
          setOpen((o) => !o);
        }}
      >
        {status.model || "Choose a model"} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="jz-picker__panel jz-switch__panel" role="listbox" aria-label="Switch model">
          <div className="jz-switch__providers">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className={p.id === provider ? "is-on" : ""}
                onClick={() => {
                  setProvider(p.id);
                  setQuery("");
                }}
              >
                {p.label.replace(/ \(.*\)$/, "")}
              </button>
            ))}
            <Link className="jz-switch__add" href="/admin/globals/agent">
              + Add a provider
            </Link>
          </div>
          {providers.length === 0 ? (
            <p className="jz-picker__empty">No provider has a key yet. Add one in Agent settings → Model → Your providers.</p>
          ) : !list ? (
            <p className="jz-picker__empty">Asking the provider…</p>
          ) : !Array.isArray(list) ? (
            <p className="jz-picker__empty">{list.error}</p>
          ) : (
            <>
              <input
                autoFocus
                className="jz-picker__search"
                placeholder={`${list.length} models, search…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter" && shown[0]) {
                    e.preventDefault();
                    void choose(shown[0].id);
                  }
                }}
              />
              {shown.length === 0 && <p className="jz-picker__empty">Nothing matches.</p>}
              {shown.slice(0, 200).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  className="jz-picker__option"
                  aria-selected={provider === status.provider && m.id === status.model}
                  disabled={Boolean(saving)}
                  onClick={() => void choose(m.id)}
                >
                  <span>{saving === m.id ? "Switching…" : m.label || m.id}</span>
                  <code>{m.id}</code>
                </button>
              ))}
            </>
          )}
          {error && <p className="jz-picker__empty jz-switch__error">{error}</p>}
        </div>
      )}
    </span>
  );
}
