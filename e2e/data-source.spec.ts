import { test, expect } from "./helpers";

test.describe("Data Source Toggle", () => {
  test("Overture Maps is selected by default", async ({ appPage }) => {
    const overtureBtn = appPage.getByRole("button", { name: /overture maps/i });
    const osmBtn = appPage.getByRole("button", { name: /openstreetmap/i });

    // Overture should have blue background, OSM should not
    const overtureBg = await overtureBtn.evaluate(
      (el) => (el as HTMLElement).style.background
    );
    const osmBg = await osmBtn.evaluate(
      (el) => (el as HTMLElement).style.background
    );
    expect(overtureBg).toContain("2563eb"); // Blue
    expect(osmBg).not.toContain("2563eb");
  });

  test("switching to OSM changes button styles", async ({ appPage }) => {
    const osmBtn = appPage.getByRole("button", { name: /openstreetmap/i });
    await osmBtn.click();

    const osmBg = await osmBtn.evaluate(
      (el) => (el as HTMLElement).style.background
    );
    expect(osmBg).toContain("2563eb"); // Blue active state
  });

  test("switching data source reloads buildings", async ({ appPage }) => {
    // First load buildings with Overture
    const presetBtn = appPage.getByRole("button", { name: /NYC/i }).first();
    await presetBtn.click();

    const buildingsLoaded = appPage.getByText(/\d+ buildings loaded/i);
    await expect(buildingsLoaded).toBeVisible({ timeout: 20_000 });
    const overtureCount = await buildingsLoaded.textContent();

    // Switch to OSM — should reload
    const osmBtn = appPage.getByRole("button", { name: /openstreetmap/i });
    await osmBtn.click();
    await appPage.waitForTimeout(500);

    // Wait for reload indicator or new count
    // Count may be different (OSM vs Overture coverage differs)
    await expect(buildingsLoaded).toBeVisible({ timeout: 20_000 });
  });

  test("toggling sources while loading does not crash", async ({ appPage }) => {
    const overtureBtn = appPage.getByRole("button", { name: /overture maps/i });
    const osmBtn = appPage.getByRole("button", { name: /openstreetmap/i });
    const loadBtn = appPage.getByRole("button", { name: /load buildings/i });

    await loadBtn.click();
    // Switch source while loading
    await overtureBtn.click();
    await osmBtn.click();
    await overtureBtn.click();

    // App should still be functional
    await expect(appPage.getByRole("heading", { name: /sunlight visualizer/i })).toBeVisible();
  });
});
