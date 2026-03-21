import type { LatLng } from "../types";

const TILE_SIZE = 256; // px per tile

/** Convert lat/lng to integer tile coordinates */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Convert lat/lng to fractional tile coordinates (for precise sub-tile positioning) */
function latLngToTileExact(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/** Meters per pixel at a given latitude and zoom level */
function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

export interface TileGrid {
  /** The composite image as a data URL */
  imageUrl: string;
  /** Width of the ground plane in meters */
  widthMeters: number;
  /** Height of the ground plane in meters */
  heightMeters: number;
  /** Offset of center from the grid center, in meters [x, z] */
  offsetX: number;
  offsetZ: number;
}

/**
 * Fetch a grid of OSM tiles around a center point and composite them
 * into a single image. Returns sizing info in meters for positioning
 * the ground plane.
 */
export async function fetchTileGrid(
  center: LatLng,
  gridSize: number = 5 // NxN tiles
): Promise<TileGrid> {
  const zoom = 17; // ~1.2m/px, good detail for buildings
  const centerTile = latLngToTile(center.lat, center.lng, zoom);
  const half = Math.floor(gridSize / 2);

  const mpp = metersPerPixel(center.lat, zoom);
  const tileMeters = TILE_SIZE * mpp;

  // Compute offset entirely in Mercator pixel space to avoid
  // equirectangular vs Mercator mismatch.
  // Fractional tile position of the actual center point:
  const exact = latLngToTileExact(center.lat, center.lng, zoom);
  // The grid center is at the center of the center tile (tile + 0.5):
  const fracX = exact.x - centerTile.x - 0.5; // -0.5..+0.5
  const fracY = exact.y - centerTile.y - 0.5;
  // Convert pixel offset to meters. Tile +Y = south = our +Z.
  const offsetX = fracX * TILE_SIZE * mpp;
  const offsetZ = fracY * TILE_SIZE * mpp;

  // Create canvas for compositing
  const totalPx = gridSize * TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = totalPx;
  canvas.height = totalPx;
  const ctx = canvas.getContext("2d")!;

  // Fetch all tiles in parallel
  const promises: Promise<void>[] = [];
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const tx = centerTile.x + dx;
      const ty = centerTile.y + dy;
      const url = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      const px = (dx + half) * TILE_SIZE;
      const py = (dy + half) * TILE_SIZE;

      promises.push(
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, px, py);
            resolve();
          };
          img.onerror = () => resolve(); // skip failed tiles
          img.src = url;
        })
      );
    }
  }

  await Promise.all(promises);
  const imageUrl = canvas.toDataURL();
  const totalMeters = gridSize * tileMeters;

  return {
    imageUrl,
    widthMeters: totalMeters,
    heightMeters: totalMeters,
    offsetX,
    offsetZ,
  };
}
