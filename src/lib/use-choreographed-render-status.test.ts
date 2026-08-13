import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChoreographedRenderStatus } from "./use-choreographed-render-status";
import { MIN_RENDER_PHASE_MS } from "./render-status";

describe("useChoreographedRenderStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("snaps to the first known job status instead of replaying the queue", () => {
    const { result, rerender } = renderHook(
      ({ status }) => useChoreographedRenderStatus(status),
      { initialProps: { status: null as "QUEUED" | "COMPLETED" | null } },
    );
    expect(result.current).toBeNull();
    rerender({ status: "COMPLETED" });
    expect(result.current).toBe("COMPLETED");
  });

  it("plays RUNNING before COMPLETED when the job skips ahead", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ status }) => useChoreographedRenderStatus(status),
      { initialProps: { status: "QUEUED" as const } },
    );
    expect(result.current).toBe("QUEUED");

    rerender({ status: "COMPLETED" });
    expect(result.current).toBe("QUEUED");

    act(() => {
      vi.advanceTimersByTime(MIN_RENDER_PHASE_MS.QUEUED);
    });
    expect(result.current).toBe("RUNNING");

    act(() => {
      vi.advanceTimersByTime(MIN_RENDER_PHASE_MS.RUNNING);
    });
    expect(result.current).toBe("COMPLETED");
  });

  it("jumps to FAILED without draining the processing path", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ status }) => useChoreographedRenderStatus(status),
      { initialProps: { status: "QUEUED" as const } },
    );
    rerender({ status: "FAILED" });
    expect(result.current).toBe("FAILED");
  });
});
