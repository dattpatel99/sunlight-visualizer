import SunCalc from "suncalc";
import type { LatLng } from "../types";
import type { FacadeExposure } from "./facadeUtils";

export interface SunlightStats {
  sunrise: string; // HH:MM
  sunset: string;
  daylightHours: number;
  bestFacade: { direction: string; hours: number } | null;
  worstFacade: { direction: string; hours: number } | null;
  avgExposure: number;
  totalFacades: number;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function computeSunlightStats(
  center: LatLng,
  date: Date,
  facades: FacadeExposure[]
): SunlightStats {
  const analysisDate = new Date(date);
  analysisDate.setHours(12, 0, 0, 0);
  const times = SunCalc.getTimes(analysisDate, center.lat, center.lng);

  const sunrise = isNaN(times.sunrise.getTime()) ? "--:--" : formatTime(times.sunrise);
  const sunset = isNaN(times.sunset.getTime()) ? "--:--" : formatTime(times.sunset);
  const daylightMs = times.sunset.getTime() - times.sunrise.getTime();
  const daylightHours = isNaN(daylightMs) ? 0 : daylightMs / 3600000;

  let bestFacade: SunlightStats["bestFacade"] = null;
  let worstFacade: SunlightStats["worstFacade"] = null;
  let avgExposure = 0;

  if (facades.length > 0) {
    const sorted = [...facades].sort((a, b) => b.sunlightHours - a.sunlightHours);
    bestFacade = { direction: sorted[0].direction, hours: sorted[0].sunlightHours };
    worstFacade = {
      direction: sorted[sorted.length - 1].direction,
      hours: sorted[sorted.length - 1].sunlightHours,
    };
    avgExposure = facades.reduce((sum, f) => sum + f.sunlightHours, 0) / facades.length;
  }

  return {
    sunrise,
    sunset,
    daylightHours,
    bestFacade,
    worstFacade,
    avgExposure,
    totalFacades: facades.length,
  };
}
