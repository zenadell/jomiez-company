"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import type { AgentStatus, ThreadApi } from "@/cms/admin/agent/useAgent";
import { tap } from "./lib";
import { AppTranscript } from "./Transcript";

/*
 * One conversation's content (its glass controls and the message box float
 * above, in JomiezApp). A new one opens on a few things to ask for.
 */

const SUGGESTIONS = [
  { icon: "✦", title: "Check the whole site", text: "Audit the whole site (SEO, image descriptions, broken links, placeholder text) and fix what you safely can as drafts. Then list what needs my decision." },
  { icon: "✎", title: "Write a journal post", text: "Write a journal post in the site's voice about something we've built recently. Save it as a draft with a search title and description." },
  { icon: "✉", title: "Sort the inbox", text: "Go through the inbox: mark spam, summarise each real message in its notes, and draft replies for the promising leads." },
  { icon: "◐", title: "How does the home page look?", text: "Take a phone-sized screenshot of the home page, look at it and tell me what you'd improve." },
];

export function ChatContent({ api, status }: { api: ThreadApi; status: AgentStatus | null }) {
  const name = status?.name ?? "Keeper";
  const disabled = Boolean(status && !status.ready);

  // Opened while it's still working (from a notification, or after the phone slept): follow along.
  useEffect(() => {
    if (api.state !== "running" || api.busy || !api.threadId) return;
    const id = api.threadId;
    const t = setInterval(() => void api.load(id), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.state, api.busy, api.threadId]);

  const hello = (
    <div className="ja-hello">
      <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
        What shall we grow today?
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.04 }}>
        {name} can change anything on jomiez.com, look after the inbox and research the web. It asks before anything you haven&apos;t allowed.
      </motion.p>
      <div className="ja-suggest">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            className="ja-platter"
            disabled={disabled}
            initial={{ y: 60, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.06 + 0.05 * i }}
            onClick={() => {
              tap();
              void api.send(s.text);
            }}
          >
            <span className="ja-suggest__icon" aria-hidden="true">
              {s.icon}
            </span>
            <span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ja-scroll">
      <AppTranscript key={api.threadId ?? "new"} api={api} empty={hello} />
    </div>
  );
}
