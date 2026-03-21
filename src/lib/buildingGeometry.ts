import * as THREE from "three";
import type { ProjectedBuilding } from "../types";

/** Create an ExtrudeGeometry for a building footprint */
export function createBuildingGeometry(
  building: ProjectedBuilding
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const fp = building.footprint;

  // Shape is drawn on the XY plane. After rotateX(-PI/2), shape Y maps to
  // world -Z. Our footprint Z convention is +Z = south, so we negate Z here
  // so that south stays +Z after the rotation. We also reverse vertex order
  // to preserve correct face winding (outward normals).
  shape.moveTo(fp[fp.length - 1][0], -fp[fp.length - 1][1]);
  for (let i = fp.length - 2; i >= 0; i--) {
    shape.lineTo(fp[i][0], -fp[i][1]);
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
