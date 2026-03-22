import { describe, it, expect } from "vitest";
import { lngToX, latToZ, projectBuilding, projectBuildings } from "../projection";
import type { BuildingData, LatLng } from "../../types";

const METERS_PER_DEGREE = 111320;

describe("lngToX", () => {
  it("returns 0 for the center longitude", () => {
    expect(lngToX(10, 10, 45)).toBe(0);
  });

  it("returns positive value for a longitude east of center", () => {
    const result = lngToX(11, 10, 0);
    expect(result).toBeGreaterThan(0);
  });

  it("returns negative value for a longitude west of center", () => {
    const result = lngToX(9, 10, 0);
    expect(result).toBeLessThan(0);
  });

  it("applies cosine correction based on latitude", () => {
    const atEquator = lngToX(11, 10, 0);
    const at60 = lngToX(11, 10, 60);
    // cos(60deg) = 0.5, so result at lat 60 should be half the equator result
    expect(at60).toBeCloseTo(atEquator * 0.5, 0);
  });

  it("at the equator the cosine factor is 1", () => {
    const result = lngToX(11, 10, 0);
    expect(result).toBeCloseTo(1 * METERS_PER_DEGREE, 0);
  });

  it("produces smaller displacement at higher latitudes", () => {
    const at30 = lngToX(11, 10, 30);
    const at60 = lngToX(11, 10, 60);
    expect(Math.abs(at30)).toBeGreaterThan(Math.abs(at60));
  });

  it("at the pole the displacement approaches zero", () => {
    const at90 = lngToX(11, 10, 90);
    expect(Math.abs(at90)).toBeLessThan(0.01);
  });
});

describe("latToZ", () => {
  it("returns 0 for the center latitude", () => {
    expect(latToZ(45, 45)).toBeCloseTo(0);
  });

  it("returns negative Z for a latitude north of center (north = -Z)", () => {
    const result = latToZ(46, 45);
    expect(result).toBeLessThan(0);
  });

  it("returns positive Z for a latitude south of center", () => {
    const result = latToZ(44, 45);
    expect(result).toBeGreaterThan(0);
  });

  it("scales by METERS_PER_DEGREE", () => {
    const result = latToZ(46, 45);
    expect(result).toBeCloseTo(-METERS_PER_DEGREE, 0);
  });
});

describe("projectBuilding", () => {
  it("correctly projects footprint coordinates", () => {
    const center: LatLng = { lat: 40.0, lng: -74.0 };
    const building: BuildingData = {
      id: 1,
      height: 20,
      footprint: [
        [-74.0, 40.0],
        [-73.999, 40.001],
        [-74.001, 40.001],
      ],
    };

    const projected = projectBuilding(building, center);

    expect(projected.id).toBe(1);
    expect(projected.height).toBe(20);
    expect(projected.footprint).toHaveLength(3);

    // Center point should project to (0, 0)
    expect(projected.footprint[0][0]).toBeCloseTo(0, 3);
    expect(projected.footprint[0][1]).toBeCloseTo(0, 3);

    // East longitude => positive X
    expect(projected.footprint[1][0]).toBeGreaterThan(0);
    // North latitude => negative Z
    expect(projected.footprint[1][1]).toBeLessThan(0);
  });

  it("preserves building id and height", () => {
    const center: LatLng = { lat: 0, lng: 0 };
    const building: BuildingData = {
      id: 42,
      height: 99,
      footprint: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    };

    const projected = projectBuilding(building, center);
    expect(projected.id).toBe(42);
    expect(projected.height).toBe(99);
  });
});

describe("projectBuildings", () => {
  it("maps all buildings in the input array", () => {
    const center: LatLng = { lat: 40.0, lng: -74.0 };
    const buildings: BuildingData[] = [
      {
        id: 1,
        height: 10,
        footprint: [
          [-74.0, 40.0],
          [-73.999, 40.0],
          [-73.999, 40.001],
        ],
      },
      {
        id: 2,
        height: 20,
        footprint: [
          [-74.001, 40.001],
          [-74.0, 40.001],
          [-74.0, 40.002],
        ],
      },
      {
        id: 3,
        height: 30,
        footprint: [
          [-74.002, 40.002],
          [-74.001, 40.002],
          [-74.001, 40.003],
        ],
      },
    ];

    const projected = projectBuildings(buildings, center);
    expect(projected).toHaveLength(3);
    expect(projected[0].id).toBe(1);
    expect(projected[1].id).toBe(2);
    expect(projected[2].id).toBe(3);
  });

  it("returns empty array for empty input", () => {
    const center: LatLng = { lat: 0, lng: 0 };
    const projected = projectBuildings([], center);
    expect(projected).toEqual([]);
  });
});
