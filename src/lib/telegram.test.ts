import { afterEach, describe, expect, it, vi } from "vitest";
import { openBotChat, prepareTelegramViewport } from "./telegram";

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

describe("openBotChat", () => {
  afterEach(() => {
    delete window.Telegram;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens t.me via openTelegramLink and closes the Mini App", () => {
    vi.useFakeTimers();
    const openTelegramLink = vi.fn();
    const close = vi.fn();
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        openTelegramLink,
        close,
      },
    };

    openBotChat();

    expect(openTelegramLink).toHaveBeenCalledWith("https://t.me/fadeline_bot");
    expect(close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(close).toHaveBeenCalled();
  });

  it("falls back to location.assign when Telegram link APIs are missing", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };

    openBotChat();

    expect(assign).toHaveBeenCalledWith("https://t.me/fadeline_bot");
  });
});
