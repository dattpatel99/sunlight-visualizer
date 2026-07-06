/**
 * Session manager — handles multi-client state synchronization via
 * BroadcastChannel (same-origin tabs) and PeerJS WebRTC (cross-origin).
 *
 * Only the host drives animation (TimeControls play/pause/date changes).
 * Viewers receive read-only state updates.
 *
 * PeerJS types are inlined with @ts-ignore because peerjs bundles its own .d.ts
 * which uses SharedArrayBuffer/es2017 types that conflict with our ES2020 lib
 * even with skipLibCheck: true (module-level, not lib-level).
 */
import type { SessionState, SessionInfo, SyncMessage } from "../types/session";

// peerjs uses CommonJS `export =` — resolves to `module.exports.Peer`
// @ts-ignore
import { Peer, DataConnection } from "peerjs";

const PEER_PREFIX = "sv.";
const SESSION_KEY = "sv_session";
const BROADCAST_NAME = "sv_multi_client";

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function isSameOrigin(): boolean {
  return typeof window !== "undefined";
}

export class SessionManager {
  // @ts-ignore
  private bc: BroadcastChannel | null = null;
  // @ts-ignore
  private peer: InstanceType<typeof Peer> | null = null;
  // @ts-ignore
  private connections: Map<string, DataConnection> = new Map();
  private info: SessionInfo;
  private state: SessionState;
  private listeners = new Set<(state: SessionState) => void>();

  private infoListeners = new Set<(info: SessionInfo) => void>();

  constructor(initialState: SessionState) {
    this.state = { ...initialState };
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        this.info = JSON.parse(saved) as SessionInfo;
      } catch {
        this.info = this.createHostInfo();
      }
    } else {
      this.info = this.createHostInfo();
    }
  }

  private createHostInfo(): SessionInfo {
    const roomCode = generateRoomCode();
    const info: SessionInfo = {
      role: "host",
      roomCode,
      peerId: PEER_PREFIX + roomCode,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(info));
    return info;
  }

  /** Start a session as host */
  startHost(state: SessionState): SessionInfo {
    this.state = { ...state };
    this.info = this.createHostInfo();
    this.connectBroadcastChannel();
    this.connectPeerServer();
    this.notifyInfoListeners();
    return this.info;
  }

  /** Join a session as viewer */
  joinSession(hostPeerId: string, state: SessionState): SessionInfo {
    this.state = { ...state };
    const roomCode = hostPeerId.replace(PEER_PREFIX, "");
    const myPeerId = PEER_PREFIX + generateRoomCode();
    this.info = { role: "viewer", roomCode, peerId: myPeerId, hostPeerId };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.info));
    this.connectBroadcastChannel();
    this.connectPeerServer();
    this.connectToHost(hostPeerId);
    this.notifyInfoListeners();
    return this.info;
  }

  /** Leave and clean up session */
  leave(): void {
    this.bc?.close();
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  getInfo(): SessionInfo {
    return this.info;
  }

  getState(): SessionState {
    return this.state;
  }

  /**
   * Update state — if host, broadcast to all.
   * Viewers can only update building selection; animation is always driven by host.
   */
  updateState(partial: Partial<SessionState>): void {
    // Viewers may NOT override animation state
    const sanitized: Partial<SessionState> =
      this.info.role === "viewer"
        ? {
            ...partial,
            playing: this.state.playing,
            speed: this.state.speed,
            date: this.state.date,
          }
        : partial;

    this.state = { ...this.state, ...sanitized };
    this.notifyListeners();

    if (this.info.role === "host") {
      this.broadcast({ type: "session_state", state: sanitized });
      this.connections.forEach((conn) => {
        conn.send({ type: "session_state", state: sanitized });
      });
    } else {
      const hostConn = this.connections.get(this.info.hostPeerId!);
      hostConn?.send({ type: "session_state", state: sanitized });
    }
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToSessionInfo(listener: (info: SessionInfo) => void): () => void {
    this.infoListeners.add(listener);
    return () => this.infoListeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  private notifyInfoListeners(): void {
    this.infoListeners.forEach((l) => l(this.info));
  }

  /** Host: send full state to a newly connected viewer */
  private sendFullState(conn: DataConnection): void {
    conn.send({ type: "session_state", state: this.state });
  }

  private updateClientCount(): void {
    this.state = { ...this.state, connectedClients: this.connections.size };
    this.notifyListeners();
  }

  // ─── BroadcastChannel (same-origin tabs) ───────────────────────────────────

  private connectBroadcastChannel(): void {
    if (!isSameOrigin()) return;
    this.bc = new BroadcastChannel(BROADCAST_NAME);
    this.bc.addEventListener("message", (ev) => {
      const msg = ev.data as SyncMessage;
      if (msg.type === "session_state" && this.info.role === "viewer") {
        this.state = { ...this.state, ...msg.state };
        this.notifyListeners();
      }
    });
  }

  // ─── PeerJS WebRTC (cross-origin) ─────────────────────────────────────────

  private connectPeerServer(): void {
    // @ts-ignore
    this.peer = new Peer(this.info.peerId, {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
      path: "/",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    this.peer!.on("open", () => {
      if (this.info.role === "host") {
        this.acceptConnections();
      }
    });

    this.peer!.on("error", (err: { message: string }) => {
      console.warn("[Session] Peer error:", err.message);
    });
  }

  private acceptConnections(): void {
    this.peer!.on("connection", (conn: DataConnection) => {
      this.handleIncomingConnection(conn);
    });
  }

  private handleIncomingConnection(conn: DataConnection): void {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      this.updateClientCount();
      this.sendFullState(conn);
    });
    conn.on("data", (data: unknown) => {
      const msg = data as SyncMessage;
      this.handleViewerMessage(msg, conn);
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.updateClientCount();
    });
    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.updateClientCount();
    });
  }

  private connectToHost(hostPeerId: string): void {
    const conn = this.peer!.connect(hostPeerId, {
      reliable: true,
      serialization: "json",
    });
    conn.on("open", () => {
      this.connections.set(hostPeerId, conn);
      conn.send({ type: "request_state" });
    });
    conn.on("data", (data: unknown) => {
      const msg = data as SyncMessage;
      this.handleHostMessage(msg);
    });
    conn.on("close", () => {
      this.connections.delete(hostPeerId);
    });
    conn.on("error", () => {
      this.connections.delete(hostPeerId);
    });
  }

  private handleViewerMessage(msg: SyncMessage, conn: DataConnection): void {
    switch (msg.type) {
      case "request_state":
        this.sendFullState(conn);
        break;
      case "session_state":
        this.state = { ...this.state, ...msg.state };
        this.notifyListeners();
        this.bc?.postMessage(msg);
        break;
      case "building_select":
        this.state = { ...this.state, selectedBuildingId: msg.id };
        this.notifyListeners();
        break;
    }
  }

  private handleHostMessage(msg: SyncMessage): void {
    switch (msg.type) {
      case "session_state":
        // Only allow non-animation state updates from viewers
        this.state = {
          ...this.state,
          ...msg.state,
          playing: this.state.playing,
          speed: this.state.speed,
        };
        this.notifyListeners();
        break;
      case "building_select":
        this.state = { ...this.state, selectedBuildingId: msg.id };
        this.notifyListeners();
        break;
    }
  }

  private broadcast(msg: SyncMessage): void {
    this.bc?.postMessage(msg);
  }
}
