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

describe("App dark-only shell", () => {
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

  it("never renders shell--light when Telegram reports light colorScheme", async () => {
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: "   ",
        colorScheme: "light",
        setHeaderColor: vi.fn(),
        setBackgroundColor: vi.fn(),
      },
    };

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Только внутри Telegram/i }),
    ).toBeInTheDocument();

    const shell = screen.getByTestId("mixflow-shell");
    expect(shell.className).toContain("shell--dark");
    expect(shell.className).not.toContain("shell--light");
    expect(document.documentElement.innerHTML).not.toMatch(/shell--light/);
  });

  it("keeps shell--dark when Telegram reports dark colorScheme", async () => {
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: "",
        colorScheme: "dark",
      },
    };

    render(<App />);

    const shell = await screen.findByTestId("mixflow-shell");
    expect(shell.className).toContain("shell--dark");
    expect(shell.className).not.toContain("shell--light");
  });
});
