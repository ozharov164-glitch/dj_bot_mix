import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareTelegramViewport } from "./telegram";

describe("prepareTelegramViewport", () => {
  afterEach(() => {
    delete window.Telegram;
  });

  it("expands and paints chrome but does not request fullscreen", () => {
    const ready = vi.fn();
    const expand = vi.fn();
    const requestFullscreen = vi.fn();
    const setHeaderColor = vi.fn();
    const setBackgroundColor = vi.fn();
    const disableVerticalSwipes = vi.fn();

    window.Telegram = {
      WebApp: {
        ready,
        expand,
        requestFullscreen,
        setHeaderColor,
        setBackgroundColor,
        disableVerticalSwipes,
        initData: "x",
      },
    };

    prepareTelegramViewport();

    expect(ready).toHaveBeenCalled();
    expect(expand).toHaveBeenCalled();
    expect(setHeaderColor).toHaveBeenCalledWith("#07090C");
    expect(setBackgroundColor).toHaveBeenCalledWith("#07090C");
    expect(disableVerticalSwipes).toHaveBeenCalled();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});
