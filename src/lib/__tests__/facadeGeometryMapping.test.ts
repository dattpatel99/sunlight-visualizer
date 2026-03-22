import { describe, it, expect } from "vitest";
import type { ProjectedBuilding } from "../../types";
import { extractFacades, normalToDirection } from "../facadeUtils";
import { createBuildingGeometry } from "../buildingGeometry";

/**
 * Simple 20x10 rectangle, height 15.
 * Footprint CCW in XZ: NW→SW→SE→NE
 */
function makeRectBuilding(): ProjectedBuilding {
  return {
    id: 1,
    footprint: [
      [0, 0],   // NW
      [0, 10],  // SW
      [20, 10], // SE
      [20, 0],  // NE
    ],
    height: 15,
  };
}

/** L-shaped building with 6 edges */
function makeLShapedBuilding(): ProjectedBuilding {
  return {
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
}

// ─── normalToDirection ───────────────────────────────────────────────

describe("normalToDirection", () => {
  it("maps (0, -1) to N", () => expect(normalToDirection(0, -1)).toBe("N"));
  it("maps (1, 0) to E", () => expect(normalToDirection(1, 0)).toBe("E"));
  it("maps (0, 1) to S", () => expect(normalToDirection(0, 1)).toBe("S"));
  it("maps (-1, 0) to W", () => expect(normalToDirection(-1, 0)).toBe("W"));
  it("maps diagonal (1, -1) to NE", () => {
    const d = normalToDirection(1 / Math.SQRT2, -1 / Math.SQRT2);
    expect(d).toBe("NE");
  });
});

// ─── extractFacades ──────────────────────────────────────────────────

describe("extractFacades", () => {
  it("produces 4 facades for a rectangle with correct directions", () => {
    const facades = extractFacades(makeRectBuilding());
    expect(facades.length).toBe(4);
    const dirs = facades.map((f) => f.direction);
    expect(dirs).toEqual(["W", "S", "E", "N"]);
  });

  it("produces 6 facades for an L-shape", () => {
    const facades = extractFacades(makeLShapedBuilding());
    expect(facades.length).toBe(6);
    // Every facade should have a valid cardinal/inter-cardinal direction
    for (const f of facades) {
      expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(f.direction);
    }
  });

  it("skips degenerate edges (< 0.1m)", () => {
    const b: ProjectedBuilding = {
      id: 99,
      footprint: [
        [0, 0],
        [0, 10],
        [0.01, 10.01], // degenerate edge from previous point
        [20, 10],
        [20, 0],
      ],
      height: 10,
    };
    const facades = extractFacades(b);
    // The degenerate edge should be skipped
    expect(facades.length).toBe(4);
  });
});

// ─── createBuildingGeometry structure ────────────────────────────────

describe("createBuildingGeometry", () => {
  it("produces non-indexed geometry (Three.js 0.175+)", () => {
    const geo = createBuildingGeometry(makeRectBuilding());
    // Current Three.js ExtrudeGeometry is non-indexed
    expect(geo.getIndex()).toBeNull();
  });

  it("has position and normal attributes", () => {
    const geo = createBuildingGeometry(makeRectBuilding());
    expect(geo.getAttribute("position")).toBeDefined();
    expect(geo.getAttribute("normal")).toBeDefined();
  });

  it("all side triangles have horizontal normals mapping to valid directions", () => {
    const geo = createBuildingGeometry(makeRectBuilding());
    const normalAttr = geo.getAttribute("normal");
    const posAttr = geo.getAttribute("position");
    const triCount = posAttr.count / 3;

    const sideDirections = new Set<string>();
    for (let tri = 0; tri < triCount; tri++) {
      const vi = tri * 3;
      const ny = normalAttr.getY(vi);
      if (Math.abs(ny) < 0.01) {
        const nx = normalAttr.getX(vi);
        const nz = normalAttr.getZ(vi);
        sideDirections.add(normalToDirection(nx, nz));
      }
    }
    // A rectangle should have 4 directions: N, E, S, W
    expect(sideDirections).toEqual(new Set(["N", "E", "S", "W"]));
  });

  it("L-shaped building has 6 side wall directions matching extractFacades", () => {
    const b = makeLShapedBuilding();
    const geo = createBuildingGeometry(b);
    const facades = extractFacades(b);
    const normalAttr = geo.getAttribute("normal");
    const posAttr = geo.getAttribute("position");
    const triCount = posAttr.count / 3;

    const geoDirs = new Set<string>();
    for (let tri = 0; tri < triCount; tri++) {
      const vi = tri * 3;
      const ny = normalAttr.getY(vi);
      if (Math.abs(ny) < 0.01) {
        geoDirs.add(normalToDirection(normalAttr.getX(vi), normalAttr.getZ(vi)));
      }
    }

    const facadeDirs = new Set(facades.map((f) => f.direction));
    console.log("Geometry directions:", [...geoDirs].sort());
    console.log("Facade directions:", [...facadeDirs].sort());
    // Every direction from extractFacades should appear in the geometry
    for (const d of facadeDirs) {
      expect(geoDirs.has(d)).toBe(true);
    }
  });
});

// ─── Vertex coloring logic (simulates Building.tsx) ──────────────────

describe("vertex coloring via normal-based direction lookup", () => {
  it("colors all side vertices by reading normals — no index or group assumptions", () => {
    const b = makeRectBuilding();
    const geo = createBuildingGeometry(b);
    const normalAttr = geo.getAttribute("normal");
    const posAttr = geo.getAttribute("position");

    // Simulate directionMap from facadeExposures
    const directionMap = new Map([
      ["N", { sunlightHours: 2 }],
      ["E", { sunlightHours: 5 }],
      ["S", { sunlightHours: 8 }],
      ["W", { sunlightHours: 3 }],
    ]);

    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);
    const directionCounts = new Map<string, number>();

    for (let vi = 0; vi < vertexCount; vi += 3) {
      const nx = normalAttr.getX(vi);
      const ny = normalAttr.getY(vi);
      const nz = normalAttr.getZ(vi);

      let colored = false;
      if (Math.abs(ny) <= 0.9) {
        // Side wall
        const direction = normalToDirection(nx, nz);
        const facade = directionMap.get(direction);
        if (facade) {
          colored = true;
          directionCounts.set(direction, (directionCounts.get(direction) || 0) + 1);
          for (let k = 0; k < 3; k++) {
            colors[(vi + k) * 3] = facade.sunlightHours / 10; // simplified
            colors[(vi + k) * 3 + 1] = 0.5;
            colors[(vi + k) * 3 + 2] = 0;
          }
        }
      }

      if (!colored) {
        for (let k = 0; k < 3; k++) {
          colors[(vi + k) * 3] = 0.5;
          colors[(vi + k) * 3 + 1] = 0.6;
          colors[(vi + k) * 3 + 2] = 0.7;
        }
      }
    }

    console.log("Direction triangle counts:", Object.fromEntries(directionCounts));
    // Each wall of the rectangle should have 2 triangles
    for (const [dir, count] of directionCounts) {
      expect(count).toBe(2); // 2 triangles per wall for a rectangle
      console.log(`  ${dir}: ${count} triangles colored`);
    }

    // All vertices should have been colored (no zeros)
    let allColored = true;
    for (let i = 0; i < colors.length; i += 3) {
      if (colors[i] === 0 && colors[i + 1] === 0 && colors[i + 2] === 0) {
        allColored = false;
        break;
      }
    }
    expect(allColored).toBe(true);
  });

  it("highlight mode: only highlighted direction gets HIGHLIGHT_COLOR", () => {
    const b = makeRectBuilding();
    const geo = createBuildingGeometry(b);
    const normalAttr = geo.getAttribute("normal");
    const posAttr = geo.getAttribute("position");

    const highlightDirection = "S";

    const vertexCount = posAttr.count;
    const highlightedDirs = new Set<string>();
    const dimmedDirs = new Set<string>();

    for (let vi = 0; vi < vertexCount; vi += 3) {
      const nx = normalAttr.getX(vi);
      const ny = normalAttr.getY(vi);
      const nz = normalAttr.getZ(vi);

      if (Math.abs(ny) <= 0.9) {
        const direction = normalToDirection(nx, nz);
        if (direction === highlightDirection) {
          highlightedDirs.add(direction);
        } else {
          dimmedDirs.add(direction);
        }
      }
    }

    console.log("Highlighted:", [...highlightedDirs]);
    console.log("Dimmed:", [...dimmedDirs]);

    expect(highlightedDirs.has("S")).toBe(true);
    expect(dimmedDirs.has("S")).toBe(false);
    expect(dimmedDirs.size).toBe(3); // N, E, W are dimmed
  });
});
