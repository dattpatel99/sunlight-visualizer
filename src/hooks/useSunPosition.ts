import { useMemo } from "react";
import SunCalc from "suncalc";
import type { LatLng, SunPositionData } from "../types";

export function useSunPosition(
  center: LatLng,
  date: Date
): SunPositionData {
  return useMemo(() => {
    const pos = SunCalc.getPosition(date, center.lat, center.lng);
    return {
      azimuth: pos.azimuth,
      altitude: pos.altitude,
      isNight: pos.altitude < 0,
    };
  }, [center.lat, center.lng, date]);
}
