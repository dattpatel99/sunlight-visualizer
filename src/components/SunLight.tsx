import { useRef } from "react";
import * as THREE from "three";
import { useHelper } from "@react-three/drei";
import type { SunPositionData } from "../types";
import { sunPositionToVector3 } from "../lib/sunDirection";
import { SHADOW_MAP_SIZE, SHADOW_CAMERA_SIZE } from "../constants";

interface SunLightProps {
  sunPosition: SunPositionData;
  debug?: boolean;
}

export function SunLight({ sunPosition, debug = false }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useHelper(debug ? lightRef : false, THREE.DirectionalLightHelper, 5, "orange");

  const pos = sunPositionToVector3(sunPosition);
  const intensity = sunPosition.isNight ? 0 : 2;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        ref={lightRef}
        position={[pos.x, pos.y, pos.z]}
        intensity={intensity}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-camera-left={-SHADOW_CAMERA_SIZE}
        shadow-camera-right={SHADOW_CAMERA_SIZE}
        shadow-camera-top={SHADOW_CAMERA_SIZE}
        shadow-camera-bottom={-SHADOW_CAMERA_SIZE}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-bias={-0.001}
      />
    </>
  );
}
