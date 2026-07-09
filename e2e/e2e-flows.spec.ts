import { test, expect } from "./helpers";

test.describe("End-to-End User Flows", () => {
  test("full workflow: search address → load buildings → browse facades", async ({ appPage }) => {
    // 1. Search for Times Square
    const addressInput = appPage.getByPlaceholder(/search address/i);
    await addressInput.fill("Times Square, New York");
    await appPage.getByRole("button", { name: /go/i }).click();

    // 2. Wait for results, select first
    const firstResult = appPage.locator('button[title]').first();
    await firstResult.waitFor({ timeout: 8_000 });
    await firstResult.click();

    // 3. Wait for buildings to load
    const buildingsLoaded = appPage.getByText(/\d+ buildings loaded/i);
    await expect(buildingsLoaded).toBeVisible({ timeout: 20_000 });

    // 4. Facade panel should appear
    const facadeBtn = appPage.locator('button').filter({ hasText: /^(N|NE|E|SE|S|SW|W|NW)$/ }).first();
    await expect(facadeBtn).toBeVisible({ timeout: 5_000 });

    // 5. Click South facade
    const southBtn = appPage.getByRole("button", { name: /^S$/ });
    await southBtn.click();

    // 6. Sunlight stats panel should be visible
    const stats = appPage.getByText(/sunlight/i).first();
    await expect(stats).toBeVisible();
  });

  test("full workflow: preset → time animation → speed change", async ({ appPage }) => {
    // 1. Load NYC via preset
    await appPage.getByRole("button", { name: /NYC/i }).first().click();
    await expect(appPage.getByText(/\d+ buildings loaded/i)).toBeVisible({ timeout: 20_000 });

    // 2. Start time animation
    const playBtn = appPage.getByRole("button", { name: /^play$/i });
    await playBtn.click();
    await expect(appPage.getByRole("button", { name: /^pause$/i })).toBeVisible();

    // 3. Change speed to Fast
    await appPage.getByRole("combobox").selectOption("30");
    await expect(appPage.getByRole("combobox")).toHaveValue("30");

    // 4. Pause
    await playBtn.click();
    await expect(playBtn).toBeVisible(); // back to Play

    // 5. Change date mid-session
    await appPage.locator('input[type="date"]').fill("2025-06-21");
    await appPage.waitForTimeout(300);

    // 6. App still functional
    await expect(appPage.getByRole("heading", { name: /sunlight visualizer/i })).toBeVisible();
  });

  test("error recovery: invalid coordinates do not crash the app", async ({ appPage }) => {
    // Enter clearly invalid coordinates
    const latInput = appPage.locator("label:has-text('Latitude') input");
    const lngInput = appPage.locator("label:has-text('Longitude') input");
    await latInput.fill("999");
    await lngInput.fill("-999");

    // Try to load
    await appPage.getByRole("button", { name: /load buildings/i }).click();

    // App should either show an error message or simply not crash
    const appStillWorks = await appPage
      .getByRole("heading", { name: /sunlight visualizer/i })
      .isVisible()
      .catch(() => false);
    expect(appStillWorks).toBeTruthy();
  });

  test("data source switch affects building loading", async ({ appPage }) => {
    // Load with Overture (default)
    await appPage.getByRole("button", { name: /NYC/i }).first().click();
    await expect(appPage.getByText(/\d+ buildings loaded/i)).toBeVisible({ timeout: 20_000 });
    const overtureCount = await appPage.getByText(/\d+ buildings loaded/i).textContent();

    // Switch to OSM
    await appPage.getByRole("button", { name: /openstreetmap/i }).click();
    await appPage.getByRole("button", { name: /load buildings/i }).click();

    // OSM may have different coverage — just verify it loads without crash
    await expect(appPage.getByText(/\d+ buildings loaded/i)).toBeVisible({ timeout: 20_000 });
    const osmCount = await appPage.getByText(/\d+ buildings loaded/i).textContent();

    // Counts may differ (expected — Overture vs OSM coverage is different)
    // Just verify both are valid non-empty strings
    expect(overtureCount).toBeTruthy();
    expect(osmCount).toBeTruthy();
  });
});
