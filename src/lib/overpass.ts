import type { LatLng, BuildingData } from "../types";
import { DEFAULT_BUILDING_HEIGHT, METERS_PER_LEVEL, OVERPASS_RADIUS } from "../constants";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function buildQuery(center: LatLng, radius: number): string {
  return `
[out:json][timeout:25];
(
  way["building"](around:${radius},${center.lat},${center.lng});
  relation["building"](around:${radius},${center.lat},${center.lng});
);
out body;
>;
out skel qt;
`.trim();
}

function parseHeight(tags: Record<string, string>): number {
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return h;
  }
  if (tags["building:levels"]) {
    const levels = parseFloat(tags["building:levels"]);
    if (!isNaN(levels)) return levels * METERS_PER_LEVEL;
  }
  return DEFAULT_BUILDING_HEIGHT;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
  members?: { type: string; ref: number; role: string }[];
}

export async function fetchBuildings(
  center: LatLng,
  radius: number = OVERPASS_RADIUS
): Promise<BuildingData[]> {
  const query = buildQuery(center, radius);
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  const elements: OverpassElement[] = data.elements;

  // Build node lookup
  const nodes = new Map<number, [number, number]>();
  for (const el of elements) {
    if (el.type === "node" && el.lat !== undefined && el.lon !== undefined) {
      nodes.set(el.id, [el.lon, el.lat]);
    }
  }

  const buildings: BuildingData[] = [];

  for (const el of elements) {
    if (el.type === "way" && el.tags?.building && el.nodes) {
      const footprint: [number, number][] = [];
      let valid = true;
      for (const nid of el.nodes) {
        const coord = nodes.get(nid);
        if (!coord) {
          valid = false;
          break;
        }
        footprint.push(coord);
      }
      if (valid && footprint.length >= 4) {
        // Remove closing node if it duplicates the first
        const first = footprint[0];
        const last = footprint[footprint.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          footprint.pop();
        }
        if (footprint.length >= 3) {
          buildings.push({
            id: el.id,
            footprint,
            height: parseHeight(el.tags),
          });
        }
      }
    }
  }

  return buildings;
}
