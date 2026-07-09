/**
 * PlantSuggestions — collapsible panel showing precomputed plant recommendations
 * for the selected facade (or sunniest facade). Low-latency: data is pre-matched
 * on the client from the static plant database, no API call needed.
 *
 * Controlled by a visibility toggle so clients who don't care about plants
 * never see it — the toggle state lives in the parent (App).
 */

import React, { useState } from "react";
import { PLANTS, type PlantEntry } from "../lib/gardener/plantDatabase";

interface PlantSuggestionsProps {
  /** Plant IDs to display */
  plantIds: string[];
  /** Whether the panel is visible at all */
  visible: boolean;
  /** Callback to hide the panel */
  onHide: () => void;
  /** Called when user wants to "save" a plant to their garden list (stored locally) */
  onSave?: (plantId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  vegetable: "#16a34a",
  herb:       "#65a30d",
  fruit:      "#dc2626",
  flower:     "#db2777",
  succulent:  "#0891b2",
};

export function PlantSuggestions({ plantIds, visible, onHide, onSave }: PlantSuggestionsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  if (!visible || plantIds.length === 0) return null;

  const plants = plantIds.map((id) => PLANTS.find((p) => p.id === id)).filter(Boolean) as PlantEntry[];

  const handleSave = (plantId: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) next.delete(plantId);
      else { next.add(plantId); onSave?.(plantId); }
      return next;
    });
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>🌱 Plant Picks</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            style={toggleBtn}
            onClick={() => setExpanded((e) => (e === "all" ? null : "all"))}
            title="Expand all"
          >
            {expanded === "all" ? "▴" : "▾"} All
          </button>
          <button style={closeBtn} onClick={onHide} title="Hide plant suggestions">✕</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {plants.map((plant) => {
          const isExpanded = expanded === plant.id;
          const isSaved = saved.has(plant.id);

          return (
            <div
              key={plant.id}
              style={{
                ...cardStyle,
                borderColor: isExpanded ? CATEGORY_COLORS[plant.category] : "transparent",
                background: isSaved ? "#f0fdf4" : "#fff",
              }}
            >
              {/* Card header */}
              <div
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setExpanded((e) => (e === plant.id ? null : plant.id))}
              >
                <span style={{ fontSize: 20 }}>{plant.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>{plant.name}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                    <span style={{ ...badgeStyle, background: `${CATEGORY_COLORS[plant.category]}22`, color: CATEGORY_COLORS[plant.category] }}>
                      {plant.category}
                    </span>
                    <span style={badgeStyle}>
                      ☀ {plant.minDirectSunHours}h+ sun
                    </span>
                    {plant.beginnerFriendly && (
                      <span style={{ ...badgeStyle, background: "#dcfce7", color: "#15803d" }}>Beginner</span>
                    )}
                  </div>
                </div>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
                  onClick={(e) => { e.stopPropagation(); setExpanded((ex) => (ex === plant.id ? null : plant.id)); }}
                  aria-label="Expand"
                >
                  {isExpanded ? "▴" : "▾"}
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={detailStyle}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>
                    {plant.notes}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
                    <InfoRow label="Heat" value={plant.heatTolerance} />
                    <InfoRow label="Frost" value={plant.frostTolerance} />
                    <InfoRow label="Water" value={plant.waterNeeds} />
                    {plant.daysToHarvest && plant.daysToHarvest < 999 && (
                      <InfoRow label="Harvest" value={`~${plant.daysToHarvest} days`} />
                    )}
                  </div>
                  {plant.toxic && (
                    <div style={toxicWarning}>⚠️ Toxic to pets or small children</div>
                  )}
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <button
                      style={{
                        ...saveBtn,
                        background: isSaved ? "#16a34a" : "#f3f4f6",
                        color: isSaved ? "#fff" : "#374151",
                      }}
                      onClick={() => handleSave(plant.id)}
                    >
                      {isSaved ? "✓ Saved" : "💚 Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "#9ca3af", fontSize: 9, textTransform: "uppercase" }}>{label}</span>
      <div style={{ color: "#374151", fontWeight: 500, textTransform: "capitalize" }}>{value}</div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const titleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#065f46",
};

const toggleBtn: React.CSSProperties = {
  fontSize: 10,
  background: "#f3f4f6",
  border: "none",
  borderRadius: 4,
  padding: "2px 6px",
  cursor: "pointer",
  color: "#374151",
};

const closeBtn: React.CSSProperties = {
  fontSize: 11,
  background: "#f3f4f6",
  border: "none",
  borderRadius: 4,
  padding: "2px 6px",
  cursor: "pointer",
  color: "#6b7280",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 10px",
  transition: "all 0.15s",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 9,
  background: "#f3f4f6",
  color: "#374151",
  borderRadius: 4,
  padding: "1px 4px",
  fontWeight: 500,
  textTransform: "capitalize",
};

const detailStyle: React.CSSProperties = {
  marginTop: 8,
  paddingTop: 8,
  borderTop: "1px solid #f3f4f6",
};

const toxicWarning: React.CSSProperties = {
  fontSize: 10,
  color: "#92400e",
  background: "#fef3c7",
  borderRadius: 4,
  padding: "3px 6px",
  marginTop: 4,
};

const saveBtn: React.CSSProperties = {
  fontSize: 11,
  border: "none",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
  fontWeight: 500,
  transition: "all 0.15s",
};
