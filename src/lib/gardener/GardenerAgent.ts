/**
 * GardenerAgent — builds prompts, calls OpenAI, and returns structured responses.
 *
 * API key: stored in sessionStorage under "gardener_openai_key".
 * When the user provides a key it is stored there; the key is sent to OpenAI
 * directly from the browser over HTTPS (TLS). Users should close their tab
 * when done to clear the key from memory.
 *
 * Graceful degradation:
 * - No API key → returns a setup-prompt response
 * - Network error / non-429 → returns an error message response
 * - 429 (quota exhausted) → returns quota_exhausted error
 * - 401 / 403 → returns auth_error with suggestion to check key
 */

import { fetchWeather, weatherSummary, type WeatherData } from "./weatherService";
import { matchPlantsToFacade, getPlantsForSunHours } from "./plantDatabase";
import { loadPreferences, type GardenerPreferences } from "./userPreferences";
import { loadMemory, memorySummary, bumpInteraction, type GardenerMemory } from "./gardenerMemory";
import type { LatLng } from "../../types";
import type { FacadeExposure } from "../facadeUtils";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
}

export interface AgentResponse {
  message: string;          // text to display
  suggestedPlants: string[]; // plant IDs to show as cards
  /** If set, the chat should show a quick preference question */
  prefQuestion?: {
    type: string;
    options: string[];
  };
  /** Memory updates to persist */
  memoryUpdate?: {
    displayName?: string;
    plantHistory?: { plantId: string; outcome: "success" | "failure" | "unknown"; notes: string };
    theme?: string;
  };
  error?: "no_key" | "quota_exhausted" | "auth_error" | "network_error";
}

export interface GardenerContext {
  location: LatLng | null;
  facades: FacadeExposure[];
  selectedFacade: string | null;
}

// ----------------------------------------------------------------
// System prompt
// ----------------------------------------------------------------

const SYSTEM_PROMPT = `You are Fern 🌿, a warm, knowledgeable, and encouraging gardening assistant. You live inside a sunlight visualizer app that helps people understand how much sun their building walls get throughout the day.

Your personality:
- Warm, curious, and patient — like a wise neighbor who loves plants
- You NEVER say "you should" or "you must" — you suggest, never prescribe
- You celebrate small wins and are never condescending
- You ask ONE question at a time when learning about the user
- You reference specific data: facade direction, sun hours, weather
- If you don't know something, you say so honestly

IMPORTANT — Key instructions:
- NEVER mention OpenAI, GPT, or AI models to the user
- NEVER make up plant care instructions — stick to the plant database you have
- If the user asks about a plant you don't have in your database, say so honestly
- If weather or facade data is unavailable, work with what you have and mention it
- Keep responses conversational — 2-4 short paragraphs max, never walls of text
- Use emoji sparingly but purposefully (🌱🌿🍅🌻etc.)

You have access to:
- A plant database with ~80 plants (vegetables, herbs, fruits, flowers, succulents)
- Weather data for the user's location (temperature, rain, frost, UV)
- The user's facade sunlight analysis (which walls get how many sun hours)
- The user's stated preferences and past plant history

Always try to connect: "Your [FACADE] wall gets [X] hours of sun — that's perfect for [PLANT]!"

Format your responses with **at most** these sections (only include what's relevant):
1. A brief conversational greeting/reaction
2. The plant suggestion(s) with a one-line reason per plant
3. A weather tip if relevant today
4. One question to continue the conversation (or none if closing naturally)

Your output must be valid JSON:
{
  "message": "your response text, 2-4 paragraphs max",
  "suggestedPlants": ["plant-id-1", "plant-id-2"],
  "prefQuestion": null OR { "type": "experience", "options": ["option A", "option B"] },
  "memoryUpdate": null OR { "displayName": "...", "plantHistory": { ... }, "theme": "..." },
  "error": null
}

IMPORTANT: Only output JSON. No markdown code fences, no explanation outside the JSON.`;

// ----------------------------------------------------------------
// API call
// ----------------------------------------------------------------

/** Models the user can choose in Fern settings. */
export const FERN_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1"] as const;
export type FernModel = (typeof FERN_MODELS)[number];

const MODEL_KEY = "gardener_openai_model";

export function getStoredModel(): FernModel {
  try {
    const m = sessionStorage.getItem(MODEL_KEY);
    if (m && (FERN_MODELS as readonly string[]).includes(m)) return m as FernModel;
  } catch {
    // ignore
  }
  return "gpt-4o-mini";
}

export function setStoredModel(model: FernModel): void {
  try {
    sessionStorage.setItem(MODEL_KEY, model);
  } catch {
    // ignore
  }
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model: string
): Promise<{ raw: string }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (res.status === 429) {
    // quota info ignored
    throw new Error("quota_exhausted");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("auth_error");
  }
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  return { raw: json.choices?.[0]?.message?.content ?? "" };
}

// ----------------------------------------------------------------
// Main agent class
// ----------------------------------------------------------------

export class GardenerAgent {
  private context: GardenerContext;
  private messages: ChatMessage[];
  private prefs: GardenerPreferences;
  private memory: GardenerMemory;
  private weather: WeatherData | null = null;

  constructor(context: GardenerContext) {
    this.context = context;
    this.prefs = loadPreferences();
    this.memory = loadMemory();
    this.messages = [];
  }

  /** Load weather for the user's location. Safe to call even if no location. */
  async loadWeather(): Promise<void> {
    if (!this.context.location) return;
    try {
      this.weather = await fetchWeather(this.context.location);
    } catch {
      this.weather = null;
    }
  }

  /** Build the system + context + conversation messages for the API call */
  private buildMessages(newUserText: string): Array<{ role: string; content: string }> {
    const parts: string[] = [];

    // Context block
    parts.push("=== LOCATION & WEATHER ===");
    if (this.context.location) {
      parts.push(`Location: ${this.context.location.lat.toFixed(4)}, ${this.context.location.lng.toFixed(4)}`);
    }
    if (this.weather) {
      parts.push(weatherSummary(this.weather));
    } else if (this.context.location) {
      parts.push("Weather: not yet loaded — mention it if plants depend on current conditions");
    } else {
      parts.push("Weather: no location set — focus on general plant suggestions");
    }

    // Facade block
    parts.push("\n=== FACADE SUNLIGHT ===");
    if (this.context.facades.length > 0) {
      for (const f of this.context.facades) {
        parts.push(
          `- ${f.direction} wall: ${f.sunlightHours.toFixed(1)} sun hours/day | ${(f.intensity ?? 0).toFixed(0)} W/m² now | ${(f.dailyEnergy ?? 0).toFixed(0)} Wh/m²·day`
        );
      }
      if (this.context.selectedFacade) {
        const sel = this.context.facades.find((f) => f.direction === this.context.selectedFacade);
        if (sel) {
          parts.push(`\nUser has selected the ${sel.direction} wall for focused plant advice.`);
        }
      }
    } else {
      parts.push("No building selected yet — give general suggestions based on what you know.");
    }

    // User preferences block
    parts.push("\n=== USER PREFERENCES ===");
    parts.push(`Garden location: ${this.prefs.gardenLocation}`);
    parts.push(`Experience: ${this.prefs.experience}`);
    parts.push(`Watering: ${this.prefs.waterFrequency}`);
    parts.push(`Pets/kids: ${this.prefs.petsOrKids ? "Yes — avoid toxic plants" : "No restrictions"}`);
    parts.push(`Goals: ${this.prefs.goals.length > 0 ? this.prefs.goals.join(", ") : "not specified yet"}`);
    parts.push(`Avoid plants: ${this.prefs.avoidPlants.length > 0 ? this.prefs.avoidPlants.join(", ") : "none"}`);

    // Memory block
    parts.push("\n=== MEMORY & HISTORY ===");
    parts.push(memorySummary(this.memory));

    const contextText = parts.join("\n");

    // System
    const msgs: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextText },
    ];

    // Conversation history (last 10 messages to keep prompt short)
    const recent = this.messages.slice(-10);
    for (const m of recent) {
      if (m.role === "user") {
        msgs.push({ role: "user", content: m.text });
      } else if (m.role === "assistant") {
        msgs.push({ role: "assistant", content: m.text });
      }
    }

    // New message
    msgs.push({ role: "user", content: newUserText });

    return msgs;
  }

  /** Primary method: send a message and get a structured response */
  async send(text: string): Promise<AgentResponse> {
    const apiKey = this.getApiKey();

    // Record user message
    this.messages.push({
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now(),
    });

    // Bump interaction counter
    this.memory = bumpInteraction(this.memory);

    // No API key → setup prompt
    if (!apiKey) {
      const resp: AgentResponse = {
        message: "Hey there! I'm Fern 🌿, your gardening assistant. To chat with me, you'll need to enter your OpenAI API key — this lets me generate thoughtful responses tailored to your specific wall, weather, and preferences. Your key stays in your browser and is never stored on any server. Want to give it a try?",
        suggestedPlants: this.getPassivePlantSuggestions(),
        prefQuestion: undefined,
        error: "no_key",
      };
      this.messages.push({ id: crypto.randomUUID(), role: "assistant", text: resp.message, timestamp: Date.now() });
      return resp;
    }

    // Build messages
    const apiMessages = this.buildMessages(text);

    try {
      const { raw } = await callOpenAI(apiMessages, apiKey, getStoredModel());

      // Parse JSON
      let parsed: Partial<AgentResponse>;
      try {
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // Raw text returned — wrap it
        parsed = { message: raw, suggestedPlants: [], prefQuestion: undefined };
      }

      const resp: AgentResponse = {
        message: parsed.message ?? "I'm here! Ask me about plants for your walls 🌿",
        suggestedPlants: (parsed.suggestedPlants ?? []).filter(Boolean),
        prefQuestion: parsed.prefQuestion ?? undefined,
        memoryUpdate: parsed.memoryUpdate ?? undefined,
        error: undefined,
      };

      this.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        text: resp.message,
        timestamp: Date.now(),
      });

      return resp;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);

      if (errMsg === "quota_exhausted") {
        const resp: AgentResponse = {
          message: "Looks like your OpenAI API quota has run out for this billing period! 🌱 You can check your usage and top up at **platform.openai.com/settings/billing**. Once you've added credits, try again — I'll still be here!",
          suggestedPlants: this.getPassivePlantSuggestions(),
          error: "quota_exhausted",
        };
        this.messages.push({ id: crypto.randomUUID(), role: "assistant", text: resp.message, timestamp: Date.now() });
        return resp;
      }

      if (errMsg === "auth_error") {
        const resp: AgentResponse = {
          message: "Hmm, that API key doesn't seem to be working — double-check it's the correct key from **platform.openai.com/api-auth**. Keys start with `sk-`. Want to try entering it again?",
          suggestedPlants: this.getPassivePlantSuggestions(),
          error: "auth_error",
        };
        this.messages.push({ id: crypto.randomUUID(), role: "assistant", text: resp.message, timestamp: Date.now() });
        return resp;
      }

      // Network / unknown error
      const resp: AgentResponse = {
        message: "I'm having trouble reaching the AI right now — might be a temporary network hiccup. 🌿 In the meantime, take a look at the plant suggestions below based on your wall's sun exposure!",
        suggestedPlants: this.getPassivePlantSuggestions(),
        error: "network_error",
      };
      this.messages.push({ id: crypto.randomUUID(), role: "assistant", text: resp.message, timestamp: Date.now() });
      return resp;
    }
  }

  /** Get plant suggestions without needing the LLM — for the passive panel */
  getPassivePlantSuggestions(): string[] {
    if (this.context.selectedFacade && this.context.facades.length > 0) {
      const facade = this.context.facades.find((f) => f.direction === this.context.selectedFacade);
      if (facade && this.weather) {
        const matched = matchPlantsToFacade(
          { direction: facade.direction, sunlightHours: facade.sunlightHours },
          {
            currentTemp: this.weather.current.temp,
            todayHigh: this.weather.today.high,
            todayLow: this.weather.today.low,
            frostToday: this.weather.frostToday,
            rainyToday: this.weather.rainyToday,
            uvIndex: this.weather.uvIndex,
          },
          this.prefs,
          {
            location: this.prefs.gardenLocation === "indoor" ? "apartment" : "home",
            benefits: [],
            maintenancePriority: 50,
          },
          6
        );
        return matched.map((s) => s.plant.id);
      }
    }

    // Fallback: show plants for the sunniest facade
    if (this.context.facades.length > 0) {
      const sunniest = [...this.context.facades].sort(
        (a, b) => b.sunlightHours - a.sunlightHours
      )[0];
      const plants = getPlantsForSunHours(sunniest.sunlightHours, 6);
      return plants.map((p) => p.id);
    }

    return [];
  }

  /** Get raw messages for chat history rendering */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /** Check if an API key is set */
  hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  private getApiKey(): string | null {
    try {
      return sessionStorage.getItem("gardener_openai_key") ?? null;
    } catch {
      return null;
    }
  }

  /** Save the API key to sessionStorage */
  saveApiKey(key: string): void {
    try {
      sessionStorage.setItem("gardener_openai_key", key.trim());
    } catch {
      // ignore
    }
  }

  /** Remove the stored API key */
  clearApiKey(): void {
    try {
      sessionStorage.removeItem("gardener_openai_key");
    } catch {
      // ignore
    }
  }
}

// ----------------------------------------------------------------
// Convenience helpers (used by React components)
// ----------------------------------------------------------------

/** Build a short context description string for display in the chat header */
export function buildContextLabel(context: GardenerContext, weather: WeatherData | null): string {
  if (weather) {
    return `${weather.current.condition.emoji} ${weather.current.temp}°C · ${context.selectedFacade ? `${context.selectedFacade} wall selected` : "all walls"}`;
  }
  if (context.selectedFacade) {
    return `${context.selectedFacade} wall selected`;
  }
  if (context.facades.length > 0) {
    return `${context.facades.length} walls analyzed`;
  }
  return "Select a building to get started";
}
