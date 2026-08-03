import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function pagesBase(): string {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  return process.env.GITHUB_ACTIONS === "true" && repository
    ? `/${repository}/`
    : "/";
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
