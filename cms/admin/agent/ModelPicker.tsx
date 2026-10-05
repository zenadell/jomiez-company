"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import { useMemo, useState } from "react";

type Model = { id: string; label?: string };

/*
 * "Choose from your account" under a model box: asks the provider which models
 * this key can use right now and lets you pick one, so names are never guessed
 * or out of date. Uses the key typed on this screen, or the saved one.
 */
export function ModelPicker({ path, purpose = "text" }: { path?: string; purpose?: "text" | "voice" | "vision" | "image" }) {
  const { value, setValue } = useField<string>({ path });
  // In a Your providers row, the row's own provider, key and address; for the main Model
  // box, the row for the provider chosen above (the saved key is looked up on the server).
  const prefix = path?.includes(".") ? path.slice(0, path.lastIndexOf(".") + 1) : "";
  const form = useFormFields(([fields]) => {
    const str = (key: string) => fields[key]?.value as string | undefined;
    let row = prefix;
    if (!row) {
      const provider = str("provider");
      const match = Object.keys(fields).find((k) => /^providers\.\d+\.provider$/.test(k) && fields[k]?.value === provider);
      row = match ? match.slice(0, -"provider".length) : "";
    }
    return {
      provider: str(`${prefix}provider`),
      baseURL: row ? str(`${row}baseURL`) : undefined,
      apiKey: row ? str(`${row}apiKey`) : undefined,
      voiceApiKey: str("voiceApiKey"),
    };
  });
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const onGemini = purpose !== "text";
  const typedKey = onGemini ? form.voiceApiKey : form.apiKey;

  const load = async () => {
    setOpen(true);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/models", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose,
          provider: onGemini ? "google" : form.provider,
          baseURL: form.baseURL,
          apiKey: typeof typedKey === "string" && typedKey !== "__clear__" ? typedKey : undefined,
        }),
      });
      const out = await res.json();
      if (!res.ok || out.error) throw new Error(out.error || `The provider answered ${res.status}.`);
      setModels(out.models);
    } catch (err) {
      setError((err as Error).message);
      setModels(null);
    }
    setBusy(false);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (models ?? []).filter((m) => !q || `${m.id} ${m.label ?? ""}`.toLowerCase().includes(q));
  }, [models, query]);

  return (
    <div className="jz-picker">
      <button type="button" className="jz-picker__button" onClick={() => (open ? setOpen(false) : void load())}>
        {busy ? "Asking the provider…" : "Choose from your account"} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="jz-picker__panel" role="listbox">
          {error ? (
            <p className="jz-picker__empty">{error}</p>
          ) : (
            <>
              <input
                autoFocus
                className="jz-picker__search"
                placeholder={models ? `${models.length} models, search…` : "Loading…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter" && shown[0]) {
                    e.preventDefault();
                    setValue(shown[0].id);
                    setOpen(false);
                  }
                }}
              />
              {models && shown.length === 0 && <p className="jz-picker__empty">Nothing matches.</p>}
              {shown.slice(0, 200).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={m.id === value}
                  className="jz-picker__option"
                  onClick={() => {
                    setValue(m.id);
                    setOpen(false);
                  }}
                >
                  <span>{m.label || m.id}</span>
                  <code>{m.id}</code>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
