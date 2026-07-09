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
 *
 * Progressive: yields partial results as tiles arrive so the ground
 * plane can render incrementally instead of waiting for all 25–49 tiles.
 */
export async function fetchTileGrid(
  center: LatLng,
  gridSize: number = 5, // NxN tiles (reduced from 7 for faster initial paint)
  onTileLoaded?: (index: number, total: number) => void
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

  const total = gridSize * gridSize;
  let loaded = 0;

  // Fetch tiles sequentially in small batches to avoid connection-limit
  // starvation of other resources (PMTiles, React waterfill).
  // Browser max connections ~6 per domain; load 6 at a time.
  const BATCH_SIZE = 6;
  const tiles: { tx: number; ty: number; px: number; py: number }[] = [];

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      tiles.push({
        tx: centerTile.x + dx,
        ty: centerTile.y + dy,
        px: (dx + half) * TILE_SIZE,
        py: (dy + half) * TILE_SIZE,
      });
    }
  }

  for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
    const batch = tiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(
        (t) =>
          new Promise<void>((resolve) => {
            const url = `https://tile.openstreetmap.org/${zoom}/${t.tx}/${t.ty}.png`;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              ctx.drawImage(img, t.px, t.py);
              URL.revokeObjectURL(img.src);
              loaded++;
              onTileLoaded?.(loaded, total);
              resolve();
            };
            img.onerror = () => {
              // Silently skip failed tiles — show partial grid rather than nothing
              loaded++;
              onTileLoaded?.(loaded, total);
              resolve();
            };
            img.src = url;
          })
      )
    );
    // Yield to browser between batches so React renders can interleave
    await new Promise((r) => setTimeout(r, 0));
  }

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
