import { useState, useEffect, useCallback } from "react";
import type { SessionInfo, SessionState } from "../types/session";

interface SessionPanelProps {
  sessionInfo: SessionInfo | null;
  sessionState: SessionState | null;
  onStartHost: () => void;
  onJoinSession: (roomCode: string) => void;
  onLeave: () => void;
}

export function SessionPanel({
  sessionInfo,
  sessionState,
  onStartHost,
  onJoinSession,
  onLeave,
}: SessionPanelProps) {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const isActive = sessionInfo !== null;
  const isHost = sessionInfo?.role === "host";

  const shareUrl = sessionInfo
    ? `${window.location.origin}${window.location.pathname}?room=${sessionInfo.peerId}`
    : "";

  const copyShareUrl = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  // Auto-join from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room && !isActive) {
      onJoinSession(room);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isActive) {
    return (
      <div style={containerStyle}>
        <div style={labelStyle}>Session</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={onStartHost} style={btnStyle(true)}>
            Host Session
          </button>
          <button
            onClick={() => setOpen(true)}
            style={btnStyle(false)}
            title="Join an existing session"
          >
            Join
          </button>
        </div>

        {open && (
          <div style={joinModalStyle}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>
              Enter the room code or peer ID shared by the host:
            </p>
            <input
              type="text"
              placeholder="e.g. sv.ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && joinCode.trim()) {
                  onJoinSession(joinCode.trim());
                  setOpen(false);
                }
                if (e.key === "Escape") setOpen(false);
              }}
              style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                onClick={() => {
                  if (joinCode.trim()) {
                    onJoinSession(joinCode.trim());
                    setOpen(false);
                  }
                }}
                style={btnStyle(true)}
              >
                Join
              </button>
              <button onClick={() => setOpen(false)} style={btnStyle(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>
        {isHost ? "🟢 Host" : "🔵 Viewer"}{" "}
        <span style={{ fontWeight: 400, fontSize: 10 }}>
          {sessionInfo?.roomCode}
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {isHost && (
          <>
            <button onClick={copyShareUrl} style={btnStyle(false)}>
              {copied ? "✓ Copied!" : "Copy Share Link"}
            </button>
            {sessionState && (
              <span style={badgeStyle()}>
                {sessionState.connectedClients}{" "}
                {sessionState.connectedClients === 1 ? "viewer" : "viewers"}
              </span>
            )}
          </>
        )}
        <button onClick={onLeave} style={{ ...btnStyle(false), color: "#dc2626" }}>
          Leave
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "8px 12px",
  background: "#f9f9f9",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const joinModalStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 6,
  background: "white",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 12,
  zIndex: 100,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  minWidth: 240,
};

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    padding: "4px 10px",
    background: primary ? "#2563eb" : "#f0f0f0",
    color: primary ? "white" : "#333",
    border: "1px solid " + (primary ? "#2563eb" : "#ccc"),
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
  };
}

function badgeStyle(): React.CSSProperties {
  return {
    padding: "2px 8px",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  };
}
