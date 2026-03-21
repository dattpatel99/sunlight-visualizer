import { useMemo } from "react";
import type { LatLng, ProjectedBuilding } from "../types";
import { computeFacadeExposure, type FacadeExposure } from "../lib/facadeUtils";

export function useFacadeAnalysis(
  building: ProjectedBuilding | null,
  center: LatLng,
  date: Date
): FacadeExposure[] {
  return useMemo(() => {
    if (!building) return [];
    // Use noon of the selected date for the day-long analysis
    const analysisDate = new Date(date);
    analysisDate.setHours(12, 0, 0, 0);
    return computeFacadeExposure(building, center, analysisDate);
  }, [building, center, date]);
}
