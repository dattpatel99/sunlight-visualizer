import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GardenerAgent,
  type ChatMessage,
  type GardenerContext,
  type AgentResponse,
} from "../../lib/gardener/GardenerAgent";
import { loadMemory, saveMemory, type GardenerMemory } from "../../lib/gardener/gardenerMemory";
import type { LatLng } from "../../types";
import type { FacadeExposure } from "../../lib/facadeUtils";
import { FernSettings } from "./FernSettings";
import { colors, font, radius, shadow, space } from "../../theme";

interface FernProps {
  location: LatLng | null;
  facades: FacadeExposure[];
  selectedFacade: string | null;
}

const HISTORY_KEY = "gardener_chat_history";
const KEY_STORE = "gardener_openai_key";

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveHistory(m: ChatMessage[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(m.slice(-50)));
  } catch {
    /* full */
  }
}

type View = "closed" | "chat" | "settings";

export function Fern({ location, facades, selectedFacade }: FernProps) {
  const [view, setView] = useState<View>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(() => {
    try {
      return !!sessionStorage.getItem(KEY_STORE);
    } catch {
      return false;
    }
  });
  const memRef = useRef<GardenerMemory>(loadMemory());
  const agentRef = useRef<GardenerAgent | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const context: GardenerContext = useMemo(
    () => ({ location: location ?? null, facades, selectedFacade }),
    [location, facades, selectedFacade]
  );

  // (Re)build the agent whenever the surrounding context changes.
  useEffect(() => {
    agentRef.current = new GardenerAgent(context);
    agentRef.current.loadWeather().catch(() => {});
  }, [context]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, typing]);

  const persistMemory = useCallback((update: AgentResponse["memoryUpdate"]) => {
    if (!update) return;
    let m = memRef.current;
    if (update.displayName) m = { ...m, displayName: update.displayName };
    if (update.plantHistory) {
      const h = update.plantHistory;
      m = {
        ...m,
        plantHistory: [
          ...m.plantHistory.filter((x) => x.plantId !== h.plantId),
          { ...h, seasonPlanted: "unknown", year: new Date().getFullYear() },
        ],
      };
    }
    if (update.theme) {
      const theme = update.theme.toLowerCase().trim();
      if (!m.conversationThemes.includes(theme)) {
        m = { ...m, conversationThemes: [...m.conversationThemes.slice(-19), theme] };
      }
    }
    m.lastInteraction = new Date().toISOString();
    memRef.current = m;
    saveMemory(m);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    const agent = agentRef.current;
    if (!text || typing || !agent) return;
    setInput("");
    setError(null);
    setTyping(true);
    try {
      const resp = await agent.send(text);
      persistMemory(resp.memoryUpdate);
      setMessages([...agent.getMessages()]);
      saveHistory(agent.getMessages());
      if (resp.error) setError(resp.error);
    } catch {
      // send() catches network/auth internally; this guards against any unexpected throw.
      setError("network_error");
      if (agent) setMessages([...agent.getMessages()]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, persistMemory]);

  const saveKey = useCallback(
    (key: string) => {
      try {
        sessionStorage.setItem(KEY_STORE, key);
      } catch {
        /* ignore */
      }
      setHasKey(true);
      setError(null);
      agentRef.current = new GardenerAgent(context);
      agentRef.current.loadWeather().catch(() => {});
      setView("chat");
    },
    [context]
  );

  const clearKey = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY_STORE);
    } catch {
      /* ignore */
    }
    setHasKey(false);
  }, []);

  // ── Closed nub ────────────────────────────────────────────────────────────
  if (view === "closed") {
    return (
      <button
        type="button"
        data-testid="fern-nub"
        aria-label="Ask Fern, the gardening assistant"
        onClick={() => setView("chat")}
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: colors.surface,
          border: `1.5px solid ${colors.ink}`,
          boxShadow: shadow.soft,
          fontSize: 28,
          cursor: "pointer",
        }}
      >
        🤖
      </button>
    );
  }

  // ── Panel (chat or settings) ────────────────────────────────────────────────
  return (
    <div
      data-testid="fern-panel"
      style={{
        width: 300,
        height: 380,
        display: "flex",
        flexDirection: "column",
        background: colors.surface,
        border: `1.5px solid ${colors.ink}`,
        borderRadius: radius.card,
        boxShadow: shadow.panel,
        fontFamily: font.ui,
        overflow: "hidden",
      }}
    >
      {view === "settings" ? (
        <FernSettings hasKey={hasKey} onBack={() => setView("chat")} onSaveKey={saveKey} onClearKey={clearKey} />
      ) : (
        <>
          <div style={chatHeader}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Fern</span>
            <button type="button" aria-label="Settings" onClick={() => setView("settings")} style={{ ...iconBtn, marginLeft: "auto" }}>
              ⚙
            </button>
            <button type="button" aria-label="Close Fern" onClick={() => setView("closed")} style={iconBtn}>
              –
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: space.md, display: "flex", flexDirection: "column", gap: space.sm }}>
            {messages.length === 0 && (
              <div style={bubbleAssistant}>
                Hi, I'm Fern 🌿 — ask me what to grow on your walls. I use your facade's sun, today's weather, and
                your filters. {hasKey ? "" : "Add an OpenAI key in ⚙ for richer chat, or just browse the picks."}
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} style={bubbleUser}>
                  {m.text}
                </div>
              ) : (
                <div key={m.id} style={bubbleAssistant}>
                  {m.text}
                </div>
              )
            )}
            {typing && <div style={{ ...bubbleAssistant, color: colors.inkFaint }}>typing…</div>}
            {(error === "no_key" || error === "auth_error") && (
              <button type="button" onClick={() => setView("settings")} style={errorLink}>
                {error === "no_key" ? "Add your API key →" : "Fix your API key →"}
              </button>
            )}
            <div ref={endRef} />
          </div>

          <div style={inputRow}>
            <input
              value={input}
              placeholder="Ask Fern…"
              aria-label="Ask Fern"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={textInput}
            />
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              disabled={typing}
              style={sendBtn}
            >
              ↑
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const chatHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderBottom: `1.5px solid ${colors.hair}`,
};
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 15, color: colors.inkSoft };
const bubbleBase: React.CSSProperties = { maxWidth: "85%", fontSize: 12, padding: "7px 10px", lineHeight: 1.45 };
const bubbleUser: React.CSSProperties = {
  ...bubbleBase,
  alignSelf: "flex-end",
  background: colors.sky,
  color: "#fff",
  borderRadius: "12px 12px 3px 12px",
};
const bubbleAssistant: React.CSSProperties = {
  ...bubbleBase,
  alignSelf: "flex-start",
  background: "#f0f0f0",
  color: colors.ink,
  borderRadius: "12px 12px 12px 3px",
};
const errorLink: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "none",
  border: "none",
  color: colors.sky,
  fontSize: 12,
  cursor: "pointer",
  padding: 0,
};
const inputRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "9px 12px",
  borderTop: `1.5px solid ${colors.hair}`,
};
const textInput: React.CSSProperties = {
  flex: 1,
  height: 30,
  border: "1.5px solid #ccc",
  borderRadius: 15,
  padding: "0 12px",
  fontSize: 12,
};
const sendBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: colors.leaf,
  border: `1.5px solid ${colors.ink}`,
  cursor: "pointer",
  color: colors.ink,
  fontWeight: 700,
};
