"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/*
 * The template's page effect: on internal navigation the old page slides up
 * and out while the new one rises from below (400ms, cubic-bezier(0.27, 0,
 * 0.51, 1)), done with the View Transitions API like Framer does. The
 * keyframes live in globals.css. Browsers without the API, and visitors who
 * prefer reduced motion, get a normal navigation.
 */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const finish = useRef<{ done: () => void; hash: string } | null>(null);

  // The new route has committed: let the transition capture it. (Rendering is paused while a
  // transition waits for its update, so this must resolve directly, not via requestAnimationFrame.)
  useLayoutEffect(() => {
    const pending = finish.current;
    if (!pending) return;
    finish.current = null;
    // Start the new page at the top, unless it's headed for an anchor (SmoothScroll handles those).
    if (!pending.hash) window.scrollTo(0, 0);
    pending.done();
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Handled here, so next/link skips its own navigation.
      e.preventDefault();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const pending = { done: resolve, hash: url.hash };
            finish.current = pending;
            router.push(url.pathname + url.search + url.hash);
            // Never leave the page frozen if the route takes unusually long (resolving twice is harmless).
            window.setTimeout(() => {
              if (finish.current === pending) finish.current = null;
              resolve();
            }, 2500);
          }),
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
