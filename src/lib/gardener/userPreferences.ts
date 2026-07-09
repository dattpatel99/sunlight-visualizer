/**
 * User preferences for the gardening agent.
 * Stored in localStorage under the key "gardener_preferences".
 * The agent asks for these gradually and never assumes.
 */

export interface GardenerPreferences {
  displayName?: string;
  gardenLocation: "indoor" | "outdoor" | "both";
  experience: "beginner" | "intermediate" | "expert";
  waterFrequency: "daily" | "few-days" | "weekly" | "forgetful";
  petsOrKids: boolean;
  goals: string[];
  avoidPlants: string[];
  favoriteSeasons: ("spring" | "summer" | "fall" | "winter")[];
  /** Set once the user has completed initial onboarding */
  onboarded: boolean;
  lastUpdated: string; // ISO date
}

const STORAGE_KEY = "gardener_preferences";

const DEFAULT_PREFERENCES: GardenerPreferences = {
  gardenLocation: "outdoor",
  experience: "beginner",
  waterFrequency: "few-days",
  petsOrKids: false,
  goals: [],
  avoidPlants: [],
  favoriteSeasons: [],
  onboarded: false,
  lastUpdated: new Date().toISOString(),
};

export function loadPreferences(): GardenerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: Partial<GardenerPreferences>): GardenerPreferences {
  const current = loadPreferences();
  const updated: GardenerPreferences = {
    ...current,
    ...prefs,
    lastUpdated: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full — continue without saving
  }
  return updated;
}

export function clearPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns the next unanswered onboarding question for the agent to ask.
 * Questions are asked one at a time to avoid overwhelming the user.
 */
export type OnboardingQuestion =
  | { type: "name";       question: string }
  | { type: "location";   question: string }
  | { type: "experience"; question: string }
  | { type: "water";      question: string }
  | { type: "pets";       question: string }
  | { type: "goals";     question: string }
  | { type: "seasons";    question: string }
  | null; // all answered

export type OnboardingOptionKey = "name" | "location" | "experience" | "water" | "pets" | "goals" | "seasons";

export function getNextOnboardingQuestion(prefs: GardenerPreferences): OnboardingQuestion {
  if (!prefs.displayName) {
    return {
      type: "name",
      question: "Hey there! I'm Fern 🌿, your gardening assistant. What should I call you?",
    };
  }
  if (!prefs.gardenLocation || prefs.gardenLocation === "outdoor" && !prefs.onboarded) {
    return {
      type: "location",
      question: "Will your plants live mostly indoors, outdoors, or a mix of both?",
    };
  }
  if (!prefs.onboarded) {
    return {
      type: "experience",
      question: "How would you describe your gardening experience? Total beginner, some experience, or seasoned green thumb?",
    };
  }
  return null;
}

export const ONSBOARDING_OPTIONS: Record<OnboardingOptionKey, string[]> = {
  name: [],
  location: ["Outdoors (balcony, garden, rooftop)", "Indoors (windowsill, greenhouse)", "Both — I have indoor and outdoor plants"],
  experience: ["Total beginner — I've killed every plant I've ever owned 😅", "Some experience — I've kept a few plants alive", "Seasoned gardener — I know my way around a garden"],
  water: ["Every day — I'm happy to water daily", "Every few days — a couple times a week", "Once a week — I'm a busy person", "Honestly? I forget to water... 😅"],
  pets: ["Yes — I have pets or young kids I need to be careful around", "No — no worries about toxic plants for me"],
  goals: ["Fresh herbs for cooking", "Homegrown vegetables to save money", "Beautiful flowers to enjoy", "Low-maintenance plants I can't easily kill", "A bit of everything!"],
  seasons: ["Spring — I want to grow cool-season crops", "Summer — heat-loving plants and big harvests", "Fall — extending the season with late crops", "Winter — I have a greenhouse or indoor setup"],
};
