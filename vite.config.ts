import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function pagesBase(): string {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    return "/dj_bot_mix/";
  }
  return "/";
}

export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
