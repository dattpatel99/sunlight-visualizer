import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSunPosition } from "../useSunPosition";

describe("useSunPosition", () => {
  const nyc = { lat: 40.748, lng: -73.986 };

  it("returns azimuth, altitude, and isNight fields", () => {
    const noon = new Date(2024, 5, 21, 12, 0, 0); // June 21 noon
    const { result } = renderHook(() => useSunPosition(nyc, noon));

    expect(result.current).toHaveProperty("azimuth");
    expect(result.current).toHaveProperty("altitude");
    expect(result.current).toHaveProperty("isNight");
  });

  it("reports daytime at noon in NYC on summer solstice", () => {
    const noon = new Date(2024, 5, 21, 12, 0, 0);
    const { result } = renderHook(() => useSunPosition(nyc, noon));

    expect(result.current.isNight).toBe(false);
    expect(result.current.altitude).toBeGreaterThan(0);
  });

  it("reports nighttime at midnight in NYC", () => {
    const midnight = new Date(2024, 5, 21, 2, 0, 0); // 2 AM
    const { result } = renderHook(() => useSunPosition(nyc, midnight));

    expect(result.current.isNight).toBe(true);
    expect(result.current.altitude).toBeLessThan(0);
  });

  it("returns stable reference for same inputs", () => {
    const date = new Date(2024, 5, 21, 12, 0, 0);
    const { result, rerender } = renderHook(
      ({ center, d }) => useSunPosition(center, d),
      { initialProps: { center: nyc, d: date } }
    );

    const first = result.current;
    rerender({ center: nyc, d: date });
    const second = result.current;

    expect(first).toBe(second); // same memoized reference
  });

  it("recalculates when date changes", () => {
    const morning = new Date(2024, 5, 21, 8, 0, 0);
    const afternoon = new Date(2024, 5, 21, 16, 0, 0);

    const { result, rerender } = renderHook(
      ({ center, d }) => useSunPosition(center, d),
      { initialProps: { center: nyc, d: morning } }
    );

    const morningAz = result.current.azimuth;
    rerender({ center: nyc, d: afternoon });
    const afternoonAz = result.current.azimuth;

    // Azimuth should differ between morning and afternoon
    expect(morningAz).not.toEqual(afternoonAz);
  });

  it("recalculates when location changes", () => {
    const date = new Date(2024, 5, 21, 12, 0, 0);
    const tokyo = { lat: 35.6762, lng: 139.6503 };

    const { result, rerender } = renderHook(
      ({ center, d }) => useSunPosition(center, d),
      { initialProps: { center: nyc, d: date } }
    );

    const nycAlt = result.current.altitude;
    rerender({ center: tokyo, d: date });
    const tokyoAlt = result.current.altitude;

    expect(nycAlt).not.toEqual(tokyoAlt);
  });
});
