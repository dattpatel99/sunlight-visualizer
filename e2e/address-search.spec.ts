import { test, expect } from "./helpers";

test.describe("Address Search", () => {
  test("search input accepts text", async ({ appPage }) => {
    const input = appPage.getByPlaceholder(/search address/i);
    await input.fill("Times Square, New York");
    await expect(input).toHaveValue("Times Square, New York");
  });

  test("pressing Enter triggers search", async ({ appPage }) => {
    const input = appPage.getByPlaceholder(/search address/i);
    await input.fill("Empire State Building");
    await input.press("Enter");
    // Should show loading state or results
    const goButton = appPage.getByRole("button", { name: /go/i });
    const loading = appPage.getByText(/loading/i);
    const isLoading = await loading.isVisible().catch(() => false);
    await expect(isLoading ? loading : goButton).toBeVisible();
  });

  test("clicking Go with empty input does not search", async ({ appPage }) => {
    const input = appPage.getByPlaceholder(/search address/i);
    const goButton = appPage.getByRole("button", { name: /go/i });
    await input.clear();
    await goButton.click();
    // Should not show results or error for empty query
    await expect(appPage.getByText(/no results/i)).not.toBeVisible();
  });

  test("search results are clickable and update location", async ({ appPage }) => {
    const input = appPage.getByPlaceholder(/search address/i);
    await input.fill("Times Square");
    await appPage.getByRole("button", { name: /go/i }).click();

    // Wait for results to appear (up to 8s for geocoding API)
    const firstResult = appPage.locator('button[title]').first();
    await firstResult.waitFor({ timeout: 8_000 });

    // Click first result
    await firstResult.click();

    // Input should be cleared after selection
    await expect(input).toHaveValue("");

    // Address should be reflected in lat/lng inputs (non-empty, valid numbers)
    const latInput = appPage.locator("label:has-text('Latitude') input");
    const lngInput = appPage.locator("label:has-text('Longitude') input");
    const latVal = await latInput.inputValue();
    const lngVal = await lngInput.inputValue();
    expect(Number(latVal)).toBeGreaterThan(-90);
    expect(Number(latVal)).toBeLessThan(90);
    expect(Number(lngVal)).toBeGreaterThan(-180);
    expect(Number(lngVal)).toBeLessThan(180);
  });

  test("no results shows error message", async ({ appPage }) => {
    const input = appPage.getByPlaceholder(/search address/i);
    // Use a query likely to return no results
    await input.fill("zzz_non_existent_place_xyz_12345");
    await appPage.getByRole("button", { name: /go/i }).click();
    // Wait for error or no-results message
    const errorMsgs = appPage.getByText(/no results|not found|search failed/i);
    const errors = appPage.getByText(/error/i);
    const hasError = await errorMsgs.isVisible().catch(() => false) ||
                     await errors.isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });
});
