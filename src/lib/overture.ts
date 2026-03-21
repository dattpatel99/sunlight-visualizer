import { PMTiles } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";
import type { LatLng, BuildingData } from "../types";
import { DEFAULT_BUILDING_HEIGHT, METERS_PER_LEVEL } from "../constants";

const OVERTURE_BUILDINGS_URL =
  "https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2026-02-18/buildings.pmtiles";

let pmtilesInstance: PMTiles | null = null;

function getPMTiles(): PMTiles {
  if (!pmtilesInstance) {
    pmtilesInstance = new PMTiles(OVERTURE_BUILDINGS_URL);
  }
  return pmtilesInstance;
}

/** Convert lat/lng to tile x/y at a given zoom */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/** Get all tile coordinates that overlap a bounding box at the given zoom */
function getTilesForBbox(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  zoom: number
): { x: number; y: number; z: number }[] {
  const topLeft = latLngToTile(maxLat, minLng, zoom);
  const bottomRight = latLngToTile(minLat, maxLng, zoom);
  const tiles: { x: number; y: number; z: number }[] = [];
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

/** Compute bounding box from center + radius in meters */
function bboxFromCenter(center: LatLng, radius: number) {
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos((center.lat * Math.PI) / 180));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

function parseHeight(properties: Record<string, string | number | boolean>): number {
  // Overture schema: height (meters), num_floors
  if (properties.height != null) {
    const h = Number(properties.height);
    if (!isNaN(h) && h > 0) return h;
  }
  if (properties.num_floors != null) {
    const floors = Number(properties.num_floors);
    if (!isNaN(floors) && floors > 0) return floors * METERS_PER_LEVEL;
  }
  return DEFAULT_BUILDING_HEIGHT;
}

/**
 * Fetch buildings from Overture Maps PMTiles within a radius of center.
 * Uses zoom level 14 which balances detail vs number of tiles to fetch.
 */
export async function fetchOvertureBuildings(
  center: LatLng,
  radius: number
): Promise<BuildingData[]> {
  const pmtiles = getPMTiles();
  const bbox = bboxFromCenter(center, radius);
  const zoom = 14;
  const tiles = getTilesForBbox(bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng, zoom);

  const buildings: BuildingData[] = [];
  const seenIds = new Set<number>();

  // Fetch all tiles in parallel
  const tileResults = await Promise.all(
    tiles.map(async (t) => {
      try {
        const resp = await pmtiles.getZxy(t.z, t.x, t.y);
        if (!resp) return null;
        return { tile: t, data: resp.data };
      } catch {
        return null;
      }
    })
  );

  for (const result of tileResults) {
    if (!result) continue;
    const { tile, data } = result;

    const pbf = new Pbf(new Uint8Array(data));
    const vt = new VectorTile(pbf);

    // Overture buildings PMTiles has a "building" layer
    const layer = vt.layers["building"];
    if (!layer) continue;

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      if (feature.type !== 3) continue; // 3 = Polygon

      // Deduplicate across tile boundaries
      const id = feature.id || i + tile.x * 100000 + tile.y * 1000000000;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      // Convert to GeoJSON to get lng/lat coordinates
      const geojson = feature.toGeoJSON(tile.x, tile.y, tile.z);
      if (geojson.geometry.type !== "Polygon") continue;

      const coords = geojson.geometry.coordinates[0]; // outer ring
      if (!coords || coords.length < 4) continue;

      // Filter: only include buildings whose centroid is within the bbox
      let sumLng = 0;
      let sumLat = 0;
      for (const [lng, lat] of coords) {
        sumLng += lng;
        sumLat += lat;
      }
      const centLng = sumLng / coords.length;
      const centLat = sumLat / coords.length;

      if (
        centLat < bbox.minLat ||
        centLat > bbox.maxLat ||
        centLng < bbox.minLng ||
        centLng > bbox.maxLng
      ) {
        continue;
      }

      // Build footprint, removing closing coordinate if it duplicates first
      const footprint: [number, number][] = coords.map(
        (c: number[]) => [c[0], c[1]] as [number, number]
      );
      const first = footprint[0];
      const last = footprint[footprint.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        footprint.pop();
      }

      if (footprint.length >= 3) {
        buildings.push({
          id: typeof id === "number" ? id : i,
          footprint,
          height: parseHeight(feature.properties),
        });
      }
    }
  }

  return buildings;
}
