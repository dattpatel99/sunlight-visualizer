import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodeAddress } from "../geocode";

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed results with location and displayName on success", async () => {
    const mockData = [
      {
        lat: "40.748817",
        lon: "-73.985428",
        display_name: "Empire State Building, New York, NY, USA",
      },
      {
        lat: "51.5074",
        lon: "-0.1278",
        display_name: "London, England, UK",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })
    );

    const results = await geocodeAddress("Empire State Building");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      location: { lat: 40.748817, lng: -73.985428 },
      displayName: "Empire State Building, New York, NY, USA",
    });
    expect(results[1]).toEqual({
      location: { lat: 51.5074, lng: -0.1278 },
      displayName: "London, England, UK",
    });
  });

  it("returns empty array when API returns empty results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
    );

    const results = await geocodeAddress("nonexistent place xyz123");
    expect(results).toEqual([]);
  });

  it("throws error with status when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      })
    );

    await expect(geocodeAddress("test")).rejects.toThrow("Geocoding failed: 429");
  });

  it("sends request to correct URL with proper parameters", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", mockFetch);

    await geocodeAddress("Central Park");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("https://nominatim.openstreetmap.org/search?");
    expect(url).toContain("q=Central+Park");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=5");
    expect(options.headers["User-Agent"]).toContain("SunlightVisualizer");
  });

  it("correctly parses string lat/lon to numbers", async () => {
    const mockData = [
      {
        lat: "35.6762",
        lon: "139.6503",
        display_name: "Tokyo, Japan",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })
    );

    const results = await geocodeAddress("Tokyo");
    expect(typeof results[0].location.lat).toBe("number");
    expect(typeof results[0].location.lng).toBe("number");
    expect(results[0].location.lat).toBeCloseTo(35.6762, 4);
    expect(results[0].location.lng).toBeCloseTo(139.6503, 4);
  });
});
