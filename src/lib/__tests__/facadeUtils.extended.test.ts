import { describe, it, expect } from "vitest";
import {
  computeFacadeExposure,
  extractFacades,
  normalToDirection,
} from "../facadeUtils";
import type { ProjectedBuilding, LatLng } from "../../types";

// ─── normalToDirection boundary cases: all 8 directions ─────────────

describe("normalToDirection - all 8 compass directions", () => {
  // In our coordinate system: +X = east, -Z = north
  // atan2(nx, -nz) gives angle from north, clockwise

  it("(0, -1) => N (pointing north)", () => {
    expect(normalToDirection(0, -1)).toBe("N");
  });

  it("(1, -1) normalized => NE", () => {
    const len = Math.SQRT2;
    expect(normalToDirection(1 / len, -1 / len)).toBe("NE");
  });

  it("(1, 0) => E (pointing east)", () => {
    expect(normalToDirection(1, 0)).toBe("E");
  });

  it("(1, 1) normalized => SE", () => {
    const len = Math.SQRT2;
    expect(normalToDirection(1 / len, 1 / len)).toBe("SE");
  });

  it("(0, 1) => S (pointing south)", () => {
    expect(normalToDirection(0, 1)).toBe("S");
  });

  it("(-1, 1) normalized => SW", () => {
    const len = Math.SQRT2;
    expect(normalToDirection(-1 / len, 1 / len)).toBe("SW");
  });

  it("(-1, 0) => W (pointing west)", () => {
    expect(normalToDirection(-1, 0)).toBe("W");
  });

  it("(-1, -1) normalized => NW", () => {
    const len = Math.SQRT2;
    expect(normalToDirection(-1 / len, -1 / len)).toBe("NW");
  });

  it("handles exact boundary at 22.5 degrees (NE threshold)", () => {
    // Angle exactly at 22.5 degrees from north
    const angle = (22.5 * Math.PI) / 180;
    const nx = Math.sin(angle);
    const nz = -Math.cos(angle);
    expect(normalToDirection(nx, nz)).toBe("NE");
  });

  it("handles angle just below 22.5 degrees (still N)", () => {
    const angle = (22.4 * Math.PI) / 180;
    const nx = Math.sin(angle);
    const nz = -Math.cos(angle);
    expect(normalToDirection(nx, nz)).toBe("N");
  });

  it("handles angle at 337.5 degrees (N threshold from NW side)", () => {
    // 337.5 degrees: boundary between NW and N
    const angle = (337.5 * Math.PI) / 180;
    const nx = Math.sin(angle);
    const nz = -Math.cos(angle);
    expect(normalToDirection(nx, nz)).toBe("N");
  });
});

// ─── computeFacadeExposure ──────────────────────────────────────────

describe("computeFacadeExposure", () => {
  const nyc: LatLng = { lat: 40.748, lng: -73.986 };

  // A simple square building in projected (XZ) meters, CCW winding
  function makeSquareBuilding(): ProjectedBuilding {
    return {
      id: 1,
      footprint: [
        [0, 0],   // NW corner
        [0, 20],  // SW corner
        [20, 20], // SE corner
        [20, 0],  // NE corner
      ],
      height: 15,
    };
  }

  it("south-facing facade gets more sun than north-facing in NYC summer", () => {
    const building = makeSquareBuilding();
    const summerDate = new Date(2024, 5, 21); // June 21
    summerDate.setHours(12, 0, 0, 0);

    const exposures = computeFacadeExposure(building, nyc, summerDate);
    expect(exposures.length).toBeGreaterThan(0);

    const southFacade = exposures.find((f) => f.direction === "S");
    const northFacade = exposures.find((f) => f.direction === "N");

    expect(southFacade).toBeDefined();
    expect(northFacade).toBeDefined();

    // In northern hemisphere summer, south-facing facades get more sun
    expect(southFacade!.sunlightHours).toBeGreaterThan(northFacade!.sunlightHours);
  });

  it("returns empty array for building with empty footprint", () => {
    const building: ProjectedBuilding = {
      id: 99,
      footprint: [],
      height: 10,
    };
    const date = new Date(2024, 5, 21);
    const exposures = computeFacadeExposure(building, nyc, date);
    expect(exposures).toEqual([]);
  });

  it("returns empty array for building with fewer than 3 points", () => {
    const building: ProjectedBuilding = {
      id: 99,
      footprint: [
        [0, 0],
        [10, 0],
      ],
      height: 10,
    };
    const date = new Date(2024, 5, 21);
    const exposures = computeFacadeExposure(building, nyc, date);
    expect(exposures).toEqual([]);
  });

  it("all facades have non-negative sunlightHours", () => {
    const building = makeSquareBuilding();
    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);

    const exposures = computeFacadeExposure(building, nyc, date);
    for (const f of exposures) {
      expect(f.sunlightHours).toBeGreaterThanOrEqual(0);
    }
  });

  it("east and west facades get intermediate exposure", () => {
    const building = makeSquareBuilding();
    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);

    const exposures = computeFacadeExposure(building, nyc, date);

    const eastFacade = exposures.find((f) => f.direction === "E");
    const westFacade = exposures.find((f) => f.direction === "W");

    expect(eastFacade).toBeDefined();
    expect(westFacade).toBeDefined();

    // East and west facades should both get some sun (morning and afternoon respectively)
    expect(eastFacade!.sunlightHours).toBeGreaterThan(0);
    expect(westFacade!.sunlightHours).toBeGreaterThan(0);
  });

  it("produces merged facades with valid directions", () => {
    const building = makeSquareBuilding();
    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);

    const exposures = computeFacadeExposure(building, nyc, date);
    const validDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    for (const f of exposures) {
      expect(validDirections).toContain(f.direction);
    }
  });
});

// ─── mergeFacadesByDirection (tested indirectly via computeFacadeExposure) ──

describe("mergeFacadesByDirection (via extractFacades + computeFacadeExposure)", () => {
  const nyc: LatLng = { lat: 40.748, lng: -73.986 };

  it("merges same-direction facades from an L-shaped building", () => {
    // L-shaped building: has multiple segments that face the same direction
    const lBuilding: ProjectedBuilding = {
      id: 2,
      footprint: [
        [0, 0],
        [0, 20],
        [10, 20],
        [10, 10],
        [20, 10],
        [20, 0],
      ],
      height: 12,
    };

    const rawFacades = extractFacades(lBuilding);
    // L-shape has 6 raw edges
    expect(rawFacades).toHaveLength(6);

    // Some edges face the same direction, so computing exposure should merge them
    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);
    const exposures = computeFacadeExposure(lBuilding, nyc, date);

    // Merged result should have fewer facades than raw edges
    // The L-shape has: 2 W-facing edges, 2 S-facing, 1 E, 1 N
    // After merging: 4 unique directions
    expect(exposures.length).toBeLessThanOrEqual(rawFacades.length);

    // Each direction should appear at most once
    const directions = exposures.map((f) => f.direction);
    const uniqueDirections = new Set(directions);
    expect(uniqueDirections.size).toBe(directions.length);
  });

  it("merged facade length equals sum of individual segment lengths", () => {
    // Rectangle: each direction has exactly 1 edge, nothing to merge
    const rect: ProjectedBuilding = {
      id: 3,
      footprint: [
        [0, 0],
        [0, 10],
        [30, 10],
        [30, 0],
      ],
      height: 10,
    };

    const rawFacades = extractFacades(rect);
    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);
    const exposures = computeFacadeExposure(rect, nyc, date);

    // For a rectangle, each merged facade should match the raw facade length
    for (const exp of exposures) {
      const matchingRaw = rawFacades.filter((f) => f.direction === exp.direction);
      const totalRawLength = matchingRaw.reduce((sum, f) => sum + f.length, 0);
      expect(exp.length).toBeCloseTo(totalRawLength, 5);
    }
  });

  it("merged facades are sorted by compass order", () => {
    const building: ProjectedBuilding = {
      id: 4,
      footprint: [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
      ],
      height: 10,
    };

    const date = new Date(2024, 5, 21);
    date.setHours(12, 0, 0, 0);
    const exposures = computeFacadeExposure(building, nyc, date);

    const compassOrder = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const directionIndices = exposures.map((f) => compassOrder.indexOf(f.direction));

    // Verify sorted order: each index should be >= previous
    for (let i = 1; i < directionIndices.length; i++) {
      expect(directionIndices[i]).toBeGreaterThanOrEqual(directionIndices[i - 1]);
    }
  });
});
