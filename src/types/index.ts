export interface LatLng {
  lat: number;
  lng: number;
}

export interface BuildingData {
  id: number;
  footprint: [number, number][]; // [lng, lat] pairs
  height: number; // meters
}

export interface SunPositionData {
  azimuth: number; // radians, 0=south, positive=westward
  altitude: number; // radians, 0=horizon, PI/2=zenith
  isNight: boolean;
}

export interface ProjectedBuilding {
  id: number;
  footprint: [number, number][]; // [x, z] meters from center
  height: number;
}
