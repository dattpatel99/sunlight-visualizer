import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBuildings } from "../overpass";
import { DEFAULT_BUILDING_HEIGHT, METERS_PER_LEVEL } from "../../constants";

function makeOverpassResponse(elements: unknown[]) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ elements }),
  };
}

/**
 * Build a minimal Overpass response with nodes and a way.
 * Node IDs [1..n] form a closed polygon (last node = first node).
 */
function makeSquareBuilding(opts: {
  wayId?: number;
  tags?: Record<string, string>;
}) {
  const { wayId = 100, tags = { building: "yes" } } = opts;
  // A simple square footprint: 4 unique nodes + closing node
  const nodes = [
    { type: "node", id: 1, lat: 40.0, lon: -74.0 },
    { type: "node", id: 2, lat: 40.0, lon: -73.999 },
    { type: "node", id: 3, lat: 40.001, lon: -73.999 },
    { type: "node", id: 4, lat: 40.001, lon: -74.0 },
  ];
  const way = {
    type: "way",
    id: wayId,
    tags,
    nodes: [1, 2, 3, 4, 1], // closed polygon
  };
  return [...nodes, way];
}

describe("fetchBuildings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses ways with building tag into BuildingData", async () => {
    const elements = makeSquareBuilding({ tags: { building: "yes" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });

    expect(buildings).toHaveLength(1);
    expect(buildings[0].id).toBe(100);
    // After removing closing node, 4 unique nodes remain
    expect(buildings[0].footprint).toHaveLength(4);
  });

  it("uses height tag when available", async () => {
    const elements = makeSquareBuilding({ tags: { building: "yes", height: "25" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings[0].height).toBe(25);
  });

  it("falls back to building:levels * METERS_PER_LEVEL", async () => {
    const elements = makeSquareBuilding({
      tags: { building: "yes", "building:levels": "5" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings[0].height).toBe(5 * METERS_PER_LEVEL);
  });

  it("falls back to DEFAULT_BUILDING_HEIGHT when no height info", async () => {
    const elements = makeSquareBuilding({ tags: { building: "yes" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings[0].height).toBe(DEFAULT_BUILDING_HEIGHT);
  });

  it("removes duplicate closing node from footprint", async () => {
    const elements = makeSquareBuilding({});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    const fp = buildings[0].footprint;
    // First and last should NOT be the same
    const first = fp[0];
    const last = fp[fp.length - 1];
    expect(first[0] === last[0] && first[1] === last[1]).toBe(false);
  });

  it("skips ways with fewer than 3 unique nodes", async () => {
    // Only 2 unique nodes + closing = 3 total, but only 2 unique after dedup
    const elements = [
      { type: "node", id: 1, lat: 40.0, lon: -74.0 },
      { type: "node", id: 2, lat: 40.0, lon: -73.999 },
      {
        type: "way",
        id: 200,
        tags: { building: "yes" },
        nodes: [1, 2, 1], // only 2 unique nodes, closed polygon
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    // With only 3 nodes total and closing removed = 2 nodes, which is < 3 threshold
    // Actually the code checks footprint.length >= 4 before removing, so [1,2,1] = length 3 < 4
    expect(buildings).toHaveLength(0);
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    await expect(fetchBuildings({ lat: 40.0, lng: -74.0 })).rejects.toThrow(
      "Overpass API error: 500"
    );
  });

  it("prefers height over building:levels", async () => {
    const elements = makeSquareBuilding({
      tags: { building: "yes", height: "30", "building:levels": "5" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings[0].height).toBe(30);
  });

  it("footprint coordinates are [lon, lat] pairs from nodes", async () => {
    const elements = makeSquareBuilding({});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeOverpassResponse(elements)));

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    const fp = buildings[0].footprint;
    // First node: lon=-74.0, lat=40.0
    expect(fp[0]).toEqual([-74.0, 40.0]);
    // Second node: lon=-73.999, lat=40.0
    expect(fp[1]).toEqual([-73.999, 40.0]);
  });

  it("ignores ways without building tag", async () => {
    const nodes = [
      { type: "node", id: 1, lat: 40.0, lon: -74.0 },
      { type: "node", id: 2, lat: 40.0, lon: -73.999 },
      { type: "node", id: 3, lat: 40.001, lon: -73.999 },
      { type: "node", id: 4, lat: 40.001, lon: -74.0 },
    ];
    const way = {
      type: "way",
      id: 300,
      tags: { highway: "residential" }, // not a building
      nodes: [1, 2, 3, 4, 1],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeOverpassResponse([...nodes, way]))
    );

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings).toHaveLength(0);
  });

  it("skips ways with missing node references", async () => {
    const nodes = [
      { type: "node", id: 1, lat: 40.0, lon: -74.0 },
      { type: "node", id: 2, lat: 40.0, lon: -73.999 },
      // Node 3 and 4 are missing
    ];
    const way = {
      type: "way",
      id: 400,
      tags: { building: "yes" },
      nodes: [1, 2, 3, 4, 1], // nodes 3 and 4 not in the element list
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeOverpassResponse([...nodes, way]))
    );

    const buildings = await fetchBuildings({ lat: 40.0, lng: -74.0 });
    expect(buildings).toHaveLength(0);
  });
});
