import * as THREE from "three";
import type { ProjectedBuilding } from "../types";

/** Create an ExtrudeGeometry for a building footprint */
export function createBuildingGeometry(
  building: ProjectedBuilding
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const fp = building.footprint;

  shape.moveTo(fp[0][0], fp[0][1]);
  for (let i = 1; i < fp.length; i++) {
    shape.lineTo(fp[i][0], fp[i][1]);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: building.height,
    bevelEnabled: false,
  });

  // ExtrudeGeometry extrudes along +Z by default.
  // Rotate so extrusion goes along +Y (upward).
  geometry.rotateX(-Math.PI / 2);

  return geometry;
}
