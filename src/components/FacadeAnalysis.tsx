import type { FacadeExposure } from "../lib/facadeUtils";

interface FacadeAnalysisProps {
  facades: FacadeExposure[];
  selectedDirection: string | null;
  onSelectDirection: (direction: string | null) => void;
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
            onClick={() => onSelectDirection(isSelected ? null : f.direction)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 4,
              background: isSelected ? "#e0e7ff" : "transparent",
              border: isSelected ? "1px solid #818cf8" : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
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
        );
      })}
    </div>
  );
}
