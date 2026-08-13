import type { RenderJobStatus } from "../api/client";

export const RENDER_POLL_BASE_MS = 1_500;
export const RENDER_POLL_MAX_MS = 12_000;

/** Minimum on-screen time before advancing a visual phase. */
export const MIN_RENDER_PHASE_MS: Record<RenderJobStatus, number> = {
  QUEUED: 1_100,
  RUNNING: 1_800,
  COMPLETED: 0,
  FAILED: 0,
};

export const RENDER_MORPH_MS = 760;

const RENDER_PHASE_ORDER: RenderJobStatus[] = [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
];

/** Insert skipped processing phases so the UI never jumps QUEUED → COMPLETED. */
export function expandRenderPath(
  from: RenderJobStatus,
  to: RenderJobStatus,
): RenderJobStatus[] {
  if (from === to) return [];
  if (to === "FAILED" || from === "FAILED" || from === "COMPLETED") {
    return [to];
  }
  const fromi = RENDER_PHASE_ORDER.indexOf(from);
  const toi = RENDER_PHASE_ORDER.indexOf(to);
  if (fromi < 0 || toi < 0 || toi <= fromi) return [to];
  return RENDER_PHASE_ORDER.slice(fromi + 1, toi + 1);
}

export function renderMarkKind(
  status: RenderJobStatus,
): "aurora" | "COMPLETED" | "FAILED" {
  switch (status) {
    case "QUEUED":
    case "RUNNING":
      return "aurora";
    case "COMPLETED":
      return "COMPLETED";
    case "FAILED":
      return "FAILED";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function renderHeroTitle(status: RenderJobStatus): string {
  switch (status) {
    case "QUEUED":
      return "Вы в очереди";
    case "RUNNING":
      return "Собираем файл";
    case "COMPLETED":
      return "Готово";
    case "FAILED":
      return renderStatusTitle(status);
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function nextRenderPollDelayMs(attempt: number): number {
  const exp = Math.max(0, attempt);
  return Math.min(RENDER_POLL_BASE_MS * 2 ** exp, RENDER_POLL_MAX_MS);
}

export function renderStatusTitle(status: RenderJobStatus): string {
  switch (status) {
    case "QUEUED":
      return "В очереди";
    case "RUNNING":
      return "Обрабатывается";
    case "COMPLETED":
      return "Готово";
    case "FAILED":
      return "Ошибка обработки";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function renderStatusDescription(
  status: RenderJobStatus,
  options?: { queuePosition?: number | null; errorMessage?: string | null },
): string {
  switch (status) {
    case "QUEUED": {
      const pos = options?.queuePosition;
      return pos != null && pos > 0
        ? `Ещё ≈ ${pos} перед вами. Можно закрыть приложение — файл придёт в чат.`
        : "Можно закрыть приложение. Готовый файл придёт в чат с ботом.";
    }
    case "RUNNING":
      return "Можно закрыть приложение и подождать. Готовый файл придёт в чат с ботом.";
    case "COMPLETED":
      return "Готово. Файл уже в чате с ботом — откройте вложение.";
    case "FAILED":
      return (
        options?.errorMessage ??
        "Не получилось обработать. Попробуйте другой файл или ещё раз."
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function canEnqueueRender(options: {
  projectType: "SINGLE_EFFECT" | "MIX";
  projectStatus: string;
  renderFeature: boolean;
  mixRenderFeature?: boolean;
}): boolean {
  if (
    options.projectStatus !== "READY_TO_RENDER" &&
    options.projectStatus !== "FAILED"
  ) {
    return false;
  }
  if (options.projectType === "SINGLE_EFFECT") {
    return options.renderFeature;
  }
  if (options.projectType === "MIX") {
    return options.mixRenderFeature === true;
  }
  return false;
}

/** @deprecated Prefer canEnqueueRender */
export function canEnqueueSingleEffectRender(options: {
  projectType: "SINGLE_EFFECT" | "MIX";
  projectStatus: string;
  renderFeature: boolean;
}): boolean {
  return canEnqueueRender({
    ...options,
    mixRenderFeature: false,
  });
}
