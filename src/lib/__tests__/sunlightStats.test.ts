import { describe, it, expect } from "vitest";
import { computeSunlightStats } from "../sunlightStats";
import type { FacadeExposure } from "../facadeUtils";
import type { LatLng } from "../../types";

function makeFacadeExposure(overrides: Partial<FacadeExposure> & { direction: string; sunlightHours: number }): FacadeExposure {
  return {
    start: [0, 0],
    end: [10, 0],
    midpoint: [5, 0],
    normal: [0, -1],
    length: 10,
    ...overrides,
  };
}

describe("computeSunlightStats", () => {
  const nyc: LatLng = { lat: 40.748, lng: -73.986 };

  describe("with empty facades", () => {
    it("returns null for bestFacade and worstFacade", () => {
      const date = new Date(2024, 5, 21); // June 21
      const stats = computeSunlightStats(nyc, date, []);
      expect(stats.bestFacade).toBeNull();
      expect(stats.worstFacade).toBeNull();
    });

    it("returns avgExposure of 0", () => {
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, []);
      expect(stats.avgExposure).toBe(0);
    });

    it("returns totalFacades of 0", () => {
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, []);
      expect(stats.totalFacades).toBe(0);
    });
  });

  describe("with facades", () => {
    it("finds the best facade (most sunlight hours)", () => {
      const facades: FacadeExposure[] = [
        makeFacadeExposure({ direction: "N", sunlightHours: 2 }),
        makeFacadeExposure({ direction: "S", sunlightHours: 8 }),
        makeFacadeExposure({ direction: "E", sunlightHours: 5 }),
      ];
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, facades);
      expect(stats.bestFacade).toEqual({ direction: "S", hours: 8 });
    });

    it("finds the worst facade (least sunlight hours)", () => {
      const facades: FacadeExposure[] = [
        makeFacadeExposure({ direction: "N", sunlightHours: 2 }),
        makeFacadeExposure({ direction: "S", sunlightHours: 8 }),
        makeFacadeExposure({ direction: "E", sunlightHours: 5 }),
      ];
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, facades);
      expect(stats.worstFacade).toEqual({ direction: "N", hours: 2 });
    });

    it("computes average exposure correctly", () => {
      const facades: FacadeExposure[] = [
        makeFacadeExposure({ direction: "N", sunlightHours: 2 }),
        makeFacadeExposure({ direction: "S", sunlightHours: 8 }),
        makeFacadeExposure({ direction: "E", sunlightHours: 5 }),
      ];
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, facades);
      expect(stats.avgExposure).toBeCloseTo(5, 5);
    });

    it("returns correct totalFacades count", () => {
      const facades: FacadeExposure[] = [
        makeFacadeExposure({ direction: "N", sunlightHours: 2 }),
        makeFacadeExposure({ direction: "S", sunlightHours: 8 }),
      ];
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, facades);
      expect(stats.totalFacades).toBe(2);
    });

    it("handles single facade correctly", () => {
      const facades: FacadeExposure[] = [
        makeFacadeExposure({ direction: "W", sunlightHours: 6 }),
      ];
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, facades);
      expect(stats.bestFacade).toEqual({ direction: "W", hours: 6 });
      expect(stats.worstFacade).toEqual({ direction: "W", hours: 6 });
      expect(stats.avgExposure).toBe(6);
    });
  });

  describe("sunrise/sunset format", () => {
    it("returns HH:MM formatted strings for sunrise and sunset", () => {
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, []);
      // Should match HH:MM format
      expect(stats.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(stats.sunset).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("NYC summer solstice", () => {
    it("produces valid sunrise and sunset times", () => {
      const date = new Date(2024, 5, 21); // June 21
      const stats = computeSunlightStats(nyc, date, []);
      expect(stats.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(stats.sunset).toMatch(/^\d{2}:\d{2}$/);
      // sunrise shouldn't be "--:--"
      expect(stats.sunrise).not.toBe("--:--");
      expect(stats.sunset).not.toBe("--:--");
    });

    it("has approximately 15 hours of daylight", () => {
      const date = new Date(2024, 5, 21);
      const stats = computeSunlightStats(nyc, date, []);
      // NYC summer solstice daylight is approximately 15 hours (14.5-15.5 range)
      expect(stats.daylightHours).toBeGreaterThan(14);
      expect(stats.daylightHours).toBeLessThan(16);
    });
  });

  describe("NYC winter solstice", () => {
    it("has approximately 9 hours of daylight", () => {
      const date = new Date(2024, 11, 21); // December 21
      const stats = computeSunlightStats(nyc, date, []);
      // NYC winter solstice daylight is approximately 9 hours (8.5-10 range)
      expect(stats.daylightHours).toBeGreaterThan(8.5);
      expect(stats.daylightHours).toBeLessThan(10);
    });
  });
});
