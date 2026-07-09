import { test, expect } from "./helpers";

test.describe("App Load & Structure", () => {
  test("app loads without crashing", async ({ appPage }) => {
    await expect(appPage.getByRole("heading", { name: /sunlight visualizer/i })).toBeVisible();
  });

  test("sidebar renders all control sections", async ({ appPage }) => {
    // Address search section
    await expect(appPage.getByPlaceholder(/search address/i)).toBeVisible();
    await expect(appPage.getByRole("button", { name: /go/i })).toBeVisible();

    // Location section
    await expect(appPage.getByText(/latitude/i)).toBeVisible();
    await expect(appPage.getByText(/longitude/i)).toBeVisible();
    await expect(appPage.getByRole("button", { name: /load buildings/i })).toBeVisible();

    // Date & Time section
    await expect(appPage.getByText(/date & time/i)).toBeVisible();
    await expect(appPage.getByText(/time:/i)).toBeVisible();

    // Preset buttons visible
    const presets = appPage.getByRole("button", { name: /NYC|Manhattan/i });
    await expect(presets.first()).toBeVisible();
  });

  test("3D canvas is present and visible", async ({ appPage }) => {
    const canvas = appPage.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("data source toggle shows both options", async ({ appPage }) => {
    await expect(appPage.getByRole("button", { name: /overture maps/i })).toBeVisible();
    await expect(appPage.getByRole("button", { name: /openstreetmap/i })).toBeVisible();
  });

  test("no console errors on load", async ({ appPage }) => {
    const errors: string[] = [];
    appPage.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    await appPage.reload();
    await appPage.waitForLoadState("networkidle");
    // Filter out known non-critical errors (e.g. favicon, third-party)
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("net::ERR")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
