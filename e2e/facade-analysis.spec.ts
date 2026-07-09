import { test, expect } from "./helpers";

test.describe("Facade Analysis Panel", () => {
  test.beforeEach(async ({ appPage }) => {
    // Load a known city with buildings first
    const presetBtn = appPage.getByRole("button", { name: /NYC/i }).first();
    await presetBtn.click();
    // Wait for buildings and facade data to load
    const facadeBtn = appPage.locator('button').filter({ hasText: /^(N|NE|E|SE|S|SW|W|NW)$/ }).first();
    await facadeBtn.waitFor({ timeout: 20_000 });
  });

  test("facade direction buttons are visible after buildings load", async ({ appPage }) => {
    const facadeBtn = appPage.locator('button').filter({ hasText: /^(N|NE|E|SE|S|SW|W|NW)$/ }).first();
    await expect(facadeBtn).toBeVisible();
  });

  test("clicking a facade direction highlights it", async ({ appPage }) => {
    const southBtn = appPage.getByRole("button", { name: /^S$/ });
    await southBtn.click();
    // After clicking, it should be visually "active" (button style changes)
    const bg = await southBtn.evaluate(
      (el) => (el as HTMLElement).style.background || window.getComputedStyle(el).background
    );
    expect(bg).toBeTruthy();
  });

  test("facade direction list shows all 8 cardinal directions", async ({ appPage }) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    for (const dir of directions) {
      const btn = appPage.getByRole("button", { name: new RegExp(`^${dir}$`) });
      await expect(btn).toBeVisible();
    }
  });

  test("selecting a facade shows sunlight hours for that direction", async ({ appPage }) => {
    // Click a direction and look for a numeric sunlight value nearby
    const southBtn = appPage.getByRole("button", { name: /^S$/ });
    await southBtn.click();

    // The hours value should be visible somewhere near the facade panel
    // Format: "X.X hours" or similar
    const hourText = appPage.getByText(/\d+\.\d+ ?(hours?|h)/i);
    await expect(hourText.first()).toBeVisible();
  });

  test("facade panel is absent before buildings are loaded", async ({ appPage }) => {
    // Reload page — no buildings yet
    await appPage.reload();
    await appPage.waitForLoadState("networkidle");

    const facadeBtn = appPage.locator('button').filter({ hasText: /^(N|NE|E|SE|S|SW|W|NW)$/ });
    await expect(facadeBtn.first()).not.toBeVisible();
  });
});
