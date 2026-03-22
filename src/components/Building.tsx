import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ProjectedBuilding } from "../types";
import type { FacadeExposure } from "../lib/facadeUtils";
import { normalToDirection } from "../lib/facadeUtils";
import { createBuildingGeometry } from "../lib/buildingGeometry";

interface BuildingProps {
  building: ProjectedBuilding;
  selected: boolean;
  onSelect: (id: number) => void;
  facadeExposures?: FacadeExposure[];
  highlightDirection?: string | null;
}

/** Map sunlight hours to a color: blue (shade) -> yellow (full sun) */
function exposureToColor(hours: number, maxHours: number): THREE.Color {
  if (maxHours <= 0) return new THREE.Color("#6677aa");
  const t = Math.min(hours / maxHours, 1);
  const shade = new THREE.Color("#446688");
  const sun = new THREE.Color("#f5c542");
  return shade.clone().lerp(sun, t);
}

const HIGHLIGHT_COLOR = new THREE.Color("#ff44ff");
const DIM_COLOR = new THREE.Color("#334466");
const TOP_COLOR = new THREE.Color("#8899bb");

export function Building({ building, selected, onSelect, facadeExposures, highlightDirection }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => createBuildingGeometry(building), [building]);

  // Build a lookup: merged direction -> exposure data
  const directionMap = useMemo(() => {
    if (!facadeExposures) return null;
    const map = new Map<string, FacadeExposure>();
    for (const fe of facadeExposures) {
      map.set(fe.direction, fe);
    }
    return map;
  }, [facadeExposures]);

  const shouldColor = selected && !!directionMap;

  // Apply vertex colors by reading each triangle's normal from the geometry.
  // ExtrudeGeometry in Three.js 0.175 is non-indexed with all triangles
  // stored sequentially (every 3 vertices = 1 triangle).
  // useLayoutEffect ensures colors are applied before the browser paints.
  useLayoutEffect(() => {
    if (!shouldColor) {
      if (geometry.hasAttribute("color")) {
        geometry.deleteAttribute("color");
      }
      if (matRef.current) {
        matRef.current.vertexColors = false;
        matRef.current.needsUpdate = true;
      }
      return;
    }

    const maxHours = Math.max(
      ...[...directionMap!.values()].map((f) => f.sunlightHours),
      0.1
    );

    const posAttr = geometry.getAttribute("position");
    const normalAttr = geometry.getAttribute("normal");
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    // For each triangle, read its normal to classify it
    for (let vi = 0; vi < vertexCount; vi += 3) {
      // Read the normal of the first vertex of this triangle
      const nx = normalAttr.getX(vi);
      const ny = normalAttr.getY(vi);
      const nz = normalAttr.getZ(vi);

      let triColor: THREE.Color;

      if (Math.abs(ny) > 0.9) {
        // Top or bottom cap
        triColor = TOP_COLOR;
      } else {
        // Side wall: determine cardinal direction from horizontal normal
        const direction = normalToDirection(nx, nz);
        const facade = directionMap!.get(direction);

        if (highlightDirection && direction === highlightDirection) {
          triColor = HIGHLIGHT_COLOR;
        } else if (highlightDirection) {
          triColor = DIM_COLOR;
        } else if (facade) {
          triColor = exposureToColor(facade.sunlightHours, maxHours);
        } else {
          triColor = TOP_COLOR;
        }
      }

      // Apply same color to all 3 vertices of this triangle
      for (let k = 0; k < 3; k++) {
        colors[(vi + k) * 3] = triColor.r;
        colors[(vi + k) * 3 + 1] = triColor.g;
        colors[(vi + k) * 3 + 2] = triColor.b;
      }
    }

    const attr = new THREE.BufferAttribute(colors, 3);
    geometry.setAttribute("color", attr);
    attr.needsUpdate = true;

    if (matRef.current) {
      matRef.current.vertexColors = true;
      matRef.current.color.set("#ffffff");
      matRef.current.needsUpdate = true;
    }
  }, [geometry, shouldColor, directionMap, highlightDirection]);

  const color = selected ? "#ff9900" : hovered ? "#8899bb" : "#6677aa";

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect(building.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <meshStandardMaterial
        ref={matRef}
        color={shouldColor ? "#ffffff" : color}
        vertexColors={shouldColor}
      />
    </mesh>
  );
}
