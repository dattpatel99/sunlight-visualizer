import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { LatLng, ProjectedBuilding, SunPositionData } from "../types";
import type { FacadeExposure } from "../lib/facadeUtils";
import { Buildings } from "./Buildings";
import { SunLight } from "./SunLight";
import { Ground } from "./Ground";
import { Compass } from "./Compass";

interface SceneProps {
  buildings: ProjectedBuilding[];
  sunPosition: SunPositionData;
  selectedBuildingId: number | null;
  onSelectBuilding: (id: number) => void;
  facadeExposures: FacadeExposure[];
  center: LatLng;
  highlightDirection: string | null;
}

export function Scene({
  buildings,
  sunPosition,
  selectedBuildingId,
  onSelectBuilding,
  facadeExposures,
  center,
  highlightDirection,
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
      <Ground center={center} />
      <Buildings
        buildings={buildings}
        selectedId={selectedBuildingId}
        onSelect={onSelectBuilding}
        facadeExposures={facadeExposures}
        highlightDirection={highlightDirection}
      />
      <Compass />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={10}
        maxDistance={800}
      />
    </Canvas>
  );
}
