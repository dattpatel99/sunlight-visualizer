import type { ProjectedBuilding } from "../types";

interface BuildingInfoProps {
  building: ProjectedBuilding | null;
}

export function BuildingInfo({ building }: BuildingInfoProps) {
  if (!building) {
    return (
      <div style={{ color: "#888", fontSize: 13 }}>
        Click a building to see details
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <h3 style={{ margin: 0 }}>Building Info</h3>
      <div style={{ fontSize: 13 }}>
        <strong>ID:</strong> {building.id}
      </div>
      <div style={{ fontSize: 13 }}>
        <strong>Height:</strong> {building.height.toFixed(1)}m
      </div>
      <div style={{ fontSize: 13 }}>
        <strong>Vertices:</strong> {building.footprint.length}
      </div>
    </div>
  );
}
