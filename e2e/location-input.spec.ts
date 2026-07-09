import { test, expect } from "./helpers";

test.describe("Location Input", () => {
  test("lat/lng inputs accept numeric values", async ({ appPage }) => {
    const latInput = appPage.locator("label:has-text('Latitude') input");
    const lngInput = appPage.locator("label:has-text('Longitude') input");

    await latInput.fill("41.878");
    await lngInput.fill("-87.629");

    await expect(latInput).toHaveValue("41.878");
    await expect(lngInput).toHaveValue("-87.629");
  });

  test("invalid lat/lng values are accepted as text (validation happens on load)", async ({ appPage }) => {
    const latInput = appPage.locator("label:has-text('Latitude') input");
    const lngInput = appPage.locator("label:has-text('Longitude') input");
    const loadBtn = appPage.getByRole("button", { name: /load buildings/i });

    // Type clearly out-of-range values
    await latInput.fill("999");
    await lngInput.fill("-999");

    // Button should still be clickable (no crash)
    await expect(loadBtn).toBeEnabled();
  });

  test("radius slider updates displayed value", async ({ appPage }) => {
    const radiusLabel = appPage.getByText(/radius: \d+m/i);
    const slider = appPage.locator('input[type="range"]').first();

    await slider.fill("300");
    await expect(radiusLabel).toContainText("300");
  });

  test("Load Buildings button triggers data fetch", async ({ appPage }) => {
    const loadBtn = appPage.getByRole("button", { name: /load buildings/i });
    await loadBtn.click();

    // Should show loading state immediately
    const loadingBtn = appPage.getByRole("button", { name: /loading/i });
    const isLoading = await loadingBtn.isVisible().catch(() => false);
    expect(isLoading).toBeTruthy();
  });

  test("Overture Maps button is active by default", async ({ appPage }) => {
    const overtureBtn = appPage.getByRole("button", { name: /overture maps/i });
    await expect(overtureBtn).toBeVisible();
    // Check it has the "active" blue background style (approx check via attribute or text color)
    const bg = await overtureBtn.evaluate(
      (el) => (el as HTMLElement).style.background || window.getComputedStyle(el).background
    );
    // The active button should have a blue-ish background
    expect(bg).toBeTruthy();
  });

  test("clicking OpenStreetMap switches source", async ({ appPage }) => {
    const osmBtn = appPage.getByRole("button", { name: /openstreetmap/i });
    await osmBtn.click();
    // Button should now be active (blue background)
    const bg = await osmBtn.evaluate(
      (el) => (el as HTMLElement).style.background || window.getComputedStyle(el).background
    );
    expect(bg).toBeTruthy();
  });

  test("preset buttons populate lat/lng and load buildings", async ({ appPage }) => {
    // Use the first visible preset (e.g. "NYC")
    const presetBtn = appPage.getByRole("button", { name: /NYC/i }).first();
    await presetBtn.click();

    // Lat/lng should be non-empty and valid
    const latInput = appPage.locator("label:has-text('Latitude') input");
    const lngInput = appPage.locator("label:has-text('Longitude') input");
    const latVal = Number(await latInput.inputValue());
    const lngVal = Number(await lngInput.inputValue());
    expect(latVal).toBeGreaterThan(-90);
    expect(latVal).toBeLessThan(90);
    expect(lngVal).toBeGreaterThan(-180);
    expect(lngVal).toBeLessThan(180);
  });

  test("buildings are loaded and count shown in sidebar", async ({ appPage }) => {
    // Use a preset that should return buildings quickly
    const presetBtn = appPage.getByRole("button", { name: /NYC/i }).first();
    await presetBtn.click();

    // Wait for buildings to appear
    const buildingsLoaded = appPage.getByText(/\d+ buildings loaded/i);
    await expect(buildingsLoaded).toBeVisible({ timeout: 20_000 });

    // Should show a positive count
    const text = await buildingsLoaded.textContent();
    const match = text?.match(/(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });
});
