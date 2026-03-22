import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildings } from "../useBuildings";
import type { BuildingData } from "../../types";

vi.mock("../../lib/overpass", () => ({
  fetchBuildings: vi.fn(),
}));

vi.mock("../../lib/overture", () => ({
  fetchOvertureBuildings: vi.fn(),
}));

import { fetchBuildings } from "../../lib/overpass";
import { fetchOvertureBuildings } from "../../lib/overture";

const mockFetchBuildings = vi.mocked(fetchBuildings);
const mockFetchOvertureBuildings = vi.mocked(fetchOvertureBuildings);

const sampleBuildings: BuildingData[] = [
  {
    id: 1,
    footprint: [
      [-73.986, 40.748],
      [-73.985, 40.748],
      [-73.985, 40.749],
      [-73.986, 40.749],
    ],
    height: 20,
  },
];

describe("useBuildings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useBuildings());

    expect(result.current.buildings).toEqual([]);
    expect(result.current.rawBuildings).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads buildings from OSM source", async () => {
    mockFetchBuildings.mockResolvedValue(sampleBuildings);

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40.748, lng: -73.986 }, 150, "osm");
    });

    expect(result.current.loading).toBe(true);

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchBuildings).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      150
    );
    expect(result.current.buildings.length).toBe(1);
    expect(result.current.rawBuildings).toEqual(sampleBuildings);
    expect(result.current.error).toBeNull();
  });

  it("loads buildings from Overture source", async () => {
    mockFetchOvertureBuildings.mockResolvedValue(sampleBuildings);

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40.748, lng: -73.986 }, 200, "overture");
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchOvertureBuildings).toHaveBeenCalledWith(
      { lat: 40.748, lng: -73.986 },
      200
    );
    expect(result.current.buildings.length).toBe(1);
  });

  it("projects raw buildings to local XZ coordinates", async () => {
    mockFetchBuildings.mockResolvedValue(sampleBuildings);

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40.748, lng: -73.986 }, 150, "osm");
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const projected = result.current.buildings[0];
    expect(projected.id).toBe(1);
    expect(projected.height).toBe(20);
    // Footprint should be in meters, not lat/lng
    for (const [x, z] of projected.footprint) {
      expect(Math.abs(x)).toBeLessThan(500); // should be meters, not degrees
      expect(Math.abs(z)).toBeLessThan(500);
    }
  });

  it("handles fetch errors gracefully", async () => {
    mockFetchBuildings.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40.748, lng: -73.986 }, 150, "osm");
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.buildings).toEqual([]);
  });

  it("handles non-Error exceptions", async () => {
    mockFetchBuildings.mockRejectedValue("string error");

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40.748, lng: -73.986 }, 150, "osm");
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load buildings");
  });

  it("clears error on new load", async () => {
    mockFetchBuildings.mockRejectedValueOnce(new Error("First error"));
    mockFetchBuildings.mockResolvedValueOnce(sampleBuildings);

    const { result } = renderHook(() => useBuildings());

    act(() => {
      result.current.load({ lat: 40, lng: -74 }, 150, "osm");
    });

    await vi.waitFor(() => {
      expect(result.current.error).toBe("First error");
    });

    act(() => {
      result.current.load({ lat: 40, lng: -74 }, 150, "osm");
    });

    // Error should be cleared immediately when loading starts
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.buildings.length).toBe(1);
  });
});
