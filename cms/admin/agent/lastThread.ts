/* The conversation open in the console, kept in this browser so coming back reopens it. */

const KEY = "jz-agent-console-thread";

export function rememberThread(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the console just opens fresh.
  }
}

export function lastThread(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
