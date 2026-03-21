import { useState, useCallback } from "react";
import type { LatLng, BuildingData, ProjectedBuilding } from "../types";
import { fetchBuildings } from "../lib/overpass";
import { projectBuildings } from "../lib/projection";

interface UseBuildingsResult {
  buildings: ProjectedBuilding[];
  rawBuildings: BuildingData[];
  loading: boolean;
  error: string | null;
  load: (center: LatLng, radius: number) => void;
}

export function useBuildings(): UseBuildingsResult {
  const [buildings, setBuildings] = useState<ProjectedBuilding[]>([]);
  const [rawBuildings, setRawBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((center: LatLng, radius: number) => {
    setLoading(true);
    setError(null);

    fetchBuildings(center, radius)
      .then((data) => {
        setRawBuildings(data);
        setBuildings(projectBuildings(data, center));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load buildings");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { buildings, rawBuildings, loading, error, load };
}
