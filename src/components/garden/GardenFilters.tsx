import { useState } from "react";
import { LOW_EFFORT_THRESHOLD, type Benefit, type GardenFilter } from "../../lib/gardener/plantDatabase";
import { colors, chipStyle, radius, font, space } from "../../theme";

interface GardenFiltersProps {
  filter: GardenFilter;
  onChange: (filter: GardenFilter) => void;
}

const BENEFIT_META: Record<Benefit, { emoji: string; label: string }> = {
  "air-purifying": { emoji: "🫁", label: "Air-purifying" },
  edible: { emoji: "🍅", label: "Edible" },
  pollinator: { emoji: "🐝", label: "Pollinator" },
  "pest-deterrent": { emoji: "🛡️", label: "Pest-deterrent" },
  "cut-flower": { emoji: "💐", label: "Cut-flower" },
  medicinal: { emoji: "⚕️", label: "Medicinal" },
  fragrant: { emoji: "🌸", label: "Fragrant" },
};

// Most-asked-for benefits stay visible; the rest live behind "More filters".
const PRIMARY: Benefit[] = ["air-purifying", "edible", "pollinator"];
const SECONDARY: Benefit[] = ["pest-deterrent", "cut-flower", "medicinal", "fragrant"];

const LOW_EFFORT_ON = 80;
const LOW_EFFORT_OFF = 50;

/**
 * The single home for every garden filter. Framed as "What are you growing
 * for?" and expandable — so the user never has to choose between two filter
 * areas.
 */
export function GardenFilters({ filter, onChange }: GardenFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const setLocation = (location: GardenFilter["location"]) => onChange({ ...filter, location });

  const toggleBenefit = (b: Benefit) => {
    const benefits = filter.benefits.includes(b)
      ? filter.benefits.filter((x) => x !== b)
      : [...filter.benefits, b];
    onChange({ ...filter, benefits });
  };

  const lowEffort = filter.maintenancePriority >= LOW_EFFORT_THRESHOLD;
  const toggleLowEffort = () =>
    onChange({ ...filter, maintenancePriority: lowEffort ? LOW_EFFORT_OFF : LOW_EFFORT_ON });

  const benefitChip = (b: Benefit) => (
    <button key={b} type="button" style={chipStyle(filter.benefits.includes(b))} onClick={() => toggleBenefit(b)}>
      {BENEFIT_META[b].emoji} {BENEFIT_META[b].label}
    </button>
  );

  return (
    <div
      style={{
        padding: space.md,
        border: `1.5px solid ${colors.ink}`,
        borderRadius: radius.card,
        fontFamily: font.ui,
        display: "flex",
        flexDirection: "column",
        gap: space.sm,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>What are you growing for?</span>

      {/* Where */}
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" style={chipStyle(filter.location === "apartment")} onClick={() => setLocation("apartment")}>
          🏢 Apartment
        </button>
        <button type="button" style={chipStyle(filter.location === "home")} onClick={() => setLocation("home")}>
          🏡 Home
        </button>
      </div>

      {/* Primary benefits + low-effort */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PRIMARY.map(benefitChip)}
        <button type="button" style={chipStyle(lowEffort)} onClick={toggleLowEffort}>
          🌼 Low-effort
        </button>
      </div>

      {/* Secondary benefits behind an expander */}
      {expanded && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{SECONDARY.map(benefitChip)}</div>}

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          color: colors.sky,
          fontSize: 11,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {expanded ? "Fewer filters ▴" : "More filters ▾"}
      </button>

      <div style={{ fontSize: 10, color: colors.inkFaint }}>
        Picks update live and show only plants that match.
      </div>
    </div>
  );
}
