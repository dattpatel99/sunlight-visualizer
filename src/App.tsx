import { useState, useMemo, useCallback } from "react";
import type { LatLng } from "./types";
import { DEFAULT_LOCATION, OVERPASS_RADIUS } from "./constants";
import { useBuildings, type DataSource } from "./hooks/useBuildings";
import { useSunPosition } from "./hooks/useSunPosition";
import { useFacadeAnalysis } from "./hooks/useFacadeAnalysis";
import { useUrlState } from "./hooks/useUrlState";
import { computeSunlightStats } from "./lib/sunlightStats";
import { Scene } from "./components/Scene";
import { LocationInput } from "./components/LocationInput";
import { AddressSearch } from "./components/AddressSearch";
import { TimeControls } from "./components/TimeControls";
import { BuildingInfo } from "./components/BuildingInfo";
import { FacadeAnalysis } from "./components/FacadeAnalysis";
import { SunlightStatsPanel } from "./components/SunlightStats";

function getDefaultDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export default function App() {
  const [center, setCenter] = useState<LatLng>(DEFAULT_LOCATION);
  const [date, setDate] = useState<Date>(getDefaultDate);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [radius, setRadius] = useState(OVERPASS_RADIUS);
  const [dataSource, setDataSource] = useState<DataSource>("overture");

  const { buildings, loading, error, load } = useBuildings();
  const sunPosition = useSunPosition(center, date);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId]
  );

  const facadeExposures = useFacadeAnalysis(selectedBuilding, center, date);

  const sunlightStats = useMemo(
    () => computeSunlightStats(center, date, facadeExposures),
    [center, date, facadeExposures]
  );

  // URL state sync
  const handleRestore = useCallback(
    (state: Partial<{ center: LatLng; date: Date }>) => {
      if (state.center) setCenter(state.center);
      if (state.date) setDate(state.date);
      if (state.center) load(state.center, radius, dataSource);
    },
    [load, radius, dataSource]
  );
  useUrlState(center, date, handleRestore);

  const handleLoad = (loc: LatLng, r: number, source: DataSource) => {
    setCenter(loc);
    setRadius(r);
    setDataSource(source);
    setSelectedBuildingId(null);
    load(loc, r, source);
  };

  const handleAddressSelect = (loc: LatLng) => {
    setCenter(loc);
    setSelectedBuildingId(null);
    load(loc, radius, dataSource);
  };

  const handleSelectBuilding = (id: number) => {
    setSelectedBuildingId(id === -1 ? null : id);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: 18 }}>Sunlight Visualizer</h2>

        <AddressSearch onSelect={handleAddressSelect} />

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

        <hr style={hrStyle} />

        <TimeControls date={date} onDateChange={setDate} />

        <hr style={hrStyle} />

        <BuildingInfo building={selectedBuilding} />

        {facadeExposures.length > 0 && (
          <>
            <hr style={hrStyle} />
            <FacadeAnalysis facades={facadeExposures} />
            <hr style={hrStyle} />
            <SunlightStatsPanel stats={sunlightStats} />
          </>
        )}

        <div style={{ marginTop: "auto", fontSize: 11, color: "#aaa" }}>
          Data: {dataSource === "overture" ? "Overture Maps Foundation" : "OpenStreetMap contributors"}
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1 }}>
        <Scene
          buildings={buildings}
          sunPosition={sunPosition}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={handleSelectBuilding}
          facadeExposures={facadeExposures}
          center={center}
        />
      </div>
    </div>
  );
}

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #eee",
  margin: "4px 0",
};

const sidebarStyle: React.CSSProperties = {
  width: 280,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderRight: "1px solid #e5e5e5",
  overflowY: "auto",
  background: "#fafafa",
};
