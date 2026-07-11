import { test, expect, type Page } from "@playwright/test";

/**
 * Deterministic fixtures. A geocoded address resolves near the NYC default,
 * and a single building sits at that spot (mocked Overpass). Weather / LLM /
 * map tiles are cut so the flow is offline and needs no keys.
 */
const GEOCODE_FIXTURE = [
  { lat: "40.748", lon: "-73.986", display_name: "Empire State Building, NYC" },
];

const OVERPASS_FIXTURE = {
  elements: [
    { type: "way", id: 101, nodes: [1, 2, 3, 4, 1], tags: { building: "yes", "building:levels": "6" } },
    { type: "node", id: 1, lat: 40.748, lon: -73.986 },
    { type: "node", id: 2, lat: 40.748, lon: -73.9856 },
    { type: "node", id: 3, lat: 40.7483, lon: -73.9856 },
    { type: "node", id: 4, lat: 40.7483, lon: -73.986 },
  ],
};

async function stubExternalServices(page: Page) {
  await page.route("**/nominatim.openstreetmap.org/**", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(GEOCODE_FIXTURE) })
  );
  await page.route("**/overpass-api.de/**", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(OVERPASS_FIXTURE) })
  );
  await page.route("**/api.open-meteo.com/**", (route) => route.abort());
  await page.route("**/api.openai.com/**", (route) => route.abort());
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("**/*.tile.openstreetmap.org/**", (route) => route.abort());
}

/** Flows 1–3: find + select an address, pick the building and a wall, open the garden. */
async function reachGardenForFacade(page: Page) {
  // 1. Find an address and select it → buildings load, Buildings & Sun panel opens.
  await page.getByPlaceholder("Search address...").fill("Empire State Building");
  await page.getByRole("button", { name: "Go" }).click();
  await page.getByText("Empire State Building, NYC").click();

  // 2. See buildings → pick one → its facades become selectable.
  await page.getByTestId("building-item-101").click();
  await page.locator('[data-testid^="facade-row-"]').first().click();

  // 3. Open the garden drawer.
  await page.getByTestId("rail-garden").click();
  await expect(page.getByTestId("garden-drawer")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  // ?debug exposes the building list so we can pick a building without a flaky
  // WebGL raycast click (real users pick the building in the 3D view).
  await page.goto("/?debug");
});

test("panels are hidden by default; the shell shows the rail and address bar", async ({ page }) => {
  await expect(page.getByTestId("rail-garden")).toBeVisible();
  await expect(page.getByPlaceholder("Search address...")).toBeVisible();
  // Buildings & Sun panel is not open on load.
  await expect(page.getByText("Load Buildings")).toHaveCount(0);
});

test("flow: address → building → facade → garden shows ranked plants", async ({ page }) => {
  await reachGardenForFacade(page);
  await expect(page.locator('[data-testid^="plant-card-"]').first()).toBeVisible();
});

test("flow: filters are hard — the list shows only matching plants", async ({ page }) => {
  await reachGardenForFacade(page);
  const drawer = page.getByTestId("garden-drawer");

  // Apartment → only indoor-suitable plants remain.
  await drawer.getByRole("button", { name: /Apartment/ }).click();
  await expect(page.getByTestId("plant-card-snake-plant-01")).toBeVisible();
  await expect(page.getByTestId("plant-card-sunflower-01")).toHaveCount(0); // outdoor-only: excluded
});

test("flow: an impossible filter combo shows a clean no-matches state", async ({ page }) => {
  await reachGardenForFacade(page);
  const drawer = page.getByTestId("garden-drawer");

  await drawer.getByRole("button", { name: /Apartment/ }).click();
  // Cut-flower lives under the "More filters" expander.
  await drawer.getByRole("button", { name: /More filters/i }).click();
  await drawer.getByRole("button", { name: /Cut-flower/ }).click(); // no indoor cut-flowers exist
  await expect(page.getByTestId("garden-no-matches")).toBeVisible();
  await expect(page.locator('[data-testid^="plant-card-"]')).toHaveCount(0);
});

test("fern: no API key surfaces the setup path in rule-based mode", async ({ page }) => {
  await page.getByTestId("fern-nub").click();
  await expect(page.getByTestId("fern-panel")).toBeVisible();

  await page.getByLabel("Ask Fern").fill("what can I grow?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(/OpenAI API key/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Add your API key/i })).toBeVisible();
});
