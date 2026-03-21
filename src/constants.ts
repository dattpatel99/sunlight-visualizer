import type { LatLng } from "./types";

export const DEFAULT_LOCATION: LatLng = { lat: 40.748, lng: -73.986 }; // NYC / Empire State Building area

export const PRESETS: { name: string; location: LatLng }[] = [
  { name: "NYC", location: { lat: 40.748, lng: -73.986 } },
  { name: "London", location: { lat: 51.5074, lng: -0.1278 } },
  { name: "Tokyo", location: { lat: 35.6762, lng: 139.6503 } },
];

export const SHADOW_MAP_SIZE = 2048;
export const SHADOW_CAMERA_SIZE = 300;
export const SUN_DISTANCE = 200;
export const GROUND_SIZE = 1000;
export const DEFAULT_BUILDING_HEIGHT = 10;
export const METERS_PER_LEVEL = 3;
export const OVERPASS_RADIUS = 150; // meters
