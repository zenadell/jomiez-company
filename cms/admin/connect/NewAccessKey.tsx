"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/*
 * Above the Access keys list: make a key for another agent. The key is shown
 * here once, with what to paste into Claude Code, another MCP client or a
 * script; after that only its first characters are kept.
 */

const SCOPES = [
  { value: "read", label: "See", hint: "conversations, what Keeper did, leads, settings (never keys or passwords)" },
  { value: "chat", label: "Talk", hint: "give Keeper tasks and continue conversations; its approval rules still apply" },
  { value: "approve", label: "Approve", hint: "answer Keeper's approval requests (only for agents you fully trust)" },
  { value: "control", label: "Control", hint: "stop or undo work, switch the model, turn Keeper or routines on and off" },
  { value: "runner", label: "Aethron runner", hint: "only for the Aethron runner on your Mac (tick this one alone)" },
];

const EXPIRY = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
  { days: 0, label: "Never" },
];

type Made = { id: number; name: string; token: string; origin: string; scopes: string[] };

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="jz-btn jz-btn--ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

function Snippet({ title, text }: { title: string; text: string }) {
  return (
    <div className="jz-connect__snippet">
      <div className="jz-connect__snippet-head">
        <strong>{title}</strong>
        <Copy text={text} />
      </div>
      <pre>{text}</pre>
    </div>
  );
}

export function NewAccessKey() {
  return (
    <div className="jz-connect-wrap">
      <Panel />
    </div>
  );
}

function Panel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read", "chat"]);
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<Made | null>(null);

  if (made) {
    const mcp = `${made.origin}/api/mcp`;
    return (
      <div className="jz-connect">
        <h3>“{made.name}” can connect now</h3>
        <p className="jz-connect__warn">
          Copy the key now: it won&apos;t be shown again. Anyone who has it can do what you ticked, so keep it out of chats, screenshots and code you share. If it ever leaks, open it below and tick Revoked.
        </p>
        <div className="jz-connect__key">
          <code>{made.token}</code>
          <Copy text={made.token} label="Copy the key" />
        </div>
        {made.scopes.includes("runner") ? (
          <Snippet
            title="On the Mac with Aethron, in Terminal (leave the window open while Keeper works)"
            text={`curl -fsSL ${made.origin}/api/connect/runner -o aethron-runner.mjs\nJOMIEZ_URL=${made.origin} JOMIEZ_KEY=${made.token} node aethron-runner.mjs`}
          />
        ) : (
          <>
            <Snippet title="Claude Code (run this in a terminal)" text={`claude mcp add --transport http jomiez ${mcp} --header "Authorization: Bearer ${made.token}"`} />
            <Snippet
              title="Other MCP apps (Claude Desktop, Cursor, ChatGPT connectors…): the server's settings"
              text={JSON.stringify({ mcpServers: { jomiez: { type: "http", url: mcp, headers: { Authorization: `Bearer ${made.token}` } } } }, null, 2)}
            />
            <Snippet title="Scripts: the plain web API" text={`curl -H "Authorization: Bearer ${made.token}" ${made.origin}/api/v1/status`} />
          </>
        )}
        <button
          type="button"
          className="jz-btn jz-btn--yes"
          onClick={() => {
            setMade(null);
            setOpen(false);
            setName("");
            router.refresh();
          }}
        >
          I&apos;ve copied it
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="jz-open-console">
        <span>Let Claude Code or another agent see what Keeper is doing and give it work.</span>
        <button type="button" className="jz-btn jz-btn--yes" onClick={() => setOpen(true)}>
          Connect an agent
        </button>
      </div>
    );
  }

  return (
    <form
      className="jz-connect"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await fetch("/api/connect/new", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, scopes, days }) });
        const out = (await res.json().catch(() => ({ error: `The server answered ${res.status}.` }))) as Partial<Made> & { error?: string };
        setBusy(false);
        if (!res.ok || !out.token) return setError(out.error || "Couldn't make the key.");
        setMade(out as Made);
      }}
    >
      <h3>Connect an agent</h3>
      <label className="jz-connect__field">
        <span>Who it&apos;s for</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Claude Code on my laptop" maxLength={80} required />
      </label>
      <fieldset className="jz-connect__scopes">
        <legend>What it may do</legend>
        {SCOPES.map((s) => (
          <label key={s.value}>
            <input type="checkbox" checked={scopes.includes(s.value)} onChange={(e) => setScopes(e.target.checked ? [...scopes, s.value] : scopes.filter((x) => x !== s.value))} />
            <span>
              <strong>{s.label}</strong>: {s.hint}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="jz-connect__field">
        <span>Stops working after</span>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {EXPIRY.map((x) => (
            <option key={x.days} value={x.days}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="jz-connect__error">{error}</p>}
      <div className="jz-connect__actions">
        <button type="submit" className="jz-btn jz-btn--yes" disabled={busy || !name.trim() || !scopes.length}>
          {busy ? "Making it…" : "Make the key"}
        </button>
        <button type="button" className="jz-btn jz-btn--ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
