/**
 * Gardener memory — accumulates plant history, conversation themes,
 * and interaction count across sessions to personalize the agent over time.
 * Stored in localStorage under "gardener_memory".
 */

export interface PlantHistoryEntry {
  plantId: string;
  outcome: "success" | "failure" | "unknown";
  notes: string;
  seasonPlanted: string;
  year: number;
}

export interface GardenerMemory {
  plantHistory: PlantHistoryEntry[];
  /** Topics the user has already discussed (for the agent to avoid being repetitive) */
  conversationThemes: string[];
  lastInteraction: string;   // ISO date
  interactionCount: number;
  displayName?: string;
}

const STORAGE_KEY = "gardener_memory";

export function loadMemory(): GardenerMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMemory();
    return JSON.parse(raw);
  } catch {
    return emptyMemory();
  }
}

function emptyMemory(): GardenerMemory {
  return {
    plantHistory: [],
    conversationThemes: [],
    lastInteraction: new Date().toISOString(),
    interactionCount: 0,
  };
}

export function saveMemory(mem: GardenerMemory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...mem,
      lastInteraction: new Date().toISOString(),
    }));
  } catch {
    // localStorage full — continue without saving
  }
}

export function bumpInteraction(mem: GardenerMemory): GardenerMemory {
  const updated = { ...mem, interactionCount: mem.interactionCount + 1 };
  saveMemory(updated);
  return updated;
}

export function addPlantHistory(
  mem: GardenerMemory,
  entry: Omit<PlantHistoryEntry, "year">
): GardenerMemory {
  const updated = {
    ...mem,
    plantHistory: [
      ...mem.plantHistory.filter((p) => p.plantId !== entry.plantId),
      { ...entry, year: new Date().getFullYear() },
    ],
  };
  saveMemory(updated);
  return updated;
}

export function addConversationTheme(mem: GardenerMemory, theme: string): GardenerMemory {
  const normalized = theme.toLowerCase().trim();
  if (mem.conversationThemes.includes(normalized)) return mem;
  const updated = {
    ...mem,
    conversationThemes: [...mem.conversationThemes.slice(-19), normalized], // keep last 20
  };
  saveMemory(updated);
  return updated;
}

export function setDisplayName(mem: GardenerMemory, name: string): GardenerMemory {
  const updated = { ...mem, displayName: name };
  saveMemory(updated);
  return updated;
}

/**
 * Returns a brief memory summary string for inclusion in the agent prompt.
 */
export function memorySummary(mem: GardenerMemory): string {
  const parts: string[] = [];

  if (mem.displayName) {
    parts.push(`User's name is ${mem.displayName}`);
  }

  if (mem.interactionCount > 0) {
    parts.push(`This is conversation #${mem.interactionCount + 1}`);
  }

  if (mem.plantHistory.length > 0) {
    const tried = mem.plantHistory.map((p) => p.plantId).join(", ");
    parts.push(`Plants user has tried: ${tried}`);
    const failures = mem.plantHistory
      .filter((p) => p.outcome === "failure")
      .map((p) => p.plantId);
    if (failures.length > 0) {
      parts.push(`Plants that didn't work out: ${failures.join(", ")}`);
    }
  }

  if (mem.conversationThemes.length > 0) {
    const recent = mem.conversationThemes.slice(-5).join(", ");
    parts.push(`Recent topics discussed: ${recent}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "First conversation — no prior context yet.";
}
