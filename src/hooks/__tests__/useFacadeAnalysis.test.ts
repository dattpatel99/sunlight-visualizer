import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFacadeAnalysis } from "../useFacadeAnalysis";
import type { ProjectedBuilding } from "../../types";

describe("useFacadeAnalysis", () => {
  const nyc = { lat: 40.748, lng: -73.986 };
  const summerDate = new Date(2024, 5, 21, 14, 0, 0); // June 21

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

  it("returns empty array when building is null", () => {
    const { result } = renderHook(() =>
      useFacadeAnalysis(null, nyc, summerDate)
    );
    expect(result.current).toEqual([]);
  });

  it("returns facade exposures for a rectangular building", () => {
    const { result } = renderHook(() =>
      useFacadeAnalysis(rectBuilding, nyc, summerDate)
    );

    expect(result.current.length).toBeGreaterThan(0);
    for (const facade of result.current) {
      expect(facade).toHaveProperty("direction");
      expect(facade).toHaveProperty("sunlightHours");
      expect(facade.sunlightHours).toBeGreaterThanOrEqual(0);
    }
  });

  it("south-facing facade gets more sun than north in NYC summer", () => {
    const { result } = renderHook(() =>
      useFacadeAnalysis(rectBuilding, nyc, summerDate)
    );

    const south = result.current.find((f) => f.direction === "S");
    const north = result.current.find((f) => f.direction === "N");

    expect(south).toBeDefined();
    expect(north).toBeDefined();
    expect(south!.sunlightHours).toBeGreaterThan(north!.sunlightHours);
  });

  it("returns stable reference for same inputs", () => {
    const { result, rerender } = renderHook(
      ({ building, center, date }) =>
        useFacadeAnalysis(building, center, date),
      {
        initialProps: {
          building: rectBuilding,
          center: nyc,
          date: summerDate,
        },
      }
    );

    const first = result.current;
    rerender({ building: rectBuilding, center: nyc, date: summerDate });
    expect(result.current).toBe(first);
  });

  it("recalculates when building changes", () => {
    const otherBuilding: ProjectedBuilding = {
      id: 2,
      footprint: [
        [0, 0],
        [0, 5],
        [5, 5],
        [5, 0],
      ],
      height: 20,
    };

    const { result, rerender } = renderHook(
      ({ building }) => useFacadeAnalysis(building, nyc, summerDate),
      { initialProps: { building: rectBuilding } }
    );

    const first = result.current;
    rerender({ building: otherBuilding });
    expect(result.current).not.toBe(first);
  });
});
