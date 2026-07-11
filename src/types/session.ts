// Shared session types — single source of truth for multi-client state

export interface SessionState {
  /** Host's geographic center */
  center: { lat: number; lng: number };
  /** Current analysis date/time */
  date: string; // ISO-8601 string for cross-realm serialization
  /** Currently selected building ID */
  selectedBuildingId: number | null;
  /** Facade direction being highlighted */
  highlightDirection: string | null;
  /** Currently playing animation */
  playing: boolean;
  /** Animation speed in minutes per tick */
  speed: number;
  /** Number of connected viewers (host only) */
  connectedClients: number;
}

export interface SessionInfo {
  role: "host" | "viewer";
  roomCode: string;
  /** Own peer ID (host sets this to roomCode, viewers get their own) */
  peerId: string;
  /** Host's peer ID (viewers only) */
  hostPeerId?: string;
}

export type SyncMessage =
  | { type: "session_state"; state: Partial<SessionState> }
  | { type: "request_state" }
  | { type: "host_info"; hostPeerId: string; roomCode: string }
  | { type: "building_select"; id: number | null };

export interface PeerInfo {
  peerId: string;
  connection: RTCDataChannel | null;
  lastSeen: number;
}
