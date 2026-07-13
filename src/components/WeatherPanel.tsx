/**
 * WeatherPanel — always-visible sidebar widget showing current conditions
 * and a 5-day forecast. Fetches + caches from Open-Meteo via weatherService.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { fetchWeather, type WeatherData } from "../lib/gardener/weatherService";
import type { LatLng } from "../types";

interface WeatherPanelProps {
  location: LatLng | null;
  /** Selected date in the app — weather will be shown for this date */
  date?: Date;
}

export function WeatherPanel({ location, date }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (loc: LatLng) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(loc);
      setWeather(data);
    } catch (e) {
      setError("Couldn't load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) load(location);
  }, [location, load]);

  const handleRefresh = async () => {
    if (!location) return;
    setRefreshing(true);
    try {
      // Force fresh by clearing sessionStorage cache entry
      sessionStorage.removeItem("gardener_weather_cache");
      const data = await fetchWeather(location);
      setWeather(data);
    } catch {
      // ignore refresh errors
    } finally {
      setRefreshing(false);
    }
  };

  // Determine which day to display based on selected date
  const displayDay = useMemo(() => {
    if (!weather || !date) return weather?.today;

    const selectedDateStr = date.toISOString().split("T")[0];
    const match = weather.forecast.find(d => d.date === selectedDateStr);
    if (match) return match;

    // If no exact match, find nearest within ±3 days
    const selectedTime = date.getTime();
    let bestDiff = Infinity;
    let bestDay = weather.today;
    for (const day of weather.forecast) {
      const dayTime = new Date(day.date + "T12:00:00").getTime();
      const diff = Math.abs(dayTime - selectedTime);
      if (diff < bestDiff && diff < 4 * 24 * 60 * 60 * 1000) { // ±3 days
        bestDiff = diff;
        bestDay = day;
      }
    }
    return bestDay;
  }, [weather, date]);

  const displayDayIndex = weather?.forecast.findIndex(d => d.date === displayDay?.date) ?? 0;
  const isToday = displayDayIndex === 0;

  if (!location) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Weather</span>
        </div>
        <div style={placeholderStyle}>Set a location to see weather</div>
      </div>
    );
  }

  if (loading && !weather) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Weather</span>
        </div>
        <div style={loadingStyle}>Loading…</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Weather</span>
        </div>
        <div style={{ ...placeholderStyle, color: "#dc2626" }}>{error}</div>
        <button style={retryBtn} onClick={() => location && load(location)}>Retry</button>
      </div>
    );
  }

  if (!weather || !displayDay) return null;

  const { current, forecast } = weather;

  // Show forecast for selected date + next 4 days
  const forecastStartIndex = displayDayIndex;
  const forecastSlice = forecast.slice(forecastStartIndex, forecastStartIndex + 5);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Weather</span>
        <button
          style={refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh weather"
          aria-label="Refresh weather"
        >
          {refreshing ? "…" : "↻"}
        </button>
      </div>

      {/* Current + selected day */}
      <div style={currentStyle}>
        <span style={emojiStyle}>{displayDay.condition.emoji}</span>
        <div style={tempStyle}>
          <span style={bigTempStyle}>{Math.round(isToday ? current.temp : displayDay.high)}°C</span>
          <span style={condLabelStyle}>{displayDay.condition.label}</span>
        </div>
        <div style={todayStats}>
          <span>H: {Math.round(displayDay.high)}°</span>
          <span style={{ color: "#6b7280" }}>L: {Math.round(displayDay.low)}°</span>
          <span>💧 {displayDay.precipitationMm.toFixed(1)}mm</span>
        </div>
      </div>

      {/* Frost / rain warnings */}
      {displayDay.low < 2 && (
        <div style={warningStyle}>⚠️ Frost expected — cover or move frost-sensitive plants</div>
      )}
      {displayDay.precipitationMm > 5 && displayDay.low >= 2 && (
        <div style={tipStyle}>💧 Good transplanting weather — rain will settle seedlings in gently</div>
      )}

      {/* 5-day mini forecast */}
      {forecastSlice.length > 0 && (
        <div style={forecastStyle}>
          {forecastSlice.map((day) => (
            <div key={day.date} style={forecastDayStyle}>
              <span style={forecastDayLabel}>
                {new Date(day.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span style={{ fontSize: 14 }}>{day.condition.emoji}</span>
              <span style={forecastTemp}>
                {Math.round(day.high)}°<span style={{ color: "#9ca3af" }}>/{Math.round(day.low)}°</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={footerStyle}>
        Updated {new Date(weather.fetchedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: "#f0f9ff",
  borderRadius: 8,
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 2,
};

const titleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#1e40af",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const refreshBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  color: "#6b7280",
  padding: "0 4px",
  borderRadius: 4,
  lineHeight: 1,
};

const loadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  padding: "4px 0",
};

const placeholderStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  padding: "4px 0",
};

const retryBtn: React.CSSProperties = {
  fontSize: 11,
  background: "#dbeafe",
  border: "none",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
  color: "#1d4ed8",
  marginTop: 4,
  width: "fit-content",
};

const currentStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const emojiStyle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
};

const tempStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const bigTempStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#1e3a5f",
  lineHeight: 1.1,
};

const condLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#6b7280",
};

const todayStats: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  fontSize: 11,
  color: "#374151",
  gap: 1,
};

const warningStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#92400e",
  background: "#fef3c7",
  borderRadius: 4,
  padding: "3px 6px",
  lineHeight: 1.4,
};

const tipStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#065f46",
  background: "#d1fae5",
  borderRadius: 4,
  padding: "3px 6px",
  lineHeight: 1.4,
};

const forecastStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginTop: 4,
  paddingTop: 4,
  borderTop: "1px solid #e0f2fe",
  justifyContent: "space-between",
};

const forecastDayStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  flex: 1,
};

const forecastDayLabel: React.CSSProperties = {
  fontSize: 9,
  color: "#6b7280",
  fontWeight: 600,
  textTransform: "uppercase",
};

const forecastTemp: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#1e3a5f",
};

const footerStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#9ca3af",
  textAlign: "right",
  marginTop: 2,
};