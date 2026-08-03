import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { App } from "./App";
import * as api from "./api/client";

vi.mock("./api/client", async () => {
  const actual = await vi.importActual<typeof import("./api/client")>(
    "./api/client",
  );
  return {
    ...actual,
    authTelegram: vi.fn(),
    fetchMe: vi.fn(),
    fetchCapabilities: vi.fn(),
    fetchCurrentConsent: vi.fn(),
    setBearerToken: vi.fn(actual.setBearerToken),
    getBearerToken: actual.getBearerToken,
  };
});

describe("App outside Telegram", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    api.setBearerToken(null);
    vi.mocked(api.authTelegram).mockReset();
    delete window.Telegram;
  });

  afterEach(() => {
    cleanup();
    delete window.Telegram;
  });

  it("shows Outside Telegram screen and does not call authTelegram", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Откройте в Telegram/i }),
    ).toBeInTheDocument();
    expect(api.authTelegram).not.toHaveBeenCalled();
    expect(api.getBearerToken()).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("treats empty initData as outside Telegram without fake login", async () => {
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: "   ",
        colorScheme: "light",
      },
    };

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Откройте в Telegram/i }),
    ).toBeInTheDocument();
    expect(api.authTelegram).not.toHaveBeenCalled();
    expect(api.getBearerToken()).toBeNull();
  });
});
