import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Sunlight Visualizer app.
 *
 * All UI interactions with the app should go through this class so that:
 *  - Selectors are defined in one place (easy to update when UI changes)
 *  - Complex interaction sequences are encapsulated as methods
 *  - AI agents can discover available actions via type hints
 *
 * Usage:
 *   const page = new SunlightVisualizerPage(await browser.newPage());
 *   await page.goto();
 *   await page.searchAddress("Times Square, NYC");
 *   await page.loadBuildings();
 */
export class SunlightVisualizerPage {
  readonly page: Page;

  // ─── Selectors ───────────────────────────────────────────────────────────

  readonly heading = this.page.getByRole("heading", { name: /sunlight visualizer/i });
  readonly sidebar = this.page.locator('div').first();

  // Address search
  readonly addressInput = this.page.getByPlaceholder(/search address/i);
  readonly searchButton = this.page.getByRole("button", { name: /go/i });

  // Location inputs — flexible selector: placeholder OR label-adjacent input
  readonly latInput = this.page.locator(
    "input[placeholder='Latitude'], label:has-text('Latitude') input, label:has-text('lat') input"
  );
  readonly lngInput = this.page.locator(
    "input[placeholder='Longitude'], label:has-text('Longitude') input, label:has-text('lng') input"
  );
  readonly radiusSlider = this.page.locator('input[type="range"]').first();
  readonly loadBuildingsButton = this.page.getByRole("button", { name: /load buildings/i });

  // Data source toggle
  readonly overtureButton = this.page.getByRole("button", { name: /overture maps/i });
  readonly osmButton = this.page.getByRole("button", { name: /openstreetmap/i });

  // Preset buttons
  readonly presetButtons = this.page.getByRole("button", { name: /NYC|Manhattan|Times Square|Empire State|Chicago|LA|SF|Silicon Valley/i });

  // Date & time
  readonly dateInput = this.page.locator('input[type="date"]');
  readonly timeSlider = this.page.locator('input[type="range"]').nth(1);
  readonly playButton = this.page.getByRole("button", { name: /play|pause/i });
  readonly speedSelect = this.page.getByRole("combobox");

  // 3D canvas (three.js)
  readonly canvas = this.page.locator("canvas");

  // Building info panel
  readonly buildingInfo = this.page.locator('[style*="280"] > div');
  readonly buildingsLoadedLabel = this.page.getByText(/\d+ buildings loaded/i);

  // Facade analysis panel
  // Facade analysis panel — flexible: look for "facade analysis" heading OR facade direction h3
  readonly facadePanel = this.page.locator(
    "text=/facade analysis/i, h3:has-text('N'), h3:has-text('NE'), h3:has-text('E'), h3:has-text('SE'), h3:has-text('S'), h3:has-text('SW'), h3:has-text('W'), h3:has-text('NW')"
  ).first();
  readonly facadeDirectionButtons = this.page.locator('button').filter({ hasText: /^(N|NE|E|SE|S|SW|W|NW)$/ });

  // Sunlight stats panel
  readonly statsPanel = this.page.locator("h3", { hasText: /sunlight/i });

  // Error messages
  readonly errorMessage = this.page.locator('[style*="#dc2626"]');

  // ─── Constructor ─────────────────────────────────────────────────────────

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────

  async goto(path = ""): Promise<void> {
    const base = process.env.BASE_URL ?? "http://localhost:5173/sunlight-visualizer";
    await this.page.goto(`${base}/${path}`);
  }

  // ─── Address Search ─────────────────────────────────────────────────────

  /**
   * Type an address and press Enter (or click Go) to trigger search.
   */
  async searchAddress(query: string): Promise<void> {
    await this.addressInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Wait for search results to appear, then click the first one.
   */
  async selectFirstSearchResult(timeout = 5_000): Promise<void> {
    const firstResult = this.page.locator('button[title]').first();
    await firstResult.waitFor({ timeout });
    await firstResult.click();
  }

  // ─── Location & Buildings ────────────────────────────────────────────────

  /**
   * Set latitude and longitude manually and load buildings.
   */
  async setLocation(lat: number, lng: number): Promise<void> {
    await this.latInput.fill(String(lat));
    await this.lngInput.fill(String(lng));
    await this.loadBuildingsButton.click();
  }

  /**
   * Click a preset city button (e.g. "NYC", "Manhattan", "Times Square").
   */
  async clickPreset(name: string): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(name, "i") }).click();
  }

  /**
   * Wait until at least one building is loaded and visible in the sidebar.
   */
  async waitForBuildingsLoaded(timeout = 15_000): Promise<void> {
    await this.buildingsLoadedLabel.waitFor({ timeout });
  }

  /**
   * Switch data source to Overture Maps or OpenStreetMap.
   */
  async setDataSource(source: "overture" | "osm"): Promise<void> {
    if (source === "overture") {
      await this.overtureButton.click();
    } else {
      await this.osmButton.click();
    }
  }

  // ─── Time Controls ──────────────────────────────────────────────────────

  /**
   * Set the date via the date picker.
   */
  async setDate(year: number, month: number, day: number): Promise<void> {
    // months are 1-indexed in HTML date inputs
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await this.dateInput.fill(dateStr);
  }

  /**
   * Set time by moving the time slider to a given hour and minute.
   * @param hours 0-23
   * @param minutes 0-59
   */
  async setTime(hours: number, minutes: number): Promise<void> {
    const totalMinutes = hours * 60 + minutes;
    await this.timeSlider.fill(String(totalMinutes));
  }

  /**
   * Click Play (or Pause if already playing).
   */
  async togglePlayPause(): Promise<void> {
    await this.playButton.click();
  }

  /**
   * Set animation speed. Valid values: 5 (Slow), 10 (Normal), 30 (Fast), 60 (1hr/tick).
   */
  async setSpeed(value: number): Promise<void> {
    await this.speedSelect.selectOption(String(value));
  }

  // ─── 3D Canvas ───────────────────────────────────────────────────────────

  /**
   * Verify the Three.js canvas is present and visible.
   */
  async expectCanvasVisible(): Promise<void> {
    await expect(this.canvas).toBeVisible();
  }

  // ─── Facade Analysis ─────────────────────────────────────────────────────

  /**
   * Click a facade direction button (N, NE, E, SE, S, SW, W, NW).
   */
  async selectFacadeDirection(direction: string): Promise<void> {
    const btn = this.page.getByRole("button", { name: new RegExp(`^${direction}$`) });
    await btn.click();
  }

  // ─── Assertions ─────────────────────────────────────────────────────────

  async expectAppLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.addressInput).toBeVisible();
    await expect(this.loadBuildingsButton).toBeVisible();
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectFacadePanelVisible(): Promise<void> {
    // The panel contains facade direction buttons
    await expect(this.facadeDirectionButtons.first()).toBeVisible();
  }

  async expectStatsPanelVisible(): Promise<void> {
    await expect(this.statsPanel).toBeVisible();
  }
}
