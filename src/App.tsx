import { useState, useMemo } from "react";
import type { LatLng } from "./types";
import { DEFAULT_LOCATION } from "./constants";
import { useBuildings } from "./hooks/useBuildings";
import { useSunPosition } from "./hooks/useSunPosition";
import { Scene } from "./components/Scene";
import { LocationInput } from "./components/LocationInput";
import { TimeControls } from "./components/TimeControls";
import { BuildingInfo } from "./components/BuildingInfo";

function getDefaultDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export default function App() {
  const [center, setCenter] = useState<LatLng>(DEFAULT_LOCATION);
  const [date, setDate] = useState<Date>(getDefaultDate);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  const { buildings, loading, error, load } = useBuildings();
  const sunPosition = useSunPosition(center, date);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId]
  );

  const handleLoad = (loc: LatLng) => {
    setCenter(loc);
    setSelectedBuildingId(null);
    load(loc);
  };

  const handleSelectBuilding = (id: number) => {
    setSelectedBuildingId(id === -1 ? null : id);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Sunlight Visualizer</h2>

        <LocationInput onLoad={handleLoad} loading={loading} />

        {error && (
          <div style={{ color: "#dc2626", fontSize: 13, padding: "4px 0" }}>
            {error}
          </div>
        )}

        {buildings.length > 0 && (
          <div style={{ color: "#666", fontSize: 13 }}>
            {buildings.length} buildings loaded
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

        <TimeControls date={date} onDateChange={setDate} />

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

        <BuildingInfo building={selectedBuilding} />

        <div style={{ marginTop: "auto", fontSize: 11, color: "#aaa" }}>
          Data: OpenStreetMap contributors
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1 }}>
        <Scene
          buildings={buildings}
          sunPosition={sunPosition}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={handleSelectBuilding}
        />
      </div>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: 280,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  borderRight: "1px solid #e5e5e5",
  overflowY: "auto",
  background: "#fafafa",
};
