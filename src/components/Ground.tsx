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

    fetchTileGrid(center, 7).then((grid) => {
      if (cancelled) return;
      setTileGrid(grid);
      const loader = new THREE.TextureLoader();
      loader.load(grid.imageUrl, (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      });
    });

    return () => { cancelled = true; };
  }, [center]);

  return (
    <group>
      {/* Textured map tile ground */}
      {tileGrid && texture && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-tileGrid.offsetX, -0.02, -tileGrid.offsetZ]}
          receiveShadow
        >
          <planeGeometry args={[tileGrid.widthMeters, tileGrid.heightMeters]} />
          <meshStandardMaterial map={texture} transparent opacity={0.85} />
        </mesh>
      )}
      {/* Fallback / extended ground for shadows beyond tile area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#d4dbc8" />
      </mesh>
    </group>
  );
}
