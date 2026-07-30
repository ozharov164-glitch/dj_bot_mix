import { describe, expect, it } from "vitest";
import {
  ApiUrlConfigError,
  assertProductionApiUrl,
  isDeployableProductionApiUrl,
  resolveApiBaseUrl,
} from "./api-url";

describe("assertProductionApiUrl", () => {
  it("accepts a real https origin", () => {
    expect(assertProductionApiUrl("https://api.mixflow.app/v1")).toBe(
      "https://api.mixflow.app",
    );
  });

  it("rejects missing value", () => {
    expect(() => assertProductionApiUrl(undefined)).toThrow(ApiUrlConfigError);
    expect(() => assertProductionApiUrl("")).toThrow(ApiUrlConfigError);
  });

  it("rejects http", () => {
    expect(() => assertProductionApiUrl("http://api.example.org")).toThrow(
      /https/,
    );
  });

  it("rejects localhost", () => {
    expect(() => assertProductionApiUrl("https://localhost:3000")).toThrow(
      /localhost/,
    );
    expect(() => assertProductionApiUrl("https://127.0.0.1")).toThrow(
      /localhost/,
    );
  });

  it("rejects example.com placeholders", () => {
    expect(() =>
      assertProductionApiUrl("https://api.mixflow.example.com"),
    ).toThrow(/example/);
    expect(() => assertProductionApiUrl("https://example.org")).toThrow(
      /example/,
    );
    expect(() => assertProductionApiUrl("https://foo.example.net")).toThrow(
      /example/,
    );
  });

  it("rejects malformed URL", () => {
    expect(() => assertProductionApiUrl("not-a-url")).toThrow(/valid/);
  });
});

describe("resolveApiBaseUrl", () => {
  it("falls back to localhost in development", () => {
    expect(
      resolveApiBaseUrl({ raw: undefined, mode: "development" }),
    ).toBe("http://localhost:3000");
  });

  it("allows localhost in production only with allowDevApi", () => {
    expect(
      resolveApiBaseUrl({
        raw: "http://localhost:3000",
        mode: "production",
        allowDevApi: true,
      }),
    ).toBe("http://localhost:3000");

    expect(() =>
      resolveApiBaseUrl({
        raw: "http://localhost:3000",
        mode: "production",
        allowDevApi: false,
      }),
    ).toThrow(ApiUrlConfigError);
  });

  it("isDeployableProductionApiUrl mirrors assert", () => {
    expect(isDeployableProductionApiUrl("https://api.mixflow.app")).toBe(true);
    expect(
      isDeployableProductionApiUrl("https://api.mixflow.example.com"),
    ).toBe(false);
  });
});
