import { useEffect, useMemo, useState } from "react";
import type { LatLng } from "../../types";
import type { FacadeExposure } from "../../lib/facadeUtils";
import {
  matchPlantsToFacade,
  type GardenFilter,
  type WeatherInput,
} from "../../lib/gardener/plantDatabase";
import {
  loadPreferences,
  savePreferences,
  gardenFilterFromPrefs,
  type GardenerPreferences,
} from "../../lib/gardener/userPreferences";
import { fetchWeather, type WeatherData } from "../../lib/gardener/weatherService";
import { OverlayPanel } from "../shell/OverlayPanel";
import { WeatherStrip } from "./WeatherStrip";
import { GardenFilters } from "./GardenFilters";
import { PlantCard } from "./PlantCard";
import { colors, space } from "../../theme";

interface GardenDrawerProps {
  location: LatLng | null;
  facades: FacadeExposure[];
  selectedFacade: string | null;
  onClose: () => void;
}

function toWeatherInput(w: WeatherData): WeatherInput {
  return {
    currentTemp: w.current.temp,
    todayHigh: w.today.high,
    todayLow: w.today.low,
    frostToday: w.frostToday,
    rainyToday: w.rainyToday,
    uvIndex: w.uvIndex,
  };
}

export function GardenDrawer({ location, facades, selectedFacade, onClose }: GardenDrawerProps) {
  const [prefs] = useState<GardenerPreferences>(() => loadPreferences());
  const [filter, setFilter] = useState<GardenFilter>(() => gardenFilterFromPrefs(prefs));
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!location) return;
    setWeatherLoading(true);
    fetchWeather(location)
      .then((w) => !cancelled && setWeather(w))
      .catch(() => !cancelled && setWeather(null))
      .finally(() => !cancelled && setWeatherLoading(false));
    return () => {
      cancelled = true;
    };
  }, [location]);

  const updateFilter = (next: GardenFilter) => {
    setFilter(next);
    savePreferences({
      homeType: next.location,
      benefitGoals: next.benefits,
      maintenancePriority: next.maintenancePriority,
    });
  };

  // The facade we're advising on: the selected one, else the sunniest.
  const focusFacade = useMemo(() => {
    if (facades.length === 0) return null;
    if (selectedFacade) {
      const sel = facades.find((f) => f.direction === selectedFacade);
      if (sel) return sel;
    }
    return [...facades].sort((a, b) => b.sunlightHours - a.sunlightHours)[0];
  }, [facades, selectedFacade]);

  const weatherInput = weather ? toWeatherInput(weather) : null;

  const scored = useMemo(() => {
    if (!focusFacade) return [];
    return matchPlantsToFacade(
      { direction: focusFacade.direction, sunlightHours: focusFacade.sunlightHours },
      weatherInput,
      prefs,
      filter,
      12
    );
  }, [focusFacade, weatherInput, prefs, filter]);

  const usingSunniest = focusFacade != null && focusFacade.direction !== selectedFacade;

  return (
    <OverlayPanel
      title="Garden fit"
      emoji="🌿"
      onClose={onClose}
      testId="garden-drawer"
      style={{ position: "absolute", top: 16, right: 16, bottom: 16, width: 300 }}
    >
      <GardenFilters filter={filter} onChange={updateFilter} />

      <WeatherStrip weather={weather} loading={weatherLoading} />

      {focusFacade ? (
        <>
          <div style={{ fontSize: 11, color: colors.inkSoft }}>
            {usingSunniest
              ? `Showing picks for your sunniest wall (${focusFacade.direction} · ${focusFacade.sunlightHours.toFixed(1)}h). Select a wall for a specific one.`
              : `Tailored to your ${focusFacade.direction} wall · ${focusFacade.sunlightHours.toFixed(1)}h sun.`}
          </div>
          {scored.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
              {scored.map((s) => (
                <PlantCard
                  key={s.plant.id}
                  score={s}
                  expanded={expandedId === s.plant.id}
                  onToggle={() => setExpandedId(expandedId === s.plant.id ? null : s.plant.id)}
                />
              ))}
            </div>
          ) : (
            <div
              data-testid="garden-no-matches"
              style={{ fontSize: 13, color: colors.inkSoft, padding: "10px 0", lineHeight: 1.5 }}
            >
              🌿 No plants match these filters. Try removing a benefit, switching to Home, or turning
              off Low-effort.
            </div>
          )}
        </>
      ) : (
        <div
          data-testid="garden-empty"
          style={{ fontSize: 13, color: colors.inkSoft, padding: "8px 0", lineHeight: 1.5 }}
        >
          🌱 Load a location and select a building wall, and I'll match plants to its sun, your
          weather, and the filters above.
        </div>
      )}
    </OverlayPanel>
  );
}
