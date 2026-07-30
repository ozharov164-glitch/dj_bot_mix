import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolveApiBaseUrl } from "./src/config/api-url";

function pagesBase(): string {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    return "/dj_bot_mix/";
  }
  return "/";
}

export default defineConfig(({ mode }) => {
  const allowDevApi = process.env.VITE_ALLOW_DEV_API === "true";
  // Fail closed for production Pages builds before emitting an artifact.
  const resolved = resolveApiBaseUrl({
    raw: process.env.VITE_API_URL,
    mode,
    allowDevApi,
  });
  // Ensure Vite injects the validated origin (not a placeholder path URL).
  process.env.VITE_API_URL = resolved;

  return {
    base: pagesBase(),
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: "dist",
      // Public Pages must not ship source maps
      sourcemap: false,
    },
  };
});
