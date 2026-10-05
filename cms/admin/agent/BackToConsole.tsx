"use client";

import { useFormFields } from "@payloadcms/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { lastThread } from "./lastThread";

/* At the top of Agent settings: straight back to the conversation you were in. */
export function BackToConsole() {
  const name = useFormFields(([fields]) => fields.name?.value as string | undefined) || "the agent";
  const [thread, setThread] = useState<string | null>(null);
  useEffect(() => {
    // Read after mount: the conversation is remembered in this browser only.
    const id = setTimeout(() => setThread(lastThread()), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="jz-back">
      <Link className="jz-btn jz-btn--ghost" href={thread ? `/admin/agent?thread=${thread}` : "/admin/agent"}>
        ← {thread ? "Back to the conversation" : `Talk to ${name}`}
      </Link>
    </div>
  );
}
