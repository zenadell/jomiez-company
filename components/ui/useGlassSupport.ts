"use client";

import { useSyncExternalStore } from "react";

/*
 * Liquid glass re-runs an SVG filter each time its layer is drawn: effortless on a
 * GPU, a slideshow on a software-rendered browser (VMs, remote desktops,
 * blocklisted drivers). WebGL's major-performance-caveat flag is the browser's own
 * word on which one it is, so glass only mounts where it will run smoothly; every
 * glass surface keeps a plain frosted look for everyone else.
 */
let supported: boolean | null = null;

function probe(): boolean {
  if (supported !== null) return supported;
  try {
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
      supported = false;
      return supported;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    supported = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}

const subscribe = () => () => {};

export function useGlassSupport(): boolean {
  return useSyncExternalStore(subscribe, probe, () => false);
}
