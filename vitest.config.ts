import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["**/node_modules/**", "**/e2e/**"],
    env: { NEXT_PUBLIC_API_URL: "http://localhost:4000" },
  },
});
