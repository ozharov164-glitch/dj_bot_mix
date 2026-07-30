import { describe, expect, it } from "vitest";
import { ApiError } from "./client-types";
import { parseApiErrorBody, parseUploadResponse } from "./parsers";

describe("parseApiErrorBody", () => {
  it("parses a valid error body", () => {
    expect(
      parseApiErrorBody({
        error: { code: "FORBIDDEN", message: "Нет доступа", requestId: "r1" },
      }),
    ).toEqual({
      error: { code: "FORBIDDEN", message: "Нет доступа", requestId: "r1" },
    });
  });

  it("returns null for malformed error JSON without throwing", () => {
    expect(parseApiErrorBody(null)).toBeNull();
    expect(parseApiErrorBody({ oops: true })).toBeNull();
    expect(parseApiErrorBody({ error: { code: 1 } })).toBeNull();
  });
});

describe("parseUploadResponse", () => {
  it("rejects malformed success payload with ApiError", () => {
    expect(() => parseUploadResponse({ file: {}, project: null })).toThrow(
      ApiError,
    );
  });
});
