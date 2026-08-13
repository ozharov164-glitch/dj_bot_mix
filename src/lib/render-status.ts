import type { RenderJobStatus } from "../api/client";

export const RENDER_POLL_BASE_MS = 1_500;
export const RENDER_POLL_MAX_MS = 12_000;

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
