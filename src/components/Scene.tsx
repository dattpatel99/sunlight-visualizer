import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import type { LatLng, ProjectedBuilding, SunPositionData } from "../types";
import type { FacadeExposure } from "../lib/facadeUtils";
import { Buildings } from "./Buildings";
import { SunLight } from "./SunLight";
import { Ground } from "./Ground";
import { Compass } from "./Compass";

// Adaptive shadow quality: metro high-rise (200+ buildings) → hard shadows for performance
// Small to medium (≤50) → soft shadows for visual fidelity
const SOFT_SHADOW_BUILDING_THRESHOLD = 50;
const HARD_SHADOW_BUILDING_THRESHOLD = 200;

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
  // Adaptive shadow mode: soft (beautiful) up to threshold, then off for perf
  const shadows = useMemo(() => {
    if (buildings.length <= SOFT_SHADOW_BUILDING_THRESHOLD) return "soft";
    if (buildings.length <= HARD_SHADOW_BUILDING_THRESHOLD) return true; // PCF hard
    return false; // no shadows at all — pure performance for dense metros
  }, [buildings.length]);

  return (
    <Canvas
      shadows={shadows}
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
