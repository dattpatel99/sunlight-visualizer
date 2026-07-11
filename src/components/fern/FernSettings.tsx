import { useState } from "react";
import { FERN_MODELS, getStoredModel, setStoredModel, type FernModel } from "../../lib/gardener/GardenerAgent";
import { loadPreferences, savePreferences } from "../../lib/gardener/userPreferences";
import { colors, font, space } from "../../theme";

interface FernSettingsProps {
  hasKey: boolean;
  onBack: () => void;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
}

const KEY_MASK = "sk-••••••••";

export function FernSettings({ hasKey, onBack, onSaveKey, onClearKey }: FernSettingsProps) {
  const [keyValue, setKeyValue] = useState("");
  const [model, setModel] = useState<FernModel>(() => getStoredModel());
  const [maintenance, setMaintenance] = useState<number>(() => loadPreferences().maintenancePriority);

  const changeModel = (m: FernModel) => {
    setModel(m);
    setStoredModel(m);
  };

  const changeMaintenance = (v: number) => {
    setMaintenance(v);
    savePreferences({ maintenancePriority: v });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: font.ui }}>
      <div style={header}>
        <button type="button" aria-label="Back" onClick={onBack} style={iconBtn}>
          ←
        </button>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Fern settings</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: space.md, display: "flex", flexDirection: "column", gap: space.lg }}>
        <section>
          <div style={sectionLabel}>Suggestion tuning</div>
          <label style={{ fontSize: 11, color: colors.inkSoft }}>
            Prioritise low-maintenance ({maintenance})
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={maintenance}
              aria-label="Prioritise low-maintenance"
              onChange={(e) => changeMaintenance(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#aaa", marginTop: 8 }} title="Coming soon">
            <input type="checkbox" disabled />
            Native species only <span style={{ fontSize: 10 }}>(coming soon)</span>
          </label>
        </section>

        <section>
          <div style={sectionLabel}>AI agent · optional</div>
          <div style={{ fontSize: 11, color: colors.inkSoft, marginBottom: 4 }}>OpenAI API key</div>
          {hasKey ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: colors.inkSoft }}>{KEY_MASK}</span>
              <button type="button" onClick={onClearKey} style={smallBtn}>
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="password"
                value={keyValue}
                placeholder="sk-…"
                aria-label="OpenAI API key"
                onChange={(e) => setKeyValue(e.target.value)}
                style={keyInput}
              />
              <button type="button" onClick={() => keyValue.trim() && onSaveKey(keyValue.trim())} style={smallBtn}>
                Save
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, color: colors.inkSoft, margin: "10px 0 4px" }}>Model</div>
          <select
            value={model}
            aria-label="Model"
            onChange={(e) => changeModel(e.target.value as FernModel)}
            style={keyInput}
          >
            {FERN_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </section>

        <div style={note}>No key? Fern still works in rule-based mode 🌿</div>
      </div>
    </div>
  );
}

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderBottom: `1.5px solid ${colors.hair}`,
};
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 15, color: colors.inkSoft };
const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: colors.inkSoft,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: ".4px",
};
const keyInput: React.CSSProperties = {
  flex: 1,
  width: "100%",
  height: 30,
  border: "1.5px solid #ccc",
  borderRadius: 7,
  padding: "0 10px",
  fontSize: 11,
};
const smallBtn: React.CSSProperties = {
  border: `1.5px solid ${colors.ink}`,
  background: colors.leafSoft,
  borderRadius: 7,
  padding: "0 10px",
  fontSize: 11,
  cursor: "pointer",
};
const note: React.CSSProperties = {
  marginTop: "auto",
  padding: 7,
  background: colors.canvas,
  border: "1px dashed #b9c4b9",
  borderRadius: 6,
  fontSize: 10.5,
  color: colors.inkSoft,
};
