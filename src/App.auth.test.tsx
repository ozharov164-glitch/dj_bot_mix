import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("App auth flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    api.setBearerToken(null);
    vi.mocked(api.authTelegram).mockReset();
    vi.mocked(api.fetchMe).mockReset();
    vi.mocked(api.fetchCapabilities).mockReset();
    vi.mocked(api.fetchCurrentConsent).mockReset();
    delete window.Telegram;
  });

  afterEach(() => {
    delete window.Telegram;
  });

  it("outside Telegram shows error screen and does not call auth", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Только внутри Telegram/i }),
    ).toBeInTheDocument();
    expect(api.authTelegram).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("valid initData starts auth flow and stores token only in memory", async () => {
    window.Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: "query_id=1&user=%7B%7D&auth_date=1&hash=abc",
        colorScheme: "light",
      },
    };

    vi.mocked(api.authTelegram).mockResolvedValue({
      token: "jwt-in-memory-only",
      tokenType: "Bearer",
      expiresIn: 900,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: "u1", username: "ada" },
    });
    vi.mocked(api.fetchMe).mockResolvedValue({
      id: "u1",
      username: "ada",
      policyVersion: "2026-07-30",
      consent: {
        policyVersion: "2026-07-30",
        accepted: false,
        consent: null,
      },
    });
    vi.mocked(api.fetchCapabilities).mockResolvedValue({
      stage: 2,
      limits: {
        maxTracksPerProject: 15,
        maxFileSizeBytes: 150,
        maxProjectSizeBytes: 600,
        maxOutputDurationSeconds: 3600,
        originalRetentionHours: 24,
        allowedInputExtensions: ["mp3", "m4a"],
      },
      effects: ["normalise"],
      transitionStyles: ["safe"],
      outputFormats: ["mp3"],
      policyVersion: "2026-07-30",
      features: { render: false, payments: false },
    });
    vi.mocked(api.fetchCurrentConsent).mockResolvedValue({
      policyVersion: "2026-07-30",
      accepted: false,
      consent: null,
    });

    render(<App />);

    await waitFor(() => {
      expect(api.authTelegram).toHaveBeenCalledTimes(1);
    });
    expect(api.authTelegram).toHaveBeenCalledWith(
      "query_id=1&user=%7B%7D&auth_date=1&hash=abc",
    );
    await screen.findByText(/Согласие перед началом/i);
    expect(api.getBearerToken()).toBe("jwt-in-memory-only");
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});
