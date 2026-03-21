import type { LatLng, BuildingData, ProjectedBuilding } from "../types";

const METERS_PER_DEGREE = 111320;

/** Convert longitude to meters offset from center */
export function lngToX(lng: number, centerLng: number, centerLat: number): number {
  return (lng - centerLng) * METERS_PER_DEGREE * Math.cos((centerLat * Math.PI) / 180);
}

/** Convert latitude to meters offset from center (north = -Z in Three.js) */
export function latToZ(lat: number, centerLat: number): number {
  return -(lat - centerLat) * METERS_PER_DEGREE;
}

/** Project a building's footprint from WGS84 to local XZ meters */
export function projectBuilding(
  building: BuildingData,
  center: LatLng
): ProjectedBuilding {
  return {
    id: building.id,
    height: building.height,
    footprint: building.footprint.map(([lng, lat]) => [
      lngToX(lng, center.lng, center.lat),
      latToZ(lat, center.lat),
    ]),
  };
}

/** Project all buildings */
export function projectBuildings(
  buildings: BuildingData[],
  center: LatLng
): ProjectedBuilding[] {
  return buildings.map((b) => projectBuilding(b, center));
}
