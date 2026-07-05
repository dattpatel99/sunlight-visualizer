import type { FacadeExposure } from "../lib/facadeUtils";

interface FacadeAnalysisProps {
  facades: FacadeExposure[];
  selectedDirection: string | null;
  onSelectDirection: (direction: string | null) => void;
}

/** Color for a given instantaneous irradiance (W/m²) */
function intensityColor(watts: number): string {
  if (watts <= 0) return "#6699cc";
  // Three-stop gradient: blue → yellow → orange
  const t = Math.min(watts / 700, 1);
  let r: number, g: number, b: number;
  if (t < 0.5) {
    // blue (#6699cc, 102,153,204) → yellow (#ffd700, 255,215,0)
    const u = t * 2;
    r = Math.round(102 + u * (255 - 102));
    g = Math.round(153 + u * (215 - 153));
    b = Math.round(204 + u * (0 - 204));
  } else {
    // yellow (#ffd700) → orange (#ff6600)
    const u = (t - 0.5) * 2;
    r = Math.round(255 + u * (255 - 255));
    g = Math.round(215 - u * 215);
    b = Math.round(0 + u * (0 - 0));
  }
  return `rgb(${r},${g},${b})`;
}

function exposureColor(hours: number, maxHours: number): string {
  if (maxHours === 0) return "#6699cc";
  const t = Math.min(hours / maxHours, 1);
  const r = Math.round(102 + t * (245 - 102));
  const g = Math.round(153 + t * (197 - 153));
  const b = Math.round(204 + t * (66 - 204));
  return `rgb(${r},${g},${b})`;
}

export function FacadeAnalysis({ facades, selectedDirection, onSelectDirection }: FacadeAnalysisProps) {
  if (facades.length === 0) return null;

  const maxHours = Math.max(...facades.map((f) => f.sunlightHours), 0.1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>Facade Sunlight</h3>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>
        Click a wall to highlight it in the 3D view
      </div>
      {facades.map((f, i) => {
        const isSelected = selectedDirection === f.direction;
        return (
          <div
            key={i}
            data-testid={`facade-row-${f.direction}`}
            onClick={() => onSelectDirection(isSelected ? null : f.direction)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              background: isSelected ? "#e0e7ff" : "transparent",
              border: isSelected ? "1px solid #818cf8" : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {/* Direction + exposure bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 24, fontWeight: 600, textAlign: "center", color: isSelected ? "#4338ca" : undefined }}>
                {f.direction}
              </span>
              <div style={{ flex: 1, position: "relative", height: 16, background: "#eee", borderRadius: 3 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${(f.sunlightHours / maxHours) * 100}%`,
                    background: exposureColor(f.sunlightHours, maxHours),
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <span style={{ width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {f.sunlightHours.toFixed(1)}h
              </span>
            </div>

            {/* Intensity + Energy row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 30 }}>
              {/* Instantaneous intensity badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "#f5f5f5",
                  borderRadius: 4,
                  padding: "1px 5px",
                  border: `1px solid ${intensityColor(f.intensity ?? 0)}44`,
                }}
                title={`cosθ=${(f.cosTheta ?? 0).toFixed(2)} — how directly sun hits`}
              >
                <span style={{ fontSize: 10, color: "#888" }}>☀</span>
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    color: intensityColor(f.intensity ?? 0),
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  {(f.intensity ?? 0).toFixed(0)} W/m²
                </span>
              </div>

              {/* Daily energy */}
              <div style={{ fontSize: 10, color: "#888" }}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{(f.dailyEnergy ?? 0).toFixed(0)}</span>{" "}
                Wh/m²·day
              </div>

              {/* cosTheta indicator */}
              <div style={{ marginLeft: "auto", fontSize: 10, color: "#aaa" }} title="Directness (1=perpendicular, 0=glancing)">
                cosθ {(f.cosTheta ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
