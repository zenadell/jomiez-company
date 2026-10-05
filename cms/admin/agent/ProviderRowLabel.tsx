"use client";

import { useRowLabel } from "@payloadcms/ui";
import { PROVIDERS, type ProviderId } from "@/cms/agent/provider-list";

/* Names each row in Your providers after its provider, with whether a key is saved. */
export function ProviderRowLabel() {
  const { data } = useRowLabel<{ provider?: ProviderId; apiKeyHint?: string | null }>();
  const label = (data?.provider && PROVIDERS[data.provider]?.label) || "New provider";
  return (
    <span>
      {label}
      {data?.apiKeyHint ? <span className="jz-rowhint"> · key {data.apiKeyHint}</span> : null}
    </span>
  );
}
