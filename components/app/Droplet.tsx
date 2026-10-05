"use client";

import type { Ref } from "react";
import { LiquidGlass } from "./LiquidGlass";

/*
 * The agent's presence: a drop of liquid glass that magnifies the forest behind
 * it, with a warm light inside that breathes while it waits, quickens while it
 * works and turns amber when it needs you. In a voice conversation the voice
 * engine swells it with whoever is speaking (it sets --jz-level, 0 to 1).
 */
export function Droplet({ size, state = "idle", bind, className = "" }: { size: number; state?: string; bind?: Ref<HTMLSpanElement>; className?: string }) {
  return (
    <LiquidGlass material="drop" className={`ja-drop is-${state} ${className}`} style={{ width: size, height: size }} radius={size / 2}>
      <span className="ja-drop__core" ref={bind} aria-hidden="true" />
    </LiquidGlass>
  );
}
