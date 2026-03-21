import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ProjectedBuilding, SunPositionData } from "../types";
import { Buildings } from "./Buildings";
import { SunLight } from "./SunLight";
import { Ground } from "./Ground";

interface SceneProps {
  buildings: ProjectedBuilding[];
  sunPosition: SunPositionData;
  selectedBuildingId: number | null;
  onSelectBuilding: (id: number) => void;
}

export function Scene({
  buildings,
  sunPosition,
  selectedBuildingId,
  onSelectBuilding,
}: SceneProps) {
  return (
    <Canvas
      shadows="soft"
      camera={{ position: [100, 150, 200], fov: 50, near: 1, far: 2000 }}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelectBuilding(-1)}
    >
      <color attach="background" args={[sunPosition.isNight ? "#1a1a2e" : "#87ceeb"]} />
      <SunLight sunPosition={sunPosition} />
      <Ground />
      <Buildings
        buildings={buildings}
        selectedId={selectedBuildingId}
        onSelect={onSelectBuilding}
      />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={10}
        maxDistance={800}
      />
    </Canvas>
  );
}
