import { defineConfig } from "@playwright/test";

const STORAGE_STATE = "playwright/.clerk/user.json";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
});
