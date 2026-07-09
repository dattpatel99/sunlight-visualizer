/**
 * Weather service — fetches current + forecast weather from Open-Meteo.
 * Open-Meteo is free, no API key required.
 * Results are cached in sessionStorage with a 30-minute TTL.
 */

import type { LatLng } from "../../types";

export interface WeatherCondition {
  code: number;
  label: string;
  emoji: string;
}

// WMO Weather interpretation codes → human-readable
export const WEATHER_CODES: Record<number, WeatherCondition> = {
  0:  { code: 0,  label: "Clear sky",           emoji: "☀️"  },
  1:  { code: 1,  label: "Mainly clear",         emoji: "🌤️" },
  2:  { code: 2,  label: "Partly cloudy",        emoji: "⛅"  },
  3:  { code: 3,  label: "Overcast",             emoji: "☁️"  },
  45: { code: 45, label: "Fog",                  emoji: "🌫️" },
  48: { code: 48, label: "Depositing rime fog",  emoji: "🌫️" },
  51: { code: 51, label: "Light drizzle",        emoji: "🌦️" },
  53: { code: 53, label: "Moderate drizzle",     emoji: "🌦️" },
  55: { code: 55, label: "Dense drizzle",        emoji: "🌧️" },
  61: { code: 61, label: "Slight rain",          emoji: "🌧️" },
  63: { code: 63, label: "Moderate rain",        emoji: "🌧️" },
  65: { code: 65, label: "Heavy rain",          emoji: "🌧️" },
  71: { code: 71, label: "Slight snow",          emoji: "🌨️" },
  73: { code: 73, label: "Moderate snow",        emoji: "🌨️" },
  75: { code: 75, label: "Heavy snow",          emoji: "❄️"  },
  80: { code: 80, label: "Slight rain showers",   emoji: "🌦️" },
  81: { code: 81, label: "Moderate showers",     emoji: "🌦️" },
  82: { code: 82, label: "Violent showers",      emoji: "⛈️" },
  95: { code: 95, label: "Thunderstorm",         emoji: "⛈️" },
  96: { code: 96, label: "Thunderstorm + hail",  emoji: "⛈️" },
  99: { code: 99, label: "Thunderstorm + hail", emoji: "⛈️" },
};

function getCondition(code: number): WeatherCondition {
  return WEATHER_CODES[code] ?? { code, label: "Unknown", emoji: "❓" };
}

export interface CurrentWeather {
  temp: number;          // °C
  windspeed: number;     // km/h
  isDay: boolean;
  condition: WeatherCondition;
}

export interface DayForecast {
  date: string;          // YYYY-MM-DD
  high: number;          // °C
  low: number;           // °C
  precipitationMm: number;
  condition: WeatherCondition;
}

export interface WeatherData {
  location: LatLng;
  fetchedAt: string;     // ISO
  current: CurrentWeather;
  today: DayForecast;
  forecast: DayForecast[];
  /** Derived: true if frost is expected today (low < 2°C) */
  frostToday: boolean;
  /** Derived: true if significant rain expected today (> 5mm) */
  rainyToday: boolean;
  /** Derived: UV index (if available, else -1) */
  uvIndex: number;
}

const CACHE_KEY = "gardener_weather_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedEntry {
  data: WeatherData;
  cachedAt: number;
}

function getCache(loc: LatLng): WeatherData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    const locKey = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
    const cachedLocKey = `${entry.data.location.lat.toFixed(4)},${entry.data.location.lng.toFixed(4)}`;
    if (locKey !== cachedLocKey) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function setCache(data: WeatherData): void {
  try {
    const entry: CachedEntry = { data, cachedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — fail silently
  }
}

/** Fetch weather for a given lat/lng. Cached for 30 min per location. */
export async function fetchWeather(loc: LatLng): Promise<WeatherData> {
  const cached = getCache(loc);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude:  loc.lat.toString(),
    longitude: loc.lng.toString(),
    current_weather: "true",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,uv_index_max",
    timezone:   "auto",
    forecast_days: "7",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);

  const json = await res.json();
  const cw = json.current_weather;

  const todayCode = json.daily?.weathercode?.[0] ?? cw.weathercode ?? 0;
  const todayCond = getCondition(todayCode);

  const forecast: DayForecast[] = (json.daily?.time ?? []).map(
    (date: string, i: number) => ({
      date,
      high:        json.daily.temperature_2m_max[i],
      low:         json.daily.temperature_2m_min[i],
      precipitationMm: json.daily.precipitation_sum[i] ?? 0,
      condition:   getCondition(json.daily.weathercode?.[i] ?? 0),
    })
  );

  const today = forecast[0] ?? {
    date: new Date().toISOString().split("T")[0],
    high: cw.temperature ?? 0,
    low:  cw.temperature ?? 0,
    precipitationMm: 0,
    condition: todayCond,
  };

  const uvIndex = json.daily?.uv_index_max?.[0] ?? -1;

  const data: WeatherData = {
    location: loc,
    fetchedAt: new Date().toISOString(),
    current: {
      temp:      cw.temperature ?? today.high,
      windspeed: cw.windspeed ?? 0,
      isDay:     cw.is_day ?? true,
      condition: todayCond,
    },
    today,
    forecast,
    frostToday:  (today.low ?? 0) < 2,
    rainyToday:  (today.precipitationMm ?? 0) > 5,
    uvIndex,
  };

  setCache(data);
  return data;
}

/** Returns a short one-line weather summary string for the agent prompt. */
export function weatherSummary(data: WeatherData): string {
  const { current, today, frostToday, rainyToday, uvIndex } = data;
  let summary = `Current: ${current.condition.emoji} ${current.temp}°C (${current.condition.label}) — Today: ${today.high}°C / ${today.low}°C, ${today.precipitationMm}mm rain`;
  if (frostToday)  summary += " — ⚠️ FROST expected tonight!";
  if (rainyToday)  summary += " — Good transplanting weather if you need to set out seedlings.";
  if (uvIndex > 7) summary += ` — UV index is high (${uvIndex.toFixed(0)}), sensitive plants may need afternoon shade.`;
  return summary;
}
