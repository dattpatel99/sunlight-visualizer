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
  /** Peak instantaneous irradiance across all facades (W/m²) */
  peakIntensity: number;
  /** Total daily radiant energy across all facades, averaged per facade (Wh/m²/day) */
  avgDailyEnergy: number;
  /** Facade with the highest daily energy potential */
  bestEnergyFacade: { direction: string; energy: number } | null;
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

    const peakIntensity = Math.max(...facades.map((f) => f.intensity ?? 0));
    const avgDailyEnergy = facades.reduce((sum, f) => sum + (f.dailyEnergy ?? 0), 0) / facades.length;
    const byEnergy = [...facades].sort((a, b) => (b.dailyEnergy ?? 0) - (a.dailyEnergy ?? 0));
    const bestEnergyFacade = (byEnergy[0].dailyEnergy ?? 0) > 0
      ? { direction: byEnergy[0].direction, energy: byEnergy[0].dailyEnergy as number }
      : null;

    return {
      sunrise,
      sunset,
      daylightHours,
      bestFacade,
      worstFacade,
      avgExposure,
      totalFacades: facades.length,
      peakIntensity,
      avgDailyEnergy,
      bestEnergyFacade,
    };
  }

  return {
    sunrise,
    sunset,
    daylightHours,
    bestFacade,
    worstFacade,
    avgExposure,
    totalFacades: facades.length,
    peakIntensity: 0,
    avgDailyEnergy: 0,
    bestEnergyFacade: null,
  };
}
