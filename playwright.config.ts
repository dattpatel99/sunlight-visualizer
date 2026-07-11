import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e for the gardening flow. External services (Overpass, Open-Meteo,
 * OpenAI, map tiles) are intercepted per-test via page.route so runs are
 * deterministic and need no API keys or network.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A prebuilt preview server avoids vite-dev's per-request compilation racing
    // the parallel workers (which caused intermittent action timeouts).
    command: "npm run build && npm run preview -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
