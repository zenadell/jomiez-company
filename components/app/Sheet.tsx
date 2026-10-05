"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import type { ReactNode } from "react";

/*
 * An iOS-style sheet: it springs up from the bottom over a dimmed screen, and
 * goes away with a tap outside or a flick down on its handle or header. (The
 * phone's back gesture closes it too: the app handles that, see JomiezApp.)
 */

const SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

export function Sheet({ open, onClose, title, children, tall = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; tall?: boolean }) {
  const drag = useDragControls();

  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="ja-sheet-layer">
          <motion.button
            type="button"
            aria-label="Close"
            className="ja-sheet-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`ja-sheet${tall ? " is-tall" : ""}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={end}
          >
            <div className="ja-sheet__grab" onPointerDown={(e) => drag.start(e)}>
              <span className="ja-sheet__handle" />
              {title && <div className="ja-sheet__title">{title}</div>}
            </div>
            <div className="ja-sheet__body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
