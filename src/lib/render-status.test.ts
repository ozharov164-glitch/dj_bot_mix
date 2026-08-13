import { describe, expect, it } from "vitest";
import {
  canEnqueueRender,
  canEnqueueSingleEffectRender,
  nextRenderPollDelayMs,
  renderStatusDescription,
  renderStatusTitle,
  RENDER_POLL_BASE_MS,
  RENDER_POLL_MAX_MS,
} from "./render-status";

describe("render-status helpers", () => {
  it("backs off poll delay up to the cap", () => {
    expect(nextRenderPollDelayMs(0)).toBe(RENDER_POLL_BASE_MS);
    expect(nextRenderPollDelayMs(1)).toBe(RENDER_POLL_BASE_MS * 2);
    expect(nextRenderPollDelayMs(10)).toBe(RENDER_POLL_MAX_MS);
  });

  it("exposes safe Russian titles for all job statuses", () => {
    expect(renderStatusTitle("QUEUED")).toContain("очереди");
    expect(renderStatusTitle("RUNNING")).toContain("Обрабатывается");
    expect(renderStatusTitle("COMPLETED")).toBe("Готово");
    expect(renderStatusTitle("FAILED")).toContain("Ошибка");
  });

  it("never embeds download URLs in status copy", () => {
    for (const status of ["QUEUED", "RUNNING", "COMPLETED", "FAILED"] as const) {
      const text = renderStatusDescription(status, {
        queuePosition: 2,
        errorMessage: "Не удалось обработать аудио",
      });
      expect(text).not.toMatch(/https?:\/\/|\/v1\/downloads|token=/i);
    }
    expect(renderStatusDescription("COMPLETED")).toMatch(/в чате с ботом/i);
    expect(renderStatusDescription("COMPLETED")).not.toMatch(/Скачивание/i);
    expect(renderStatusDescription("QUEUED")).not.toMatch(/^Вы в очереди/);
    expect(renderStatusDescription("QUEUED")).toMatch(/чат/);
    expect(renderStatusDescription("RUNNING")).toMatch(/закрыть приложение/i);
    expect(renderStatusDescription("RUNNING")).toMatch(/чат с ботом/i);
  });

  it("allows enqueue for SINGLE_EFFECT and MIX when features on", () => {
    expect(
      canEnqueueRender({
        projectType: "SINGLE_EFFECT",
        projectStatus: "READY_TO_RENDER",
        renderFeature: true,
      }),
    ).toBe(true);
    expect(
      canEnqueueRender({
        projectType: "MIX",
        projectStatus: "READY_TO_RENDER",
        renderFeature: true,
        mixRenderFeature: true,
      }),
    ).toBe(true);
    expect(
      canEnqueueRender({
        projectType: "MIX",
        projectStatus: "READY_TO_RENDER",
        renderFeature: true,
        mixRenderFeature: false,
      }),
    ).toBe(false);
    expect(
      canEnqueueSingleEffectRender({
        projectType: "MIX",
        projectStatus: "READY_TO_RENDER",
        renderFeature: true,
      }),
    ).toBe(false);
  });
});
