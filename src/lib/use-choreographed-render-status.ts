import { useEffect, useRef, useState } from "react";
import type { RenderJobStatus } from "../api/client";
import { expandRenderPath, MIN_RENDER_PHASE_MS } from "./render-status";

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function useChoreographedRenderStatus(
  actual: RenderJobStatus | null,
): RenderJobStatus | null {
  const [shown, setShown] = useState<RenderJobStatus | null>(actual);
  const enteredAtRef = useRef(nowMs());

  useEffect(() => {
    if (actual == null) {
      if (shown != null) setShown(null);
      return;
    }
    if (shown == null) {
      enteredAtRef.current = nowMs();
      setShown(actual);
      return;
    }
    if (actual === shown) return;

    const steps = expandRenderPath(shown, actual);
    const next = steps[0];
    if (next == null) return;

    const wait =
      actual === "FAILED"
        ? 0
        : Math.max(0, MIN_RENDER_PHASE_MS[shown] - (nowMs() - enteredAtRef.current));

    const advance = () => {
      enteredAtRef.current = nowMs();
      setShown(next);
    };

    if (wait <= 0) {
      advance();
      return;
    }

    const timer = window.setTimeout(advance, wait);
    return () => window.clearTimeout(timer);
  }, [actual, shown]);

  return shown;
}
