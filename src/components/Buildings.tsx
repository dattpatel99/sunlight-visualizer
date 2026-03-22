import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ProjectedBuilding } from "../types";
import type { FacadeExposure } from "../lib/facadeUtils";
import { Building } from "./Building";
import { createBuildingGeometry } from "../lib/buildingGeometry";

interface BuildingsProps {
  buildings: ProjectedBuilding[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  facadeExposures: FacadeExposure[];
  highlightDirection: string | null;
}

const MERGE_THRESHOLD = 50;

export function Buildings({ buildings, selectedId, onSelect, facadeExposures, highlightDirection }: BuildingsProps) {
  // For small counts, render individually for full interactivity.
  // For large counts, merge non-selected buildings into one mesh.
  const shouldMerge = buildings.length > MERGE_THRESHOLD;

  const mergedGeometry = useMemo(() => {
    if (!shouldMerge) return null;

    const geometries: THREE.BufferGeometry[] = [];
    for (const b of buildings) {
      if (b.id === selectedId) continue;
      const geo = createBuildingGeometry(b);
      // toNonIndexed so mergeGeometries works cleanly
      geometries.push(geo.toNonIndexed());
    }
    if (geometries.length === 0) return null;

    const merged = mergeGeometries(geometries, false);
    // Dispose source geometries
    for (const g of geometries) g.dispose();
    return merged;
  }, [buildings, selectedId, shouldMerge]);

  // Build a lookup: click position -> building id for the merged mesh
  const buildingLookup = useMemo(() => {
    if (!shouldMerge) return null;
    // For merged mesh, we use raycasting + bounding box check
    const lookup: { id: number; bbox: THREE.Box3 }[] = [];
    for (const b of buildings) {
      if (b.id === selectedId) continue;
      const geo = createBuildingGeometry(b);
      geo.computeBoundingBox();
      if (geo.boundingBox) {
        lookup.push({ id: b.id, bbox: geo.boundingBox.clone() });
      }
      geo.dispose();
    }
    return lookup;
  }, [buildings, selectedId, shouldMerge]);

  const handleMergedClick = (e: THREE.Intersection) => {
    if (!buildingLookup) return;
    const point = e.point;
    // Find which building's bounding box contains the click point
    for (const { id, bbox } of buildingLookup) {
      if (bbox.containsPoint(point)) {
        onSelect(id);
        return;
      }
    }
  };

  const selectedBuilding = selectedId !== null
    ? buildings.find((b) => b.id === selectedId)
    : null;

  if (shouldMerge) {
    return (
      <group>
        {/* Merged non-selected buildings */}
        {mergedGeometry && (
          <mesh
            geometry={mergedGeometry}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              handleMergedClick(e.intersections[0]);
            }}
          >
            <meshStandardMaterial color="#6677aa" />
          </mesh>
        )}
        {/* Selected building rendered individually for interactivity + facade colors */}
        {selectedBuilding && (
          <Building
            building={selectedBuilding}
            selected={true}
            onSelect={onSelect}
            facadeExposures={facadeExposures}
            highlightDirection={highlightDirection}
          />
        )}
      </group>
    );
  }

  // Below threshold: render each building individually
  return (
    <group>
      {buildings.map((b) => (
        <Building
          key={b.id}
          building={b}
          selected={b.id === selectedId}
          onSelect={onSelect}
          facadeExposures={b.id === selectedId ? facadeExposures : undefined}
          highlightDirection={b.id === selectedId ? highlightDirection : null}
        />
      ))}
    </group>
  );
}
