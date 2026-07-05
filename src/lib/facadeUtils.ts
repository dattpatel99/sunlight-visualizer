import SunCalc from "suncalc";
import type { LatLng, ProjectedBuilding } from "../types";

/** Approximate solar constant at sea level, clear sky, perpendicular to sun (W/m²) */
export const SOLAR_CONSTANT = 1000;

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
  /**
   * Effective sunlit hours — kept for backward compatibility.
   * Now derived from dailyEnergy / SOLAR_CONSTANT.
   */
  sunlightHours: number;
  /** Instantaneous direct irradiance at the given moment (W/m²) */
  intensity?: number;
  /**
   * Integrated daily direct radiant energy per unit facade area (Wh/m²/day).
   * Derived from summing DNI × cosTheta × dt over all daylight samples.
   */
  dailyEnergy?: number;
  /**
   * Cosine of the angle between the facade normal and sun direction (0–1).
   * 1 = sun directly perpendicular to facade; 0 = sun grazing or behind facade.
   */
  cosTheta?: number;
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

export function normalToDirection(nx: number, nz: number): string {
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
 * Merge facades that face the same cardinal direction into single entries,
 * using length-weighted average normals. This collapses 12-16 polygon edges
 * into 4-8 meaningful wall directions.
 */
function mergeFacadesByDirection(facades: Facade[]): Facade[] {
  const groups = new Map<string, Facade[]>();
  for (const f of facades) {
    const existing = groups.get(f.direction);
    if (existing) {
      existing.push(f);
    } else {
      groups.set(f.direction, [f]);
    }
  }

  const merged: Facade[] = [];
  for (const [direction, group] of groups) {
    const totalLength = group.reduce((sum, f) => sum + f.length, 0);
    // Length-weighted average normal
    let wnx = 0;
    let wnz = 0;
    for (const f of group) {
      wnx += f.normal[0] * f.length;
      wnz += f.normal[1] * f.length;
    }
    const nLen = Math.sqrt(wnx * wnx + wnz * wnz);
    const nx = nLen > 0 ? wnx / nLen : 0;
    const nz = nLen > 0 ? wnz / nLen : 0;

    // Use the longest segment's start/end as representative
    const longest = group.reduce((a, b) => (b.length > a.length ? b : a));

    merged.push({
      start: longest.start,
      end: longest.end,
      midpoint: longest.midpoint,
      normal: [nx, nz],
      direction,
      length: totalLength,
    });
  }

  // Sort by compass order: N, NE, E, SE, S, SW, W, NW
  const order = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  merged.sort((a, b) => order.indexOf(a.direction) - order.indexOf(b.direction));

  return merged;
}

/**
 * Compute sunlight exposure, instantaneous irradiance, and daily energy
 * per cardinal direction for a building.
 *
 * @param building     - the projected building
 * @param center       - lat/lng center for sun calculations
 * @param date         - date for analysis (time-of-day used for current intensity)
 * @param currentTime  - optional explicit time for instantaneous intensity.
 *                       Defaults to the time component of `date`.
 */
export function computeFacadeExposure(
  building: ProjectedBuilding,
  center: LatLng,
  date: Date,
  currentTime?: Date
): FacadeExposure[] {
  const rawFacades = extractFacades(building);
  if (rawFacades.length === 0) return [];

  const facades = mergeFacadesByDirection(rawFacades);

  // Get sunrise/sunset for this date (at noon for day-length)
  const analysisDate = new Date(date);
  analysisDate.setHours(12, 0, 0, 0);
  const times = SunCalc.getTimes(analysisDate, center.lat, center.lng);
  const sunrise = times.sunrise.getTime();
  const sunset = times.sunset.getTime();

  if (isNaN(sunrise) || isNaN(sunset) || sunset <= sunrise) {
    return facades.map((f) => ({
      ...f,
      sunlightHours: 0,
      intensity: 0,
      dailyEnergy: 0,
      cosTheta: 0,
    }));
  }

  const SAMPLE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  const sampleHours = SAMPLE_INTERVAL_MS / (3600 * 1000);

  // Pre-compute sun data for all sample times (altitude + XZ direction)
  const sunSamples: { altitude: number; dx: number; dz: number }[] = [];
  for (let t = sunrise; t <= sunset; t += SAMPLE_INTERVAL_MS) {
    const pos = SunCalc.getPosition(new Date(t), center.lat, center.lng);
    if (pos.altitude > 0) {
      const [dx, dz] = sunXZ(pos.azimuth);
      sunSamples.push({ altitude: pos.altitude, dx, dz });
    }
  }

  // Compute instantaneous intensity at currentTime (or date's time)
  const instant = currentTime ?? date;
  const instantPos = SunCalc.getPosition(instant, center.lat, center.lng);
  const instantAltitude = instantPos.altitude;
  const instantDNI =
    instantAltitude > 0 ? SOLAR_CONSTANT * Math.sin(instantAltitude) : 0;
  const [instantDx, instantDz] = sunXZ(instantPos.azimuth);

  return facades.map((facade) => {
    const [nx, nz] = facade.normal;

    // Instantaneous values at current time
    const cosThetaInstant = Math.max(0, nx * instantDx + nz * instantDz);
    const intensity = instantDNI * cosThetaInstant;

    // Daily energy integration: sum DNI × cosTheta × dt over all samples
    let dailyEnergy = 0;
    for (const sample of sunSamples) {
      const cosTheta = nx * sample.dx + nz * sample.dz;
      if (cosTheta > 0) {
        const dni = SOLAR_CONSTANT * Math.sin(sample.altitude);
        dailyEnergy += dni * cosTheta * sampleHours;
      }
    }

    // Backward-compat sunlightHours derived from energy
    const sunlightHours = dailyEnergy / SOLAR_CONSTANT;
    // cosTheta at current time for display
    const cosTheta = cosThetaInstant;

    return { ...facade, sunlightHours, intensity, dailyEnergy, cosTheta };
  });
}
