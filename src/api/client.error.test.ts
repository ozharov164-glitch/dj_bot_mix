import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchMe, setBearerToken } from "./client";

describe("api client error handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setBearerToken(null);
  });

  it("malformed error JSON does not cause a secondary exception", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("{not-json", {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(fetchMe()).rejects.toMatchObject({
      name: "ApiError",
      code: "UNKNOWN",
      message: "Произошла ошибка",
    });
    await expect(fetchMe()).rejects.toBeInstanceOf(ApiError);
  });

  it("malformed error object body becomes safe ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ weird: true }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(fetchMe()).rejects.toMatchObject({
      code: "UNKNOWN",
      message: "Произошла ошибка",
    });
  });
});
