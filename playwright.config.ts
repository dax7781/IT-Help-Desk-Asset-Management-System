import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: ".local/browser-results",
  use: {
    baseURL: process.env.SMOKE_URL,
    headless: true,
    trace: "off",
    video: "off",
    screenshot: "off",
  },
});
