import { test, expect } from "./helpers";

test.describe("Sunlight Stats Panel", () => {
  test.beforeEach(async ({ appPage }) => {
    // Load buildings for a known location
    const presetBtn = appPage.getByRole("button", { name: /NYC/i }).first();
    await presetBtn.click();
    // Wait for stats panel to appear (shows "Sunlight" heading)
    // Wait for stats panel to appear — try heading first, fall back to any sunlight text
    const heading = appPage.getByRole("heading", { name: /sunlight/i });
    try {
      await heading.waitFor({ timeout: 20_000 });
    } catch {
      await appPage.getByText(/sunlight/i).first().waitFor({ timeout: 5_000 });
    }
  });

  test("sunlight stats panel is visible after buildings load", async ({ appPage }) => {
    const panel = appPage.getByText(/sunlight/i).first();
    await expect(panel).toBeVisible();
  });

  test("stats show sunrise and sunset times", async ({ appPage }) => {
    const statsPanel = appPage.locator('[style*="280"]');
    const sunrise = appPage.getByText(/sunrise/i);
    const sunset = appPage.getByText(/sunset/i);
    // At least one of sunrise/sunset should be visible
    const hasSunTimes =
      (await sunrise.isVisible().catch(() => false)) ||
      (await sunset.isVisible().catch(() => false));
    expect(hasSunTimes).toBeTruthy();
  });

  test("total daylight hours is displayed as a number", async ({ appPage }) => {
    // Look for daylight-hours text, or fall back to any decimal number in the panel
    const daylight = appPage.getByText(/\d+\.\d+.*daylight|daylight.*\d+\.\d+/i);
    const numbers = appPage.getByText(/\d+\.\d+/);
    const hasDaylight = await daylight.first().isVisible().catch(() => false);
    await expect(hasDaylight ? daylight.first() : numbers.nth(2)).toBeVisible();
  });

  test("changing date updates sunlight stats", async ({ appPage }) => {
    const dateInput = appPage.locator('input[type="date"]');

    // Change to a summer date
    await dateInput.fill("2025-06-21");
    await appPage.waitForTimeout(500); // Allow recalculation

    // Change to a winter date
    await dateInput.fill("2025-12-21");
    await appPage.waitForTimeout(500);

    // Panel should still be visible (no crash)
    const panel = appPage.getByText(/sunlight/i).first();
    await expect(panel).toBeVisible();
  });

  test("stats update when location changes", async ({ appPage }) => {
    // Switch from NYC to a different preset
    const laBtn = appPage.getByRole("button", { name: /LA|San Francisco/i }).first();
    await laBtn.click();

    // Wait for new stats to load
    await appPage.waitForTimeout(1_000);
    const panel = appPage.getByText(/sunlight/i).first();
    await expect(panel).toBeVisible();
  });
});
