import { describe, expect, it } from "vitest";
import clientSrc from "../api/client.ts?raw";
import authSrc from "../auth/AuthProvider.tsx?raw";

describe("storage / auth source guards", () => {
  it("does not write bearer token to localStorage or sessionStorage", () => {
    expect(clientSrc).not.toMatch(/localStorage/);
    expect(clientSrc).not.toMatch(/sessionStorage/);
    expect(authSrc).not.toMatch(/localStorage/);
    expect(authSrc).not.toMatch(/sessionStorage/);
  });

  it("outside-Telegram path does not call authTelegram", () => {
    expect(authSrc).toContain('setStatus("outside")');
    expect(authSrc).toMatch(
      /if \(!initData\)[\s\S]*?setStatus\("outside"\)[\s\S]*?return;/,
    );
  });
});
