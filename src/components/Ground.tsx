import { useEffect, useState } from "react";
import * as THREE from "three";
import type { LatLng } from "../types";
import { fetchTileGrid, type TileGrid } from "../lib/mapTiles";
import { GROUND_SIZE } from "../constants";

interface GroundProps {
  center: LatLng | null;
}

export function Ground({ center }: GroundProps) {
  const [tileGrid, setTileGrid] = useState<TileGrid | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!center) return;
    let cancelled = false;

    const gridSize = 5; // 5×5 = 25 tiles (reduced from 7×7=49 for fast first paint)

    fetchTileGrid(center, gridSize, (_loaded, _total) => {
      // Progress tracked inside mapTiles for potential loading indicator;
      // ground renders progressively without needing this value in state.
    }).then((grid) => {
      if (cancelled) return;
      setTileGrid(grid);
      // Lazily create texture only after grid data is ready
      const loader = new THREE.TextureLoader();
      loader.load(grid.imageUrl, (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        setTexture(tex);
      });
    });

    return () => { cancelled = true; };
  }, [center]);

  return (
    <group>
      {/* OSM-tiled ground — shows grey fallback until first tiles load */}
      {tileGrid && texture ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-tileGrid.offsetX, -0.02, -tileGrid.offsetZ]}
          receiveShadow
        >
          <planeGeometry args={[tileGrid.widthMeters, tileGrid.heightMeters]} />
          <meshStandardMaterial map={texture} transparent opacity={0.85} />
        </mesh>
      ) : (
        // Non-blocking fallback while tiles load — no spinner, just neutral ground
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
          <meshStandardMaterial color="#d4dbc8" />
        </mesh>
      )}
      {/* Extended ground for shadows beyond tile area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#d4dbc8" />
      </mesh>
    </group>
  );
}
