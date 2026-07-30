import { describe, expect, it, beforeEach } from "vitest";
import {
  buildHtmlAccept,
  isExtensionAllowed,
  projectAfterUploadResponse,
  validateClientUploadFilename,
} from "./file-accept";
import {
  ApiError,
  getBearerToken,
  setBearerToken,
} from "../api/client";

describe("file accept helpers", () => {
  const caps = ["mp3", "m4a"] as const;

  it("allows song.MP3 when capabilities list mp3/m4a", () => {
    expect(isExtensionAllowed("song.MP3", caps)).toBe(true);
    expect(isExtensionAllowed("clip.m4a", caps)).toBe(true);
  });

  it("builds HTML accept as .mp3,.m4a", () => {
    expect(buildHtmlAccept(caps)).toBe(".mp3,.m4a");
  });

  it("returns a clear error for invalid extension", () => {
    const result = validateClientUploadFilename("virus.exe", caps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Формат не поддерживается");
      expect(result.message).toContain(".mp3");
      expect(result.message).toContain(".m4a");
    }
  });
});

describe("upload response shape", () => {
  it("uses returned project from { file, project }", () => {
    const project = { id: "p1", status: "READY_TO_RENDER", files: [{}] };
    const file = { id: "f1" };
    expect(projectAfterUploadResponse({ file, project })).toBe(project);
  });

  it("rejects malformed upload payload", () => {
    expect(() =>
      projectAfterUploadResponse({ file: {}, project: null }),
    ).toThrow();
  });
});

describe("bearer token memory only", () => {
  beforeEach(() => {
    setBearerToken(null);
    localStorage.clear();
    sessionStorage.clear();
  });

  it("stores token only in memory module state", () => {
    setBearerToken("secret-jwt");
    expect(getBearerToken()).toBe("secret-jwt");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("clears memory token without touching storage", () => {
    setBearerToken("x");
    setBearerToken(null);
    expect(getBearerToken()).toBeNull();
  });
});

describe("ApiError user-safe message", () => {
  it("exposes safe message to UI", () => {
    const err = new ApiError("FORBIDDEN", "Нужно принять документы");
    expect(err.message).toBe("Нужно принять документы");
    expect(err.code).toBe("FORBIDDEN");
  });
});
