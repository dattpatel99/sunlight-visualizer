import SunCalc from "suncalc";
import type { LatLng, ProjectedBuilding } from "../types";

export interface Facade {
  /** Start point [x, z] in local meters */
  start: [number, number];
  /** End point [x, z] in local meters */
  end: [number, number];
  /** Midpoint [x, z] */
  midpoint: [number, number];
  /** Outward unit normal [nx, nz] on the XZ plane */
  normal: [number, number];
  /** Cardinal direction label */
  direction: string;
  /** Wall length in meters */
  length: number;
}

export interface FacadeExposure extends Facade {
  /** Total hours of direct sunlight */
  sunlightHours: number;
}

const DIRECTIONS = [
  { label: "N", min: 337.5, max: 360 },
  { label: "N", min: 0, max: 22.5 },
  { label: "NE", min: 22.5, max: 67.5 },
  { label: "E", min: 67.5, max: 112.5 },
  { label: "SE", min: 112.5, max: 157.5 },
  { label: "S", min: 157.5, max: 202.5 },
  { label: "SW", min: 202.5, max: 247.5 },
  { label: "W", min: 247.5, max: 292.5 },
  { label: "NW", min: 292.5, max: 337.5 },
];

function normalToDirection(nx: number, nz: number): string {
  // Convert normal to compass bearing in degrees.
  // Our coordinate system: +X = east, -Z = north
  // atan2(nx, -nz) gives angle from north, clockwise
  let angleDeg = (Math.atan2(nx, -nz) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;

  for (const d of DIRECTIONS) {
    if (angleDeg >= d.min && angleDeg < d.max) return d.label;
  }
  return "N";
}

/** Extract facades (edges) from a building footprint with outward normals */
export function extractFacades(building: ProjectedBuilding): Facade[] {
  const fp = building.footprint;
  const n = fp.length;
  if (n < 3) return [];

  // Determine winding order via signed area
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += fp[i][0] * fp[j][1] - fp[j][0] * fp[i][1];
  }
  // If signedArea > 0, winding is CCW in XZ; outward normal is (dz, -dx) / len
  // If signedArea < 0, winding is CW; outward normal is (-dz, dx) / len
  const ccw = signedArea > 0;

  const facades: Facade[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = fp[j][0] - fp[i][0];
    const dz = fp[j][1] - fp[i][1];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) continue; // skip degenerate edges

    const nx = ccw ? dz / len : -dz / len;
    const nz = ccw ? -dx / len : dx / len;

    facades.push({
      start: fp[i],
      end: fp[j],
      midpoint: [(fp[i][0] + fp[j][0]) / 2, (fp[i][1] + fp[j][1]) / 2],
      normal: [nx, nz],
      direction: normalToDirection(nx, nz),
      length: len,
    });
  }

  return facades;
}

/**
 * Compute sun direction as [dx, dz] unit vector on the XZ plane
 * pointing FROM the facade TOWARD the sun (matching our coordinate system).
 *
 * SunCalc azimuth: 0=south, positive=westward
 * Our coords: +X=east, +Z=south
 */
function sunXZ(azimuth: number): [number, number] {
  return [-Math.sin(azimuth), Math.cos(azimuth)];
}

/**
 * Compute sunlight exposure hours for each facade of a building.
 * Samples every 15 minutes from sunrise to sunset.
 */
export function computeFacadeExposure(
  building: ProjectedBuilding,
  center: LatLng,
  date: Date
): FacadeExposure[] {
  const facades = extractFacades(building);
  if (facades.length === 0) return [];

  // Get sunrise/sunset for this date
  const times = SunCalc.getTimes(date, center.lat, center.lng);
  const sunrise = times.sunrise.getTime();
  const sunset = times.sunset.getTime();

  if (isNaN(sunrise) || isNaN(sunset) || sunset <= sunrise) {
    return facades.map((f) => ({ ...f, sunlightHours: 0 }));
  }

  const SAMPLE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  const sampleHours = SAMPLE_INTERVAL_MS / (3600 * 1000);

  // Pre-compute sun directions for all sample times
  const sunSamples: { altitude: number; dx: number; dz: number }[] = [];
  for (let t = sunrise; t <= sunset; t += SAMPLE_INTERVAL_MS) {
    const pos = SunCalc.getPosition(new Date(t), center.lat, center.lng);
    if (pos.altitude > 0) {
      const [dx, dz] = sunXZ(pos.azimuth);
      sunSamples.push({ altitude: pos.altitude, dx, dz });
    }
  }

  return facades.map((facade) => {
    let exposure = 0;
    const [nx, nz] = facade.normal;

    for (const sample of sunSamples) {
      // Dot product of facade normal with sun direction on XZ plane
      const dot = nx * sample.dx + nz * sample.dz;
      if (dot > 0) {
        // Facade faces toward the sun; weight by how direct the light is
        exposure += dot * sampleHours;
      }
    }

    return { ...facade, sunlightHours: exposure };
  });
}
