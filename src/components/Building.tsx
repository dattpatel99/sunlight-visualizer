import { useMemo, useState } from "react";
import * as THREE from "three";
import type { ProjectedBuilding } from "../types";
import type { FacadeExposure } from "../lib/facadeUtils";
import { createBuildingGeometry } from "../lib/buildingGeometry";

interface BuildingProps {
  building: ProjectedBuilding;
  selected: boolean;
  onSelect: (id: number) => void;
  facadeExposures?: FacadeExposure[];
}

/** Map sunlight hours to a color: blue (shade) -> yellow (full sun) */
function exposureToColor(hours: number, maxHours: number): THREE.Color {
  if (maxHours <= 0) return new THREE.Color("#6677aa");
  const t = Math.min(hours / maxHours, 1);
  const shade = new THREE.Color("#446688");
  const sun = new THREE.Color("#f5c542");
  return shade.clone().lerp(sun, t);
}

export function Building({ building, selected, onSelect, facadeExposures }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const geometry = useMemo(() => createBuildingGeometry(building), [building]);

  // When selected and we have facade data, apply per-face vertex colors
  const coloredGeometry = useMemo(() => {
    if (!selected || !facadeExposures || facadeExposures.length === 0) return null;

    const geo = geometry.clone();
    const maxHours = Math.max(...facadeExposures.map((f) => f.sunlightHours), 0.1);
    const fp = building.footprint;
    const n = fp.length;

    // ExtrudeGeometry groups: 0=top cap, 1=bottom cap, 2=sides
    // Side faces: for each edge i, there are 2 triangles (6 vertices)
    // The position buffer is ordered: top cap vertices, bottom cap vertices, side vertices

    const posAttr = geo.getAttribute("position");
    const colors = new Float32Array(posAttr.count * 3);

    // Default color for top/bottom caps
    const topColor = new THREE.Color("#8899bb");

    // Assign colors per vertex
    // We need to figure out which group each vertex belongs to
    const groups = geo.groups;
    if (groups.length >= 3) {
      // Group 0 = top, Group 1 = bottom, Group 2 = sides
      const topGroup = groups[0];
      const bottomGroup = groups[1];
      const sideGroup = groups[2];

      const indexAttr = geo.getIndex();
      if (!indexAttr) return null;
      const indices = indexAttr.array;

      // Color top and bottom caps
      for (const group of [topGroup, bottomGroup]) {
        for (let i = group.start; i < group.start + group.count; i++) {
          const vi = indices[i];
          colors[vi * 3] = topColor.r;
          colors[vi * 3 + 1] = topColor.g;
          colors[vi * 3 + 2] = topColor.b;
        }
      }

      // Color side faces by matching to facade edges
      // Sides have 2 triangles (6 indices) per edge, in edge order
      const sideStart = sideGroup.start;
      const indicesPerEdge = 6;

      for (let edgeIdx = 0; edgeIdx < n; edgeIdx++) {
        const facadeColor =
          edgeIdx < facadeExposures.length
            ? exposureToColor(facadeExposures[edgeIdx].sunlightHours, maxHours)
            : topColor;

        const baseIdx = sideStart + edgeIdx * indicesPerEdge;
        for (let k = 0; k < indicesPerEdge; k++) {
          const vi = indices[baseIdx + k];
          if (vi !== undefined) {
            colors[vi * 3] = facadeColor.r;
            colors[vi * 3 + 1] = facadeColor.g;
            colors[vi * 3 + 2] = facadeColor.b;
          }
        }
      }
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [geometry, selected, facadeExposures, building.footprint]);

  const showVertexColors = selected && coloredGeometry;
  const activeGeometry = showVertexColors ? coloredGeometry : geometry;
  const color = selected ? "#ff9900" : hovered ? "#8899bb" : "#6677aa";

  return (
    <mesh
      geometry={activeGeometry}
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
        color={showVertexColors ? "#ffffff" : color}
        vertexColors={!!showVertexColors}
      />
    </mesh>
  );
}
