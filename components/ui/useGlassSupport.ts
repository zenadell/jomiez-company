"use client";

import { useSyncExternalStore } from "react";

/*
 * Where liquid glass may run.
 *
 * Glass re-runs an SVG filter each time its layer is drawn: effortless on a GPU,
 * a slideshow on a software-rendered browser (VMs, remote desktops, blocklisted
 * drivers). WebGL's major-performance-caveat flag is the browser's own word on
 * which one it is, so glass only mounts where it will run smoothly; every glass
 * surface keeps a plain frosted look for everyone else.
 */
let gpu: boolean | null = null;

function probeGpu(): boolean {
  if (gpu !== null) return gpu;
  try {
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
      gpu = false;
      return gpu;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    gpu = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    gpu = false;
  }
  return gpu;
}

/*
 * Bending the LIVE page (backdrop-filter: url(#svg-filter)) ships in Chromium
 * only (Chrome, Edge, Brave, Arc, Opera). Safari and Firefox parse it but drop
 * the whole backdrop-filter, so they get the frosted fallback. Chromium exposes
 * navigator.userAgentData; every iOS browser is WebKit and has none.
 */
let blink: boolean | null = null;

function probeBlink(): boolean {
  if (blink !== null) return blink;
  const nav = navigator as Navigator & { userAgentData?: unknown };
  const ua = nav.userAgent;
  blink =
    nav.userAgentData != null ||
    (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b|iPhone|iPad|iPod/.test(ua));
  return blink;
}

const never = () => () => {};

function media(query: string) {
  const subscribe = (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
  const get = () => window.matchMedia(query).matches;
  return { subscribe, get };
}

const finePointer = media("(hover: hover) and (pointer: fine)");
const reducedMotion = media("(prefers-reduced-motion: reduce)");

/** Glass that bends a copy of pixels we own (the hero photo): any browser with a GPU. */
export function useGlassSupport(): boolean {
  return useSyncExternalStore(never, probeGpu, () => false);
}

/** Glass that bends the live page behind it: Chromium with a GPU. */
export function useLiveGlass(): boolean {
  return useSyncExternalStore(never, () => probeBlink() && probeGpu(), () => false);
}

/** The cursor lens: live glass, a mouse or trackpad, and motion allowed. */
export function useCursorLens(): boolean {
  const live = useLiveGlass();
  const fine = useSyncExternalStore(finePointer.subscribe, finePointer.get, () => false);
  const reduce = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);
  return live && fine && !reduce;
}
