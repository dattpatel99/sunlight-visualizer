import { test, expect } from "./helpers";

test.describe("Time Controls", () => {
  test("date input shows a formatted date", async ({ appPage }) => {
    const dateInput = appPage.locator('input[type="date"]');
    const value = await dateInput.inputValue();
    // Should be YYYY-MM-DD format
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("changing date updates the input value", async ({ appPage }) => {
    const dateInput = appPage.locator('input[type="date"]');
    await dateInput.fill("2025-12-25");
    await expect(dateInput).toHaveValue("2025-12-25");
  });

  test("time slider label shows formatted time", async ({ appPage }) => {
    // The second range input is the time slider
    const timeSlider = appPage.locator('input[type="range"]').nth(1);
    const timeLabel = appPage.getByText(/time: \d{2}:\d{2}/i);

    await expect(timeLabel).toBeVisible();

    // Default time should be 12:00 (set in getDefaultDate)
    await expect(timeLabel).toContainText("12:00");
  });

  test("moving time slider updates displayed time", async ({ appPage }) => {
    const timeSlider = appPage.locator('input[type="range"]').nth(1);
    const timeLabel = appPage.getByText(/time: \d{2}:\d{2}/i);

    // Set slider to 16:45 (1005 minutes)
    await timeSlider.fill("1005");
    await expect(timeLabel).toContainText("16:45");
  });

  test("Play button starts animation and shows Pause", async ({ appPage }) => {
    const playBtn = appPage.getByRole("button", { name: /^play$/i });
    await playBtn.click();
    // After clicking, should show Pause
    await expect(appPage.getByRole("button", { name: /^pause$/i })).toBeVisible();
  });

  test("Pause button stops animation", async ({ appPage }) => {
    const playBtn = appPage.getByRole("button", { name: /^play$/i });
    await playBtn.click(); // Start
    await playBtn.click(); // Stop → back to Play
    await expect(playBtn).toBeVisible();
  });

  test("speed selector has all expected options", async ({ appPage }) => {
    const speedSelect = appPage.getByRole("combobox");
    await speedSelect.selectOption("5");
    const opts = await speedSelect.locator("option").allTextContents();
    expect(opts).toContain("Slow");
    expect(opts).toContain("Normal");
    expect(opts).toContain("Fast");
    expect(opts).toContain("1hr/tick");
  });

  test("changing speed while playing does not crash", async ({ appPage }) => {
    const playBtn = appPage.getByRole("button", { name: /^play$/i });
    const speedSelect = appPage.getByRole("combobox");

    await playBtn.click(); // Start
    await speedSelect.selectOption("60"); // Switch to fastest
    await speedSelect.selectOption("5");  // Switch back to slowest

    // Still running
    await expect(appPage.getByRole("button", { name: /^pause$/i })).toBeVisible();
  });

  test("time slider pause interaction — slider drag pauses playback", async ({ appPage }) => {
    const playBtn = appPage.getByRole("button", { name: /^play$/i });
    const timeSlider = appPage.locator('input[type="range"]').nth(1);

    await playBtn.click(); // Start
    await timeSlider.fill("500"); // Drag slider → should pause

    // Button should be back to Play
    await expect(playBtn).toBeVisible();
  });
});
