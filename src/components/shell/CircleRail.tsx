import { colors, font } from "../../theme";

export interface RailItem {
  id: string;
  emoji: string;
  label: string;
}

interface CircleRailProps {
  items: RailItem[];
  /** ids of panels currently open (a circle is green iff its panel is open). */
  activeIds: string[];
  onToggle: (id: string) => void;
}

export function CircleRail({ items, activeIds, onToggle }: CircleRailProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: font.ui,
      }}
    >
      {items.map((item) => {
        const active = activeIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            aria-label={item.label}
            title={item.label}
            data-testid={`rail-${item.id}`}
            onClick={() => onToggle(item.id)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: active ? colors.leaf : colors.surface,
              border: `1.5px solid ${colors.ink}`,
              // Raised (clickable) when closed; pressed-in + green ring when open.
              boxShadow: active
                ? `0 0 0 3px ${colors.leafSoft}, inset 0 2px 4px rgba(0,0,0,.22)`
                : "0 3px 0 rgba(0,0,0,.20), 0 5px 10px rgba(0,0,0,.14)",
              transform: active ? "translateY(2px)" : "none",
              transition: "transform .08s ease, box-shadow .08s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span aria-hidden>{item.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
