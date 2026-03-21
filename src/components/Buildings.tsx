import type { ProjectedBuilding } from "../types";
import { Building } from "./Building";

interface BuildingsProps {
  buildings: ProjectedBuilding[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function Buildings({ buildings, selectedId, onSelect }: BuildingsProps) {
  return (
    <group>
      {buildings.map((b) => (
        <Building
          key={b.id}
          building={b}
          selected={b.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
