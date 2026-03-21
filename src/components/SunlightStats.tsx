import type { SunlightStats } from "../lib/sunlightStats";

interface SunlightStatsProps {
  stats: SunlightStats;
}

export function SunlightStatsPanel({ stats }: SunlightStatsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>Sunlight Summary</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Sunrise</span>
        <span>{stats.sunrise}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Sunset</span>
        <span>{stats.sunset}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Daylight</span>
        <span>{stats.daylightHours.toFixed(1)}h</span>
      </div>
      {stats.bestFacade && (
        <div style={rowStyle}>
          <span style={labelStyle}>Best wall</span>
          <span>
            {stats.bestFacade.direction} ({stats.bestFacade.hours.toFixed(1)}h)
          </span>
        </div>
      )}
      {stats.worstFacade && (
        <div style={rowStyle}>
          <span style={labelStyle}>Worst wall</span>
          <span>
            {stats.worstFacade.direction} ({stats.worstFacade.hours.toFixed(1)}h)
          </span>
        </div>
      )}
      {stats.totalFacades > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Avg exposure</span>
          <span>{stats.avgExposure.toFixed(1)}h</span>
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  color: "#888",
};
