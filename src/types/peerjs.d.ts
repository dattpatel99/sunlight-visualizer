// Type stub for peerjs DataConnection — avoids cross-referencing peerjs's own .d.ts
// which has SharedArrayBuffer/es2017 types that conflict with our ES2020 lib.
declare module "peerjs" {
  export interface DataConnection {
    readonly peer: string;
    open: boolean;
    readonly reliable: boolean;
    readonly serialization: string;
    send(data: unknown): void;
    close(): void;
    on(event: "open", cb: () => void): void;
    on(event: "data", cb: (data: unknown) => void): void;
    on(event: "close", cb: () => void): void;
    on(event: "error", cb: (err: unknown) => void): void;
  }

  export interface PeerConnectOption {
    reliable?: boolean;
    serialization?: string;
    metadata?: unknown;
    label?: string;
  }

  export interface PeerJSOption {
    host?: string;
    port?: number;
    path?: string;
    secure?: boolean;
    config?: {
      iceServers?: { urls: string }[];
    };
  }

  class Peer {
    constructor(id?: string, options?: PeerJSOption);
    readonly id: string;
    open: boolean;
    connections: Map<string, DataConnection[]>;
    on(event: "open", cb: (id: string) => void): void;
    on(event: "connection", cb: (conn: DataConnection) => void): void;
    on(event: "error", cb: (err: { message: string }) => void): void;
    connect(to: string, options?: PeerConnectOption): DataConnection;
    destroy(): void;
  }
}
