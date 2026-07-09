import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the Sunlight Visualizer E2E test suite.
 *
 * In CI (GitHub Actions):
 *   - BASE_URL is injected by the workflow
 *   - The web server is started by the workflow step before tests run
 *   - Chromium is installed via `npx playwright install --with-deps`
 *
 * Locally:
 *   - `npm run test:e2e` starts the dev server automatically via webServer
 *   - `npm run test:e2e:headed` opens the browser visually for debugging
 *   - `npm run test:e2e:ui` opens the Playwright UI mode
 */
export default defineConfig({
  testDir: "./e2e",

  // Run tests in parallel locally; sequential in CI to avoid port conflicts
  fullyParallel: !process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Fail the build if a test is accidentally left with test.only
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI
    ? [["github"], ["list"]]
    : [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    // BASE_URL is set by the GitHub Actions workflow; locally falls back to dev server URL
    baseURL: process.env.BASE_URL ?? "http://localhost:5173/sunlight-visualizer",

    // Retry flakiness only on CI; trace & video for first retry failure
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Ignore favicon and external resource errors
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Local dev only: the workflow handles server startup in CI
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173/sunlight-visualizer",
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
