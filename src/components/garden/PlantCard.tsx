import type { PlantScore } from "../../lib/gardener/plantDatabase";
import { colors, radius, font, space } from "../../theme";

interface PlantCardProps {
  score: PlantScore;
  expanded: boolean;
  onToggle: () => void;
}

function scoreColor(score: number, fallback: boolean): string {
  if (fallback || score < 55) return colors.warn;
  return colors.leafDeep;
}

const waterLabel = { low: "💧 low", moderate: "💧 moderate", high: "💧 high" } as const;

export function PlantCard({ score, expanded, onToggle }: PlantCardProps) {
  const { plant, reasons, sunShortfall } = score;
  const pct = `${score.score}%`;
  const fallback = sunShortfall || score.score < 55;

  return (
    <div
      data-testid={`plant-card-${plant.id}`}
      data-fallback={fallback ? "true" : "false"}
      style={{
        border: `1.5px solid ${fallback ? "#ccc" : colors.ink}`,
        borderRadius: radius.card,
        background: expanded ? "#fbfdfb" : colors.surface,
        fontFamily: font.ui,
        opacity: fallback && !expanded ? 0.78 : 1,
      }}
    >
      {/* Header (click to expand) */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          font: "inherit",
        }}
      >
        <span style={{ fontSize: 26 }} aria-hidden>
          {plant.emoji}
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: colors.ink }}>{plant.name}</span>
          <span style={{ display: "block", fontSize: 11, color: colors.inkSoft }}>
            {plant.benefits.slice(0, 2).map((b) => `${b}`).join(" · ") || plant.category}
            {plant.indoorSuitable ? " · 🏢 indoor" : ""}
            {` · ${plant.maintenance} upkeep`}
          </span>
        </span>
        <span style={{ textAlign: "right" }}>
          <span
            data-testid="plant-score"
            style={{ fontSize: 16, fontWeight: 700, color: scoreColor(score.score, fallback), display: "block" }}
          >
            {pct}
          </span>
          <span style={{ fontSize: 13, color: "#bbb" }}>{expanded ? "▴" : "▾"}</span>
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: `0 10px 10px`, display: "flex", flexDirection: "column", gap: space.sm }}>
          {/* benefit + trait chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {plant.benefits.map((b) => (
              <span key={b} style={miniChip(colors.leafSoft)}>
                {b}
              </span>
            ))}
            {plant.indoorSuitable && <span style={miniChip("#eee")}>🏢 indoor-ok</span>}
            {plant.toxic && <span style={miniChip("#eee")}>🚫 toxic to pets</span>}
          </div>

          {/* trait lines */}
          <div style={{ fontSize: 11, color: colors.inkSoft, lineHeight: 1.6 }}>
            ☀️ needs {plant.minDirectSunHours}h+
            {plant.maxDirectSunHours != null ? `–${plant.maxDirectSunHours}h` : ""} &nbsp; {waterLabel[plant.waterNeeds]}
            <br />
            🌡️ heat {plant.heatTolerance} · frost {plant.frostTolerance}
            <br />
            ⏱️ {plant.daysToHarvest && plant.daysToHarvest < 999 ? `~${plant.daysToHarvest} days to harvest` : "foliage — no harvest"}
          </div>

          {plant.notes && (
            <div style={{ fontSize: 11, color: colors.inkSoft, fontStyle: "italic" }}>{plant.notes}</div>
          )}

          {/* why this scored X% */}
          <div
            style={{
              padding: space.sm,
              background: colors.canvas,
              border: `1px dashed #b9c4b9`,
              borderRadius: 6,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>💡 why this scored {pct}</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: colors.inkSoft }}>
              {reasons.map((r, i) => (
                <li key={i} style={{ color: r.delta < 0 ? colors.warn : colors.inkSoft }}>
                  {r.label} <span style={{ color: "#aaa" }}>({r.delta > 0 ? "+" : ""}{r.delta})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function miniChip(bg: string): React.CSSProperties {
  return {
    fontSize: 10,
    padding: "3px 7px",
    background: bg,
    borderRadius: 10,
    whiteSpace: "nowrap",
  };
}
