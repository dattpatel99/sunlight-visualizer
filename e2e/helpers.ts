import { test as base, type Page, type Browser, type BrowserContext } from "@playwright/test";

/**
 * Custom Playwright test fixtures.
 *
 * Extends Playwright's base `test` with fixtures that:
 * - Open the app at BASE_URL before each test
 * - Take a screenshot on failure for easy debugging
 * - Manage browser state across tests
 *
 * Usage:
 *   import { test } from "./helpers";
 *   test("my test", async ({ appPage }) => { ... });
 */

// Re-export everything from @playwright/test so consumers only import from one place
export { expect, type Locator, type APIResponse } from "@playwright/test";

/**
 * Fixture that provides a SunlightVisualizerPage pre-navigated to the app.
 * Each test gets its own fresh page in a shared browser context.
 */
export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    const baseURL = process.env.BASE_URL ?? "http://localhost:5173/sunlight-visualizer";
    await page.goto(baseURL);
    await page.waitForLoadState("networkidle");
    await use(page);
  },
});

/**
 * Helper: create a new browser context (e.g. for multi-user / isolation tests).
 */
export async function makeContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext();
}

/**
 * Helper: take a named screenshot for debugging.
 */
export async function snapshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `e2e/snapshots/${name}.png`, fullPage: true });
}
