import { describe, it, expect } from "vitest";
import * as THREE from "three";
import type { ProjectedBuilding } from "../../types";
import { createBuildingGeometry } from "../buildingGeometry";
import { extractFacades, normalToDirection } from "../facadeUtils";

/** Simple 20x10 rectangle, height 15 */
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

describe("explore actual ExtrudeGeometry structure", () => {
  it("dump full geometry info", () => {
    const b = makeRectBuilding();
    const geo = createBuildingGeometry(b);

    console.log("=== GEOMETRY OVERVIEW ===");
    console.log("Attributes:", Object.keys(geo.attributes));
    console.log("Index:", geo.getIndex());
    console.log("Groups:", JSON.stringify(geo.groups, null, 2));

    const posAttr = geo.getAttribute("position");
    const normalAttr = geo.getAttribute("normal");
    console.log("Position count:", posAttr.count);
    console.log("Normal count:", normalAttr.count);

    console.log("\n=== ALL TRIANGLES ===");
    const triCount = posAttr.count / 3;
    for (let tri = 0; tri < triCount; tri++) {
      const i0 = tri * 3;
      const i1 = tri * 3 + 1;
      const i2 = tri * 3 + 2;

      const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      const n0 = new THREE.Vector3(normalAttr.getX(i0), normalAttr.getY(i0), normalAttr.getZ(i0));

      // Classify triangle by its normal
      const isTop = Math.abs(n0.y - 1) < 0.01;     // normal ≈ (0, 1, 0)
      const isBottom = Math.abs(n0.y + 1) < 0.01;   // normal ≈ (0, -1, 0)
      const isSide = Math.abs(n0.y) < 0.01;          // normal horizontal

      let type = "unknown";
      let direction = "";
      if (isTop) type = "TOP";
      else if (isBottom) type = "BOTTOM";
      else if (isSide) {
        type = "SIDE";
        direction = normalToDirection(n0.x, n0.z);
      }

      console.log(
        `  tri ${tri}: ${type}${direction ? " " + direction : ""}` +
        ` | n=(${n0.x.toFixed(2)}, ${n0.y.toFixed(2)}, ${n0.z.toFixed(2)})` +
        ` | p0=(${p0.x.toFixed(1)}, ${p0.y.toFixed(1)}, ${p0.z.toFixed(1)})` +
        ` p1=(${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}, ${p1.z.toFixed(1)})` +
        ` p2=(${p2.x.toFixed(1)}, ${p2.y.toFixed(1)}, ${p2.z.toFixed(1)})`
      );
    }

    // Group the side triangles by direction
    console.log("\n=== SIDE TRIANGLES BY DIRECTION ===");
    const sidesByDir = new Map<string, number[]>();
    for (let tri = 0; tri < triCount; tri++) {
      const i0 = tri * 3;
      const n0 = new THREE.Vector3(normalAttr.getX(i0), normalAttr.getY(i0), normalAttr.getZ(i0));
      if (Math.abs(n0.y) < 0.01) {
        const dir = normalToDirection(n0.x, n0.z);
        const existing = sidesByDir.get(dir) || [];
        existing.push(tri);
        sidesByDir.set(dir, existing);
      }
    }
    for (const [dir, tris] of sidesByDir) {
      console.log(`  ${dir}: triangles ${tris.join(", ")} (${tris.length} tris = ${tris.length / 2} quads)`);
    }

    expect(posAttr.count).toBeGreaterThan(0);
  });

  it("compare with extractFacades", () => {
    const b = makeRectBuilding();
    const facades = extractFacades(b);
    const geo = createBuildingGeometry(b);
    const normalAttr = geo.getAttribute("normal");
    const posAttr = geo.getAttribute("position");
    const triCount = posAttr.count / 3;

    console.log("\n=== extractFacades result ===");
    for (let i = 0; i < facades.length; i++) {
      console.log(
        `  facade ${i}: ${facades[i].direction}` +
        ` normal=(${facades[i].normal[0].toFixed(3)}, ${facades[i].normal[1].toFixed(3)})` +
        ` start=(${facades[i].start[0]}, ${facades[i].start[1]})` +
        ` end=(${facades[i].end[0]}, ${facades[i].end[1]})` +
        ` len=${facades[i].length.toFixed(1)}`
      );
    }

    // Build direction -> vertex indices map from geometry
    console.log("\n=== MAPPING: geometry vertex indices by wall direction ===");
    const dirToVertices = new Map<string, number[]>();
    for (let tri = 0; tri < triCount; tri++) {
      const i0 = tri * 3;
      const n = new THREE.Vector3(normalAttr.getX(i0), normalAttr.getY(i0), normalAttr.getZ(i0));
      if (Math.abs(n.y) < 0.01) {
        const dir = normalToDirection(n.x, n.z);
        const existing = dirToVertices.get(dir) || [];
        existing.push(i0, i0 + 1, i0 + 2);
        dirToVertices.set(dir, existing);
      }
    }
    for (const [dir, verts] of dirToVertices) {
      console.log(`  ${dir}: ${verts.length} vertices (${verts.length / 6} wall segments)`);
    }

    expect(facades.length).toBe(4);
  });
});
