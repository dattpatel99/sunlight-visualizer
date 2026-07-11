import type { FacadeExposure } from "../../lib/facadeUtils";
import { colors, font } from "../../theme";

interface FacadeTagProps {
  facade: FacadeExposure | null;
  /** Opens the garden drawer / focuses plant advice for this wall. */
  onClick?: () => void;
}

/** Small tag surfaced over the canvas when a facade is selected. */
export function FacadeTag({ facade, onClick }: FacadeTagProps) {
  if (!facade) return null;
  return (
    <button
      type="button"
      data-testid="facade-tag"
      onClick={onClick}
      style={{
        background: colors.sky,
        color: "#fff",
        border: `1.5px solid ${colors.ink}`,
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: font.ui,
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 0 rgba(0,0,0,.18)",
      }}
    >
      {facade.direction} facade · {facade.sunlightHours.toFixed(1)}h sun{onClick ? " ▸" : ""}
    </button>
  );
}
