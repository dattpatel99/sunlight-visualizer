import { useMemo, useState } from "react";
import type { ProjectedBuilding } from "../types";
import { createBuildingGeometry } from "../lib/buildingGeometry";

interface BuildingProps {
  building: ProjectedBuilding;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function Building({ building, selected, onSelect }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const geometry = useMemo(() => createBuildingGeometry(building), [building]);

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
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
