import type { WeatherData } from "../../lib/gardener/weatherService";
import { colors, radius, font } from "../../theme";

interface WeatherStripProps {
  weather: WeatherData | null;
  loading?: boolean;
}

/** Compact one-line weather summary for the top of the garden drawer. */
export function WeatherStrip({ weather, loading }: WeatherStripProps) {
  if (loading && !weather) {
    return <div style={{ ...box, color: colors.inkFaint }}>Loading weather…</div>;
  }
  if (!weather) {
    return <div style={{ ...box, color: colors.inkFaint }}>Set a location for weather-aware picks</div>;
  }
  const { current, today, frostToday, uvIndex } = weather;
  return (
    <div data-testid="weather-strip" style={box}>
      <span style={{ fontSize: 22 }}>
        {current.condition.emoji} {Math.round(current.temp)}°
      </span>
      <span style={{ fontSize: 12, color: colors.inkSoft, textAlign: "right", lineHeight: 1.4 }}>
        H{Math.round(today.high)} L{Math.round(today.low)} · {frostToday ? "frost ❄️" : "no frost"}
        <br />
        UV {uvIndex < 0 ? "—" : Math.round(uvIndex)} · {weather.rainyToday ? "rain 🌧️" : "dry"}
      </span>
    </div>
  );
}

const box: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  background: colors.canvas,
  border: `1px dashed #b9c4b9`,
  borderRadius: radius.card,
  fontFamily: font.ui,
};
