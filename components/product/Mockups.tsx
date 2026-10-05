import { Icon } from "@/components/ui/Icon";
import styles from "./Mockups.module.css";

/*
 * The glass UI windows from the template's product cards, redrawn in HTML so
 * they can carry our own words: a window with a stacked shadow sheet under it.
 */
function MockWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.stack} aria-hidden="true">
      <div className={styles.window}>
        <div className={styles.bar}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <Icon name="magnifyingGlass" size={18} />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
      <div className={styles.sheet} />
    </div>
  );
}

/* A task panel working through a list, with a cursor hovering the results. */
export function ResearchMock({ title }: { title: string }) {
  return (
    <MockWindow>
      <div className={styles.research}>
        <div className={styles.task}>
          <p className={styles.taskTitle}>{title}</p>
          <div className={styles.taskRow}>
            <span className={styles.pending} />
            <span className={styles.lines}>
              <i style={{ width: 70 }} />
            </span>
          </div>
          <div className={styles.taskRow}>
            <Icon name="check" size={14} className={styles.tick} />
            <span className={styles.lines}>
              <i style={{ width: 30 }} className={styles.strong} />
              <i style={{ width: 70 }} />
            </span>
          </div>
          <span className={styles.taskButton} />
        </div>
        <div className={styles.results}>
          <div className={styles.result}>
            <span className={styles.lines}>
              <i style={{ width: 30 }} className={styles.strong} />
              <i style={{ width: 50 }} />
              <i style={{ width: 42 }} />
            </span>
            <span className={`${styles.swatch} ${styles.swatchA}`} />
          </div>
          <div className={`${styles.result} ${styles.resultLight}`}>
            <span className={`${styles.swatch} ${styles.swatchB}`} />
            <span className={`${styles.lines} ${styles.linesRight}`}>
              <i style={{ width: 30 }} className={styles.strong} />
              <i style={{ width: 50 }} />
              <i style={{ width: 42 }} />
            </span>
          </div>
          <span className={styles.cursor}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M2 2 18 8.5l-7 2.2L8.6 18 2 2Z" fill="#fff" />
            </svg>
            <span className={styles.you}>You</span>
          </span>
        </div>
      </div>
    </MockWindow>
  );
}

/* A chat composer: the product mark, a reply bubble and the prompt box. */
export function PromptMock({ placeholder }: { placeholder: string }) {
  return (
    <MockWindow>
      <div className={styles.prompt}>
        <div className={styles.promptTop}>
          <span className={styles.avatar}>
            <span className={styles.chaka} />
          </span>
          <span className={styles.bubble} />
        </div>
        <div className={styles.composer}>
          <div className={styles.composerRow}>
            <span className={styles.placeholder}>
              {placeholder}
              <span className={styles.caret} />
            </span>
            <span className={styles.round}>
              <Icon name="paperPlaneTilt" size={14} />
            </span>
          </div>
          <div className={styles.composerRow}>
            <span className={styles.composerLeft}>
              <span className={styles.round}>
                <Icon name="paperPlaneTilt" size={14} />
              </span>
              <span className={styles.tools}>
                <Icon name="slidersHorizontal" size={12} />
                Tools
              </span>
            </span>
            <span className={styles.round}>
              <Icon name="microphone" size={14} />
            </span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}
