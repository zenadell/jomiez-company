"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import styles from "./PreviewBar.module.css";

const never = () => () => {};

/** True inside the admin's live-preview pane (an iframe), where the page is being edited. */
export function useInPreviewPane(): boolean {
  return useSyncExternalStore(never, () => window.self !== window.top, () => true);
}

/*
 * Opening the admin's live preview switches this browser into preview mode
 * (drafts instead of the published site), and that sticks for the whole
 * browser. Outside the preview pane, say so plainly and offer the way back.
 */
export function PreviewBar() {
  const inPane = useInPreviewPane();
  const pathname = usePathname();
  if (inPane) return null;
  return (
    <div className={styles.bar} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span>Preview mode: you’re seeing unpublished drafts.</span>
      <a href={`/next/exit-preview?path=${encodeURIComponent(pathname || "/")}`} className={styles.exit} data-reload>
        Show the live site
      </a>
    </div>
  );
}
