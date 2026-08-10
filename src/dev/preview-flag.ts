/**
 * DEV-only Cursor design preview flag (`?preview=1`).
 * Kept separate from the preview store to avoid circular imports with api/client.
 */
export function isLocalCursorPreview(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("preview") === "1";
  } catch {
    return false;
  }
}

/** Hold mock render on RUNNING so design review can inspect the hero animation. */
export function isPreviewHoldRender(): boolean {
  if (!isLocalCursorPreview()) return false;
  try {
    return new URLSearchParams(window.location.search).get("holdRender") === "1";
  } catch {
    return false;
  }
}
