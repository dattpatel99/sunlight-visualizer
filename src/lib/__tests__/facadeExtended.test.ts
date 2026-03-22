import { describe, it, expect } from "vitest";
import {
  normalToDirection,
  extractFacades,
  computeFacadeExposure,
} from "../facadeUtils";
import type { ProjectedBuilding } from "../../types";

describe("normalToDirection - all 8 directions", () => {
  const cases: [number, number, string][] = [
    [0, -1, "N"],
    [1 / Math.SQRT2, -1 / Math.SQRT2, "NE"],
    [1, 0, "E"],
    [1 / Math.SQRT2, 1 / Math.SQRT2, "SE"],
    [0, 1, "S"],
    [-1 / Math.SQRT2, 1 / Math.SQRT2, "SW"],
    [-1, 0, "W"],
    [-1 / Math.SQRT2, -1 / Math.SQRT2, "NW"],
  ];

  for (const [nx, nz, expected] of cases) {
    it(`maps (${nx.toFixed(2)}, ${nz.toFixed(2)}) to ${expected}`, () => {
      expect(normalToDirection(nx, nz)).toBe(expected);
    });
  }
});

describe("normalToDirection - boundary angles", () => {
  it("angle just below 22.5deg is N", () => {
    const angle = (22 * Math.PI) / 180;
    expect(normalToDirection(Math.sin(angle), -Math.cos(angle))).toBe("N");
  });

  it("angle just above 22.5deg is NE", () => {
    const angle = (23 * Math.PI) / 180;
    expect(normalToDirection(Math.sin(angle), -Math.cos(angle))).toBe("NE");
  });

  it("angle at 337deg is NW", () => {
    const angle = (337 * Math.PI) / 180;
    expect(normalToDirection(Math.sin(angle), -Math.cos(angle))).toBe("NW");
  });

  it("angle at 338deg is N", () => {
    const angle = (338 * Math.PI) / 180;
    expect(normalToDirection(Math.sin(angle), -Math.cos(angle))).toBe("N");
  });
});

describe("extractFacades - winding order", () => {
  it("handles CW winding order correctly", () => {
    const building: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [20, 0],
        [20, 10],
        [0, 10],
      ],
      height: 10,
    };

    const facades = extractFacades(building);
    expect(facades.length).toBe(4);
    const dirs = new Set(facades.map((f) => f.direction));
    expect(dirs).toEqual(new Set(["N", "E", "S", "W"]));
  });

  it("returns empty array for degenerate footprint (< 3 points)", () => {
    const building: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [10, 0],
      ],
      height: 10,
    };
    expect(extractFacades(building)).toEqual([]);
  });

  it("computes correct facade lengths", () => {
    const building: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [0, 10],
        [20, 10],
        [20, 0],
      ],
      height: 15,
    };

    const facades = extractFacades(building);
    const lengths = facades.map((f) => f.length).sort((a, b) => a - b);
    expect(lengths).toEqual([10, 10, 20, 20]);
  });

  it("computes midpoints correctly", () => {
    const building: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [0, 10],
        [20, 10],
        [20, 0],
      ],
      height: 15,
    };

    const facades = extractFacades(building);
    for (const f of facades) {
      const expectedMid: [number, number] = [
        (f.start[0] + f.end[0]) / 2,
        (f.start[1] + f.end[1]) / 2,
      ];
      expect(f.midpoint[0]).toBeCloseTo(expectedMid[0]);
      expect(f.midpoint[1]).toBeCloseTo(expectedMid[1]);
    }
  });

  it("normals are unit vectors", () => {
    const building: ProjectedBuilding = {
      id: 1,
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

    const facades = extractFacades(building);
    for (const f of facades) {
      const len = Math.sqrt(f.normal[0] ** 2 + f.normal[1] ** 2);
      expect(len).toBeCloseTo(1, 5);
    }
  });
});

describe("computeFacadeExposure", () => {
  const nyc = { lat: 40.748, lng: -73.986 };
  const summerSolstice = new Date(2024, 5, 21, 12, 0, 0);
  const winterSolstice = new Date(2024, 11, 21, 12, 0, 0);

  const rectBuilding: ProjectedBuilding = {
    id: 1,
    footprint: [
      [0, 0],
      [0, 10],
      [20, 10],
      [20, 0],
    ],
    height: 15,
  };

  it("returns empty array for empty footprint", () => {
    const degenerate: ProjectedBuilding = {
      id: 1,
      footprint: [
        [0, 0],
        [1, 0],
      ],
      height: 10,
    };
    expect(computeFacadeExposure(degenerate, nyc, summerSolstice)).toEqual([]);
  });

  it("south facade gets more sun than north in NYC summer", () => {
    const exposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      summerSolstice
    );

    const south = exposures.find((f) => f.direction === "S");
    const north = exposures.find((f) => f.direction === "N");

    expect(south).toBeDefined();
    expect(north).toBeDefined();
    expect(south!.sunlightHours).toBeGreaterThan(north!.sunlightHours);
  });

  it("all exposures are non-negative", () => {
    const exposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      summerSolstice
    );

    for (const e of exposures) {
      expect(e.sunlightHours).toBeGreaterThanOrEqual(0);
    }
  });

  it("summer has more total exposure than winter", () => {
    const summerExposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      summerSolstice
    );
    const winterExposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      winterSolstice
    );

    const summerTotal = summerExposures.reduce(
      (s, f) => s + f.sunlightHours,
      0
    );
    const winterTotal = winterExposures.reduce(
      (s, f) => s + f.sunlightHours,
      0
    );

    expect(summerTotal).toBeGreaterThan(winterTotal);
  });

  it("merges facades by direction (returns 4 for a rectangle)", () => {
    const exposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      summerSolstice
    );

    expect(exposures.length).toBe(4);
    const dirs = new Set(exposures.map((e) => e.direction));
    expect(dirs).toEqual(new Set(["N", "E", "S", "W"]));
  });

  it("facades are sorted by compass order", () => {
    const exposures = computeFacadeExposure(
      rectBuilding,
      nyc,
      summerSolstice
    );

    const order = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const dirs = exposures.map((e) => e.direction);
    const indices = dirs.map((d) => order.indexOf(d));

    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });
});
