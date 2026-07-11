import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { LatLng } from "./types";
import type { SessionState } from "./types/session";
import { DEFAULT_LOCATION, OVERPASS_RADIUS } from "./constants";
import { useBuildings } from "./hooks/useBuildings";
import { useSunPosition } from "./hooks/useSunPosition";
import { useFacadeAnalysis } from "./hooks/useFacadeAnalysis";
import { useUrlState } from "./hooks/useUrlState";
import { computeSunlightStats } from "./lib/sunlightStats";
import { SessionManager } from "./lib/sessionManager";
import { Scene } from "./components/Scene";
import { AddressSearch } from "./components/AddressSearch";
import { LocationInput } from "./components/LocationInput";
import { TimeControls } from "./components/TimeControls";
import { BuildingInfo } from "./components/BuildingInfo";
import { FacadeAnalysis } from "./components/FacadeAnalysis";
import { SunlightStatsPanel } from "./components/SunlightStats";
import { SessionPanel } from "./components/SessionPanel";
import { WeatherPanel } from "./components/WeatherPanel";
import { CircleRail, type RailItem } from "./components/shell/CircleRail";
import { OverlayPanel } from "./components/shell/OverlayPanel";
import { FacadeTag } from "./components/shell/FacadeTag";
import { GardenDrawer } from "./components/garden/GardenDrawer";
import { Fern } from "./components/fern/Fern";
import { colors, shadow, radius, z, font } from "./theme";

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

const RAIL_ITEMS: RailItem[] = [
  { id: "buildings", emoji: "🧊", label: "Buildings & Sun" },
  { id: "garden", emoji: "🌿", label: "Garden" },
  { id: "weather", emoji: "🌤️", label: "Weather" },
];

type LeftPanel = "buildings" | "weather" | null;

export default function App() {
  const [center, setCenter] = useState<LatLng>(DEFAULT_LOCATION);
  const [date, setDate] = useState<Date>(getDefaultDate);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [radius_, setRadius] = useState(OVERPASS_RADIUS);
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

  // Panels are closed by default — the rail opens them on demand.
  const [leftPanel, setLeftPanel] = useState<LeftPanel>(null);
  const [gardenOpen, setGardenOpen] = useState(false);

  // The clickable building list is a debug aid (?debug); normally you pick a
  // building directly in the 3D view.
  const debug = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).has("debug");
    } catch {
      return false;
    }
  }, []);

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

  const selectedFacade = useMemo(
    () => facadeExposures.find((f) => f.direction === selectedFacadeDirection) ?? null,
    [facadeExposures, selectedFacadeDirection]
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
      if (state.center) load(state.center, radius_);
    },
    [load, radius_, isHost, pushToSession]
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

  const handleLoad = (loc: LatLng, r: number) => {
    setCenter(loc);
    setRadius(r);
    setSelectedBuildingId(null);
    setSelectedFacadeDirection(null);
    load(loc, r);
    if (isHost) pushToSession({ center: loc, highlightDirection: null });
  };

  const handleAddressSelect = (loc: LatLng) => {
    setCenter(loc);
    setSelectedBuildingId(null);
    setSelectedFacadeDirection(null);
    load(loc, radius_);
    if (isHost) pushToSession({ center: loc, highlightDirection: null });
    // Guide the user: reveal the Buildings & Sun panel so they can pick a building/wall.
    setLeftPanel("buildings");
  };

  const handleSelectBuilding = (id: number) => {
    const next = id === -1 ? null : id;
    setSelectedBuildingId(next);
    setSelectedFacadeDirection(null);
    if (isHost) pushToSession({ selectedBuildingId: next, highlightDirection: null });
    // Viewers can also update their own selection (pushed to host, but host guards animation state)
    if (isViewer) pushToSession({ selectedBuildingId: next, highlightDirection: null });
    // Picking a building (in the 3D view or the list) surfaces its facade options.
    if (next !== null) setLeftPanel("buildings");
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

  const toggleRail = (id: string) => {
    if (id === "garden") setGardenOpen((o) => !o);
    else setLeftPanel((p) => (p === id ? null : (id as LeftPanel)));
  };

  const activeIds = [
    leftPanel === "buildings" ? "buildings" : null,
    gardenOpen ? "garden" : null,
    leftPanel === "weather" ? "weather" : null,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", background: colors.canvas, fontFamily: font.ui }}
      // Suppress the browser context menu so a right-drag pan can't be interrupted
      // mid-gesture (which otherwise leaves OrbitControls stuck in "pan" mode).
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Full-bleed 3D canvas (receives all pointer events in transparent regions) */}
      <div style={{ position: "absolute", inset: 0 }}>
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

      {/*
        Overlay layer: pointer-events NONE so the canvas underneath still gets
        drags / right-click-pan through the transparent gaps. Each interactive
        island re-enables pointer events on itself (`interactive` helper).
      */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Address bar (top-left) — highest layer so its results dropdown clears the rail */}
        <div style={interactive({ top: 16, left: 16, width: 280, zIndex: z.top })}>
          <div style={addressCard}>
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        </div>

        {/* Circle rail (left, below address) */}
        <div style={interactive({ top: 92, left: 22, zIndex: z.canvasOverlay })}>
          <CircleRail items={RAIL_ITEMS} activeIds={activeIds} onToggle={toggleRail} />
        </div>

        {/* Selected-facade tag on canvas */}
        <div style={interactive({ top: 24, left: "50%", transform: "translateX(-50%)", zIndex: z.canvasOverlay })}>
          <FacadeTag facade={selectedFacade} onClick={() => setGardenOpen(true)} />
        </div>

        {/* Left docked panel: Buildings & Sun */}
        {leftPanel === "buildings" && (
          <div style={interactive({ top: 92, left: 76, width: 300, bottom: 88, zIndex: z.drawer })}>
            <OverlayPanel
              title="Buildings & Sun"
              emoji="🧊"
              onClose={() => setLeftPanel(null)}
              testId="buildings-panel"
              style={{ height: "100%" }}
            >
              <SessionPanel
                sessionInfo={sessionInfo}
                sessionState={sessionState}
                onStartHost={handleStartHost}
                onJoinSession={handleJoinSession}
                onLeave={handleLeave}
              />
              <LocationInput onLoad={handleLoad} loading={loading} currentLocation={center} />
              {error && <div style={{ color: colors.warn, fontSize: 13 }}>{error}</div>}
              {buildings.length > 0 && (
                <div style={{ color: colors.inkSoft, fontSize: 13 }}>
                  {buildings.length} buildings loaded — click one in the 3D view to see its walls.
                </div>
              )}
              {debug && buildings.length > 0 && (
                <div
                  data-testid="building-list"
                  style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 140, overflowY: "auto" }}
                >
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      data-testid={`building-item-${b.id}`}
                      onClick={() => handleSelectBuilding(b.id)}
                      style={{
                        textAlign: "left",
                        fontSize: 12,
                        padding: "4px 8px",
                        borderRadius: 6,
                        cursor: "pointer",
                        border: `1px solid ${selectedBuildingId === b.id ? colors.ink : "transparent"}`,
                        background: selectedBuildingId === b.id ? colors.leafSoft : "#f3f3f3",
                      }}
                    >
                      Building #{b.id} · {Math.round(b.height)}m
                    </button>
                  ))}
                </div>
              )}
              <BuildingInfo building={selectedBuilding} />
              {facadeExposures.length > 0 && (
                <>
                  <FacadeAnalysis
                    facades={facadeExposures}
                    selectedDirection={selectedFacadeDirection}
                    onSelectDirection={handleFacadeSelect}
                  />
                  <SunlightStatsPanel stats={sunlightStats} />
                </>
              )}
              <div style={{ fontSize: 11, color: colors.inkFaint }}>Data: OpenStreetMap contributors</div>
            </OverlayPanel>
          </div>
        )}

        {/* Left docked panel: Weather */}
        {leftPanel === "weather" && (
          <div style={interactive({ top: 92, left: 76, width: 260, zIndex: z.drawer })}>
            <OverlayPanel title="Weather" emoji="🌤️" onClose={() => setLeftPanel(null)} testId="weather-panel-wrap">
              <WeatherPanel location={center} date={date} />
            </OverlayPanel>
          </div>
        )}

        {/* Garden drawer (right) */}
        {gardenOpen && (
          <div style={interactive({ top: 0, right: 0, bottom: 0, zIndex: z.drawer })}>
            <GardenDrawer
              location={center}
              facades={facadeExposures}
              selectedFacade={selectedFacadeDirection}
              onClose={() => setGardenOpen(false)}
            />
          </div>
        )}

        {/* Time scrubber (bottom-center) */}
        <div
          style={interactive({
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 340,
            zIndex: z.canvasOverlay,
          })}
        >
          <div style={scrubberCard}>
            <TimeControls
              date={date}
              onDateChange={handleDateChange}
              playing={playing}
              onPlayingChange={handlePlayingChange}
              speed={speed}
              onSpeedChange={handleSpeedChange}
              disabled={isViewer}
            />
          </div>
        </div>

        {/* Fern nub / panel (bottom-left) */}
        <div style={interactive({ bottom: 16, left: 16, zIndex: z.fern })}>
          <Fern location={center} facades={facadeExposures} selectedFacade={selectedFacadeDirection} />
        </div>
      </div>
    </div>
  );
}

/** Positioned overlay island that re-enables pointer events (parent layer is `none`). */
function interactive(style: React.CSSProperties): React.CSSProperties {
  return { position: "absolute", pointerEvents: "auto", ...style };
}

const addressCard: React.CSSProperties = {
  background: colors.surface,
  border: `1.5px solid ${colors.ink}`,
  borderRadius: radius.card,
  boxShadow: shadow.soft,
  padding: "6px 14px",
};

const scrubberCard: React.CSSProperties = {
  background: colors.surface,
  border: `1.5px solid ${colors.ink}`,
  borderRadius: radius.card,
  boxShadow: shadow.soft,
  padding: "8px 14px",
};
