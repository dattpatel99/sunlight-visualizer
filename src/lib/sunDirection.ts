import * as THREE from "three";
import type { SunPositionData } from "../types";
import { SUN_DISTANCE } from "../constants";

/**
 * Convert SunCalc azimuth/altitude to a Three.js world position for DirectionalLight.
 *
 * SunCalc conventions:
 *   azimuth: 0 = south, positive = westward (radians)
 *   altitude: 0 = horizon, PI/2 = zenith (radians)
 *
 * Three.js conventions (after our projection):
 *   +X = east, +Y = up, +Z = south
 *
 * So: sun from the south with azimuth=0 means light coming from +Z direction.
 */
export function sunPositionToVector3(sun: SunPositionData): THREE.Vector3 {
  const { azimuth, altitude } = sun;
  const cosAlt = Math.cos(altitude);

  return new THREE.Vector3(
    -Math.sin(azimuth) * cosAlt * SUN_DISTANCE,
    Math.sin(altitude) * SUN_DISTANCE,
    Math.cos(azimuth) * cosAlt * SUN_DISTANCE
  );
}
