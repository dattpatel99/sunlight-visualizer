import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { LatLng } from "./types";
import type { SessionState } from "./types/session";
import { DEFAULT_LOCATION, OVERPASS_RADIUS } from "./constants";
import { useBuildings, type DataSource } from "./hooks/useBuildings";
import { useSunPosition } from "./hooks/useSunPosition";
import { useFacadeAnalysis } from "./hooks/useFacadeAnalysis";
import { useUrlState } from "./hooks/useUrlState";
import { computeSunlightStats } from "./lib/sunlightStats";
import { SessionManager } from "./lib/sessionManager";
import { Scene } from "./components/Scene";
import { LocationInput } from "./components/LocationInput";
import { AddressSearch } from "./components/AddressSearch";
import { TimeControls } from "./components/TimeControls";
import { BuildingInfo } from "./components/BuildingInfo";
import { FacadeAnalysis } from "./components/FacadeAnalysis";
import { SunlightStatsPanel } from "./components/SunlightStats";
import { SessionPanel } from "./components/SessionPanel";

function getDefaultDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function dateToISO(date: Date): string {
  return date.toISOString();
}

function isoToDate(iso: string): Date {
  return new Date(iso);
}

export default function App() {
  const [center, setCenter] = useState<LatLng>(DEFAULT_LOCATION);
  const [date, setDate] = useState<Date>(getDefaultDate);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [radius, setRadius] = useState(OVERPASS_RADIUS);
  const [dataSource, setDataSource] = useState<DataSource>("overture");
  const [selectedFacadeDirection, setSelectedFacadeDirection] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);

  // Multi-client session
  const [sessionInfo, setSessionInfo] = useState<ReturnType<SessionManager["getInfo"]> | null>(
    () => {
      // Restore session from sessionStorage on page load
      try {
        const saved = sessionStorage.getItem("sv_session");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
  );
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  const sessionRef = useRef<SessionManager | null>(null);
  const isHost = sessionInfo?.role === "host";
  const isViewer = sessionInfo?.role === "viewer";

  // Initialize session manager
  useEffect(() => {
    const initialState: SessionState = {
      center,
      date: dateToISO(date),
      selectedBuildingId: null,
      highlightDirection: null,
      playing: false,
      speed: 10,
      connectedClients: 0,
    };

    sessionRef.current = new SessionManager(initialState);

    const unsubscribeState = sessionRef.current.subscribe((state) => {
      setSessionState(state);
    });

    const unsubscribeInfo = sessionRef.current.subscribeToSessionInfo((info) => {
      setSessionInfo(info);
    });

    return () => {
      unsubscribeState();
      unsubscribeInfo();
      sessionRef.current?.leave();
    };
  }, []);

  // Sync session state → local state when viewer receives host updates
  useEffect(() => {
    if (!isViewer || !sessionState) return;

    if (sessionState.center) setCenter(sessionState.center);
    if (sessionState.date) setDate(isoToDate(sessionState.date));
    if (sessionState.selectedBuildingId !== undefined)
      setSelectedBuildingId(sessionState.selectedBuildingId);
    if (sessionState.highlightDirection !== undefined)
      setSelectedFacadeDirection(sessionState.highlightDirection);
    if (sessionState.playing !== undefined) setPlaying(sessionState.playing);
    if (sessionState.speed !== undefined) setSpeed(sessionState.speed);
  }, [sessionState, isViewer]);

  // Push local state changes → session (host only)
  const pushToSession = useCallback(
    (partial: Partial<SessionState>) => {
      if (isViewer) return; // viewers don't push animation/date
      const enriched: Partial<SessionState> = {
        ...partial,
        center: partial.center ?? center,
        date: partial.date ?? dateToISO(date),
        playing: partial.playing ?? playing,
        speed: partial.speed ?? speed,
        selectedBuildingId:
          partial.selectedBuildingId !== undefined
            ? partial.selectedBuildingId
            : selectedBuildingId,
        highlightDirection:
          partial.highlightDirection !== undefined
            ? partial.highlightDirection
            : selectedFacadeDirection,
      };
      sessionRef.current?.updateState(enriched);
    },
    [center, date, playing, speed, selectedBuildingId, selectedFacadeDirection, isViewer]
  );

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
      if (state.center) {
        setCenter(state.center);
        if (isHost) pushToSession({ center: state.center });
      }
      if (state.date) {
        setDate(state.date);
        if (isHost) pushToSession({ date: dateToISO(state.date) });
      }
      if (state.center) load(state.center, radius, dataSource);
    },
    [load, radius, dataSource, isHost, pushToSession]
  );
  useUrlState(center, date, handleRestore);

  const handleStartHost = () => {
    if (!sessionRef.current) return;
    const info = sessionRef.current.startHost({
      center,
      date: dateToISO(date),
      selectedBuildingId,
      highlightDirection: selectedFacadeDirection,
      playing,
      speed,
      connectedClients: 0,
    });
    setSessionInfo(info);
    setPlaying(false);
    setSpeed(10);
  };

  const handleJoinSession = (roomCode: string) => {
    if (!sessionRef.current) return;
    const info = sessionRef.current.joinSession(roomCode, {
      center,
      date: dateToISO(date),
      selectedBuildingId,
      highlightDirection: selectedFacadeDirection,
      playing: false,
      speed: 10,
      connectedClients: 0,
    });
    setSessionInfo(info);
  };

  const handleLeave = () => {
    sessionRef.current?.leave();
    setSessionInfo(null);
    setSessionState(null);
  };

  const handleLoad = (loc: LatLng, r: number, source: DataSource) => {
    setCenter(loc);
    setRadius(r);
    setDataSource(source);
    setSelectedBuildingId(null);
    setSelectedFacadeDirection(null);
    load(loc, r, source);
    if (isHost) pushToSession({ center: loc, highlightDirection: null });
  };

  const handleAddressSelect = (loc: LatLng) => {
    setCenter(loc);
    setSelectedBuildingId(null);
    setSelectedFacadeDirection(null);
    load(loc, radius, dataSource);
    if (isHost) pushToSession({ center: loc, highlightDirection: null });
  };

  const handleSelectBuilding = (id: number) => {
    const next = id === -1 ? null : id;
    setSelectedBuildingId(next);
    setSelectedFacadeDirection(null);
    if (isHost) pushToSession({ selectedBuildingId: next, highlightDirection: null });
    // Viewers can also update their own selection (pushed to host, but host guards animation state)
    if (isViewer) pushToSession({ selectedBuildingId: next, highlightDirection: null });
  };

  const handleFacadeSelect = (dir: string | null) => {
    setSelectedFacadeDirection(dir);
    if (isHost) pushToSession({ highlightDirection: dir });
  };

  const handleDateChange = (next: Date) => {
    setDate(next);
    if (isHost) pushToSession({ date: dateToISO(next) });
  };

  const handlePlayingChange = (p: boolean) => {
    setPlaying(p);
    if (isHost) pushToSession({ playing: p });
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    if (isHost) pushToSession({ speed: s });
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: 18 }}>Sunlight Visualizer</h2>

        <SessionPanel
          sessionInfo={sessionInfo}
          sessionState={sessionState}
          onStartHost={handleStartHost}
          onJoinSession={handleJoinSession}
          onLeave={handleLeave}
        />

        <hr style={hrStyle} />

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

        <TimeControls
          date={date}
          onDateChange={handleDateChange}
          playing={playing}
          onPlayingChange={handlePlayingChange}
          speed={speed}
          onSpeedChange={handleSpeedChange}
          disabled={isViewer}
        />

        <hr style={hrStyle} />

        <BuildingInfo building={selectedBuilding} />

        {facadeExposures.length > 0 && (
          <>
            <hr style={hrStyle} />
            <FacadeAnalysis
              facades={facadeExposures}
              selectedDirection={selectedFacadeDirection}
              onSelectDirection={handleFacadeSelect}
            />
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
          highlightDirection={selectedFacadeDirection}
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
