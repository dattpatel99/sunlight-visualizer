/**
 * GardeningChat — collapsible chat panel for the Fern gardening agent.
 *
 * API key: stored in sessionStorage under "gardener_openai_key".
 * Users should close their tab when done to clear the key from memory.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GardenerAgent, type ChatMessage, type GardenerContext } from "../lib/gardener/GardenerAgent";
import { loadPreferences, savePreferences, ONSBOARDING_OPTIONS, type GardenerPreferences } from "../lib/gardener/userPreferences";
import { loadMemory, saveMemory, type GardenerMemory } from "../lib/gardener/gardenerMemory";
import { buildContextLabel } from "../lib/gardener/GardenerAgent";

interface GardeningChatProps {
  location: { lat: number; lng: number } | null;
  facades: import("../lib/facadeUtils").FacadeExposure[];
  selectedFacade: string | null;
  onPlantSuggestions: (plantIds: string[]) => void;
}

const HISTORY_KEY = "gardener_chat_history";
const MAX_HISTORY = 50;

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    // localStorage full
  }
}

export function GardeningChat({ location, facades, selectedFacade, onPlantSuggestions }: GardeningChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    try { return sessionStorage.getItem("gardener_openai_key"); } catch { return null; }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [, setPrefs] = useState<GardenerPreferences>(() => loadPreferences());
  const [mem, setMem] = useState<GardenerMemory>(() => loadMemory());
  const [pendingPrefAnswer, setPendingPrefAnswer] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentRef = useRef<GardenerAgent | null>(null);

  const gardenerContext: GardenerContext = useMemo(() => ({
    location: location ?? null,
    facades,
    selectedFacade,
  }), [location, facades, selectedFacade]);

  useEffect(() => {
    agentRef.current = new GardenerAgent(gardenerContext);
    agentRef.current.loadWeather().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!agentRef.current) return;
    const ids = agentRef.current.getPassivePlantSuggestions();
    onPlantSuggestions(ids);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facades, selectedFacade, location]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const agent = agentRef.current;
    if (!agent) return;

    setTyping(true);

    try {
      const resp = await agent.send(text);

      if (resp.memoryUpdate) {
        let updatedMem = mem;
        if (resp.memoryUpdate.displayName) {
          updatedMem = { ...updatedMem, displayName: resp.memoryUpdate.displayName };
          setPrefs((p) => ({ ...p, displayName: resp.memoryUpdate!.displayName }));
        }
        if (resp.memoryUpdate.plantHistory) {
          const h = resp.memoryUpdate.plantHistory;
          updatedMem = {
            ...updatedMem,
            plantHistory: [
              ...updatedMem.plantHistory.filter((x: { plantId: string }) => x.plantId !== h.plantId),
              { ...h, seasonPlanted: "unknown", year: new Date().getFullYear() },
            ],
          };
        }
        if (resp.memoryUpdate.theme) {
          const theme = resp.memoryUpdate.theme.toLowerCase().trim();
          if (!updatedMem.conversationThemes.includes(theme)) {
            updatedMem = {
              ...updatedMem,
              conversationThemes: [...updatedMem.conversationThemes.slice(-19), theme],
            };
          }
        }
        updatedMem.lastInteraction = new Date().toISOString();
        saveMemory(updatedMem);
        setMem(updatedMem);
      }

      const newMessages = agent.getMessages();
      setMessages([...newMessages]);
      saveHistory(newMessages);

      if (resp.suggestedPlants.length > 0) {
        onPlantSuggestions(resp.suggestedPlants);
      }

      if (resp.prefQuestion) {
        setPendingPrefAnswer(resp.prefQuestion.type);
      }
    } finally {
      setTyping(false);
    }
  }, [input, typing, mem, onPlantSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSaveKey = useCallback(() => {
    const trimmed = keyValue.trim();
    if (!trimmed) return;
    try {
      sessionStorage.setItem("gardener_openai_key", trimmed);
      setApiKey(trimmed);
      setShowKeyInput(false);
      setKeyValue("");
      agentRef.current = new GardenerAgent(gardenerContext);
      agentRef.current.loadWeather().catch(() => {});
    } catch {
      // ignore
    }
  }, [keyValue, gardenerContext]);

  const handlePrefAnswer = useCallback((answer: string) => {
    const q = pendingPrefAnswer;
    setPendingPrefAnswer(null);
    if (!q) return;

    let updatedPrefs: Partial<GardenerPreferences> = {};

    switch (q) {
      case "name":
        updatedPrefs = { displayName: answer };
        break;
      case "location":
        updatedPrefs = {
          gardenLocation: answer.toLowerCase().includes("inside")
            ? "indoor"
            : answer.toLowerCase().includes("both")
            ? "both"
            : "outdoor",
        };
        break;
      case "experience":
        if (answer.toLowerCase().includes("total") || answer.toLowerCase().includes("beginner"))
          updatedPrefs = { experience: "beginner" };
        else if (answer.toLowerCase().includes("seasoned") || answer.toLowerCase().includes("expert"))
          updatedPrefs = { experience: "expert" };
        else
          updatedPrefs = { experience: "intermediate" };
        break;
      case "water":
        if (answer.toLowerCase().includes("every day")) updatedPrefs = { waterFrequency: "daily" };
        else if (answer.toLowerCase().includes("few days")) updatedPrefs = { waterFrequency: "few-days" };
        else if (answer.toLowerCase().includes("once a week") || answer.toLowerCase().includes("busy"))
          updatedPrefs = { waterFrequency: "weekly" };
        else updatedPrefs = { waterFrequency: "forgetful" };
        break;
      case "pets":
        updatedPrefs = { petsOrKids: answer.toLowerCase().includes("yes") };
        break;
      case "goals":
        updatedPrefs = { goals: [answer] };
        break;
      case "seasons":
        updatedPrefs = { favoriteSeasons: [answer as GardenerPreferences["favoriteSeasons"][0]] };
        break;
    }

    savePreferences(updatedPrefs);
    setPrefs((p) => ({ ...p, ...updatedPrefs }));
    agentRef.current = new GardenerAgent(gardenerContext);
    agentRef.current.loadWeather().catch(() => {});
  }, [pendingPrefAnswer, gardenerContext]);

  const contextLabel = agentRef.current
    ? buildContextLabel(gardenerContext, null)
    : "Loading…";

  return (
    <div style={containerStyle}>
      {/* Header / toggle */}
      <div style={headerStyle} onClick={() => setOpen((o) => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={avatarStyle}>🌿</span>
          <div>
            <div style={nameStyle}>Fern</div>
            <div style={statusStyle}>{contextLabel}</div>
          </div>
        </div>
        <button style={toggleBtn} aria-label={open ? "Collapse chat" : "Expand chat"}>
          {open ? "▴" : "▾"}
        </button>
      </div>

      {/* Chat body */}
      {open && (
        <div style={bodyStyle}>
          {/* API key banner */}
          {!apiKey && (
            <div style={keyBannerStyle}>
              <span>🔑 Enter your OpenAI API key to chat with Fern</span>
              {!showKeyInput ? (
                <button style={keyBannerBtn} onClick={(e) => { e.stopPropagation(); setShowKeyInput(true); }}>
                  Add Key
                </button>
              ) : (
                <div style={{ display: "flex", gap: 4, marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    style={keyInputStyle}
                    placeholder="sk-..."
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveKey(); }}
                    autoFocus
                  />
                  <button style={keyBannerBtn} onClick={handleSaveKey}>Save</button>
                </div>
              )}
              <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                Stored in your browser only. Close tab when done.
              </div>
            </div>
          )}

          {apiKey && !showKeyInput && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 12px 0" }}>
              <button
                style={{ fontSize: 9, background: "none", border: "none", color: "#9ca3af", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setShowKeyInput(true)}
              >
                Change API key
              </button>
            </div>
          )}

          {/* Messages */}
          <div style={messagesStyle}>
            {messages.length === 0 && !typing && (
              <div style={emptyStyle}>
                🌿 Hi! I&apos;m Fern, your gardening assistant. Select a building and I&apos;ll suggest plants for your walls based on sunlight, weather, and your preferences.
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...msgRowStyle,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && <div style={botAvatar}>🌿</div>}
                <div
                  style={{
                    ...msgBubbleStyle,
                    background: msg.role === "user" ? "#d1fae5" : "#f3f4f6",
                    color: msg.role === "user" ? "#065f46" : "#374151",
                    maxWidth: "78%",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ ...msgRowStyle, justifyContent: "flex-start" }}>
                <div style={botAvatar}>🌿</div>
                <div style={{ ...msgBubbleStyle, background: "#f3f4f6", color: "#9ca3af" }}>
                  typing…
                </div>
              </div>
            )}

            {pendingPrefAnswer && (ONSBOARDING_OPTIONS as Record<string, string[]>)[pendingPrefAnswer] && (
              <div style={{ ...msgRowStyle, justifyContent: "flex-start" }}>
                <div style={botAvatar}>🌿</div>
                <div style={{ ...msgBubbleStyle, background: "#eff6ff", maxWidth: "85%" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Quick question:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {((ONSBOARDING_OPTIONS as Record<string, string[]>)[pendingPrefAnswer] ?? []).map((opt, i) => (
                      <button
                        key={i}
                        style={prefBtn}
                        onClick={() => handlePrefAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div style={inputRowStyle}>
            <textarea
              ref={textareaRef}
              style={textareaStyle}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Fern about plants for your walls…"
              disabled={typing}
              rows={1}
            />
            <button
              style={{ ...sendBtnStyle, opacity: input.trim() && !typing ? 1 : 0.4 }}
              onClick={handleSend}
              disabled={!input.trim() || typing}
              aria-label="Send"
            >
              ➤
            </button>
          </div>

          <div style={safetyNote}>
            🔐 Your API key is stored only in this browser tab. Close the tab when done.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  border: "1px solid #d1fae5",
  borderRadius: 10,
  background: "#fafffe",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  cursor: "pointer",
  userSelect: "none",
};

const avatarStyle: React.CSSProperties = { fontSize: 22, lineHeight: 1 };
const nameStyle: React.CSSProperties = { fontWeight: 700, fontSize: 14, color: "#065f46", lineHeight: 1.2 };
const statusStyle: React.CSSProperties = { fontSize: 10, color: "#6b7280" };
const toggleBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6b7280", padding: "2px 4px" };

const bodyStyle: React.CSSProperties = {
  borderTop: "1px solid #d1fae5",
  display: "flex",
  flexDirection: "column",
  maxHeight: 380,
};

const keyBannerStyle: React.CSSProperties = {
  background: "#fffbeb",
  borderBottom: "1px solid #fef3c7",
  padding: "8px 12px",
  fontSize: 11,
  color: "#92400e",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const keyBannerBtn: React.CSSProperties = {
  fontSize: 11,
  background: "#f59e0b",
  border: "none",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
  color: "#fff",
  width: "fit-content",
};

const keyInputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 11,
  border: "1px solid #d1fae5",
  borderRadius: 4,
  padding: "3px 6px",
  outline: "none",
};

const messagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minHeight: 120,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  textAlign: "center",
  padding: "20px 12px",
  lineHeight: 1.5,
};

const msgRowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: 6 };
const botAvatar: React.CSSProperties = { fontSize: 18, flexShrink: 0, lineHeight: 1 };

const msgBubbleStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: "7px 11px",
  fontSize: 12,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const prefBtn: React.CSSProperties = {
  fontSize: 11,
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
  textAlign: "left",
  color: "#374151",
  transition: "background 0.1s",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 6,
  padding: "8px 12px",
  borderTop: "1px solid #f3f4f6",
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 12,
  border: "1px solid #d1fae5",
  borderRadius: 8,
  padding: "6px 10px",
  outline: "none",
  resize: "none",
  fontFamily: "inherit",
  lineHeight: 1.4,
  minHeight: 34,
  maxHeight: 120,
  overflowY: "auto",
  background: "#fff",
};

const sendBtnStyle: React.CSSProperties = {
  background: "#059669",
  border: "none",
  borderRadius: 8,
  width: 34,
  height: 34,
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const safetyNote: React.CSSProperties = {
  fontSize: 9,
  color: "#d1d5db",
  textAlign: "center",
  padding: "2px 12px 6px",
};
