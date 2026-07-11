import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPreferences,
  savePreferences,
  clearPreferences,
  gardenFilterFromPrefs,
  ONBOARDING_OPTIONS,
} from "../userPreferences";

beforeEach(() => {
  clearPreferences();
});

describe("garden filter preferences", () => {
  it("defaults to home / no benefits / balanced maintenance", () => {
    const prefs = loadPreferences();
    expect(prefs.homeType).toBe("home");
    expect(prefs.benefitGoals).toEqual([]);
    expect(prefs.maintenancePriority).toBe(50);
  });

  it("persists the garden filter fields across reloads", () => {
    savePreferences({
      homeType: "apartment",
      benefitGoals: ["air-purifying", "pollinator"],
      maintenancePriority: 90,
    });
    const prefs = loadPreferences();
    expect(prefs.homeType).toBe("apartment");
    expect(prefs.benefitGoals).toEqual(["air-purifying", "pollinator"]);
    expect(prefs.maintenancePriority).toBe(90);
  });

  it("derives a GardenFilter shaped exactly as scorePlant consumes", () => {
    const prefs = savePreferences({
      homeType: "apartment",
      benefitGoals: ["air-purifying"],
      maintenancePriority: 80,
    });
    expect(gardenFilterFromPrefs(prefs)).toEqual({
      location: "apartment",
      benefits: ["air-purifying"],
      maintenancePriority: 80,
    });
  });

  it("exposes onboarding options under the corrected name", () => {
    expect(ONBOARDING_OPTIONS.location.length).toBeGreaterThan(0);
  });
});
