"use client";

import type { Ref } from "react";

/*
 * The agent's presence: an ember that breathes while it waits, swirls while it
 * works and glows when it needs you. In a voice conversation the voice engine
 * moves it with whoever is speaking (it sets --jz-level, 0 to 1).
 */
export function Orb({ state = "idle", size = 40, bind }: { state?: string; size?: number; bind?: Ref<HTMLSpanElement> }) {
  return <span className={`ja-orb is-${state}`} style={{ width: size, height: size }} ref={bind} aria-hidden="true" />;
}
