import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "trosc:chunk-reload";

/**
 * Reload the page once when a code-split chunk can't be fetched. After a
 * deploy, a tab that loaded the old index asks for chunk files that no longer
 * exist; a fresh load picks up the new index and its chunks. The timestamp
 * guard stops a reload loop if the chunk is genuinely broken.
 */
export function reloadForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: reload anyway; the browser cache stops a tight loop.
  }
  window.location.reload();
  return true;
}

export function lazyWithReload<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      if (reloadForStaleChunk()) {
        // Keep Suspense showing its fallback while the page reloads.
        return new Promise<{ default: ComponentType<P> }>(() => {});
      }
      throw err;
    }),
  );
}
