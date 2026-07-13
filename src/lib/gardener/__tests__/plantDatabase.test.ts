import { describe, it, expect } from "vitest";
import {
  PLANTS,
  scorePlant,
  matchPlantsToFacade,
  getPlantsForSunHours,
  BENEFITS,
  MAINTENANCE_LEVELS,
  type PlantEntry,
  type Benefit,
  type GardenFilter,
  type FacadeExposureInput,
  type WeatherInput,
  type UserPrefsInput,
} from "../plantDatabase";

// ── fixtures ────────────────────────────────────────────────────────────────

const byId = (id: string): PlantEntry => {
  const p = PLANTS.find((x) => x.id === id);
  if (!p) throw new Error(`fixture plant not found: ${id}`);
  return p;
};

const mildWeather = (): WeatherInput => ({
  currentTemp: 21,
  todayHigh: 24,
  todayLow: 14,
  frostToday: false,
  rainyToday: false,
  uvIndex: 5,
});

const basePrefs = (over: Partial<UserPrefsInput> = {}): UserPrefsInput => ({
  experience: "beginner",
  waterFrequency: "few-days",
  petsOrKids: false,
  goals: [],
  avoidPlants: [],
  favoriteSeasons: [],
  gardenLocation: "both",
  ...over,
});

const filter = (over: Partial<GardenFilter> = {}): GardenFilter => ({
  location: "apartment",
  benefits: [],
  maintenancePriority: 50,
  ...over,
});

const reasonKinds = (r: { reasons: { kind: string }[] }) => r.reasons.map((x) => x.kind);

// ── enrichment guards ───────────────────────────────────────────────────────

describe("PlantEntry enrichment", () => {
  it("every plant has the new dimensions with valid values", () => {
    for (const p of PLANTS) {
      expect(typeof p.containerFriendly, p.id).toBe("boolean");
      expect(typeof p.indoorSuitable, p.id).toBe("boolean");
      expect(Array.isArray(p.benefits), p.id).toBe(true);
      for (const b of p.benefits) {
        expect(BENEFITS, `${p.id} benefit ${b}`).toContain(b);
      }
      expect(MAINTENANCE_LEVELS, `${p.id} maintenance`).toContain(p.maintenance);
    }
  });

  it("includes indoor air-purifying houseplants for the apartment story", () => {
    const snake = byId("snake-plant-01");
    expect(snake.indoorSuitable).toBe(true);
    expect(snake.containerFriendly).toBe(true);
    expect(snake.benefits).toContain<Benefit>("air-purifying");
    expect(byId("pothos-01").benefits).toContain<Benefit>("air-purifying");
  });
});

// ── scorePlant contract ─────────────────────────────────────────────────────

describe("scorePlant", () => {
  it("scores an indoor air-purifier highly under an apartment/air filter (pet-free)", () => {
    const res = scorePlant(
      byId("snake-plant-01"),
      { direction: "E", sunlightHours: 4 },
      mildWeather(),
      basePrefs({ petsOrKids: false }),
      filter({ location: "apartment", benefits: ["air-purifying"], maintenancePriority: 80 })
    );
    expect(res).not.toBeNull();
    expect(res!.score).toBeGreaterThanOrEqual(85);
    expect(reasonKinds(res!)).toEqual(
      expect.arrayContaining(["benefit-match", "apartment-fit"])
    );
  });

  it("hard-gates a toxic plant when the user has pets or kids", () => {
    const res = scorePlant(
      byId("snake-plant-01"),
      { direction: "E", sunlightHours: 4 },
      mildWeather(),
      basePrefs({ petsOrKids: true }),
      filter({ benefits: ["air-purifying"] })
    );
    expect(res).toBeNull();
  });

  it("surfaces a sun-hungry plant as a low-scoring best-effort fallback, not a hard gate", () => {
    const res = scorePlant(
      byId("sunflower-01"), // needs 6h+
      { direction: "S", sunlightHours: 4 },
      mildWeather(),
      basePrefs(),
      filter({ location: "home" })
    );
    expect(res).not.toBeNull();
    expect(res!.score).toBeLessThan(60);
    expect(res!.sunShortfall).toBe(true);
    expect(reasonKinds(res!)).toContain("sun-shortfall");
  });

  it("low-effort priority excludes high-maintenance plants and favours easy ones", () => {
    const facade: FacadeExposureInput = { direction: "S", sunlightHours: 8 };
    const dahlia = byId("dahlia-01"); // high-maintenance
    const snake = byId("snake-plant-01"); // low-maintenance
    const at = (plant: PlantEntry, mp: number) =>
      scorePlant(plant, facade, mildWeather(), basePrefs(), filter({ location: "home", maintenancePriority: mp }));

    // Low-effort ON (>=70) hard-excludes the fussy plant...
    expect(at(dahlia, 100)).toBeNull();
    expect(at(dahlia, 0)).not.toBeNull();
    // ...and ranks the easy plant at least as high as with no priority.
    expect(at(snake, 100)!.score).toBeGreaterThanOrEqual(at(snake, 0)!.score);
  });

  it("hard-excludes plants that don't match the location or benefit facets", () => {
    const facade: FacadeExposureInput = { direction: "S", sunlightHours: 8 };
    // Apartment requires an indoor-suitable plant — sunflower is outdoor-only.
    expect(
      scorePlant(byId("sunflower-01"), facade, mildWeather(), basePrefs(), filter({ location: "apartment" }))
    ).toBeNull();
    // Benefit filter excludes a plant lacking every chosen benefit.
    expect(
      scorePlant(byId("tomato-01"), facade, mildWeather(), basePrefs(), filter({ benefits: ["air-purifying"] }))
    ).toBeNull();
  });

  it("tolerates missing weather", () => {
    const res = scorePlant(
      byId("snake-plant-01"),
      { direction: "E", sunlightHours: 4 },
      null,
      basePrefs(),
      filter({ benefits: ["air-purifying"] })
    );
    expect(res).not.toBeNull();
    expect(res!.score).toBeGreaterThan(0);
  });
});

// ── matchPlantsToFacade contract ────────────────────────────────────────────

describe("matchPlantsToFacade", () => {
  it("returns a score breakdown sorted descending", () => {
    const list = matchPlantsToFacade(
      { direction: "E", sunlightHours: 4 },
      mildWeather(),
      basePrefs({ petsOrKids: false }),
      filter({ location: "apartment", benefits: ["air-purifying"], maintenancePriority: 60 })
    );
    expect(list.length).toBeGreaterThan(0);
    const scores = list.map((s) => s.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    list.forEach((s) => expect(s).toHaveProperty("reasons"));
  });

  it("shows only plants matching the apartment + benefit facets, nothing more", () => {
    const list = matchPlantsToFacade(
      { direction: "E", sunlightHours: 4 },
      mildWeather(),
      basePrefs({ petsOrKids: false }),
      filter({ location: "apartment", benefits: ["air-purifying"], maintenancePriority: 60 }),
      PLANTS.length
    );
    const ids = list.map((s) => s.plant.id);

    expect(ids).toContain("snake-plant-01");
    expect(ids).toContain("pothos-01");
    // Every returned plant is indoor-suitable AND air-purifying — no outdoor/edible leftovers.
    expect(ids).not.toContain("sunflower-01");
    list.forEach((s) => {
      expect(s.plant.indoorSuitable).toBe(true);
      expect(s.plant.benefits).toContain("air-purifying");
    });
  });

  it("returns an empty list when nothing matches the filters", () => {
    const list = matchPlantsToFacade(
      { direction: "S", sunlightHours: 8 },
      mildWeather(),
      basePrefs(),
      filter({ location: "apartment", benefits: ["cut-flower"] }), // no indoor cut-flowers exist
      PLANTS.length
    );
    expect(list).toEqual([]);
  });

  it("omits hard-gated (toxic) plants for pet/kid households", () => {
    const list = matchPlantsToFacade(
      { direction: "S", sunlightHours: 8 },
      mildWeather(),
      basePrefs({ petsOrKids: true }),
      filter({ location: "home" }),
      99
    );
    expect(list.every((s) => !s.plant.toxic)).toBe(true);
  });
});

describe("getPlantsForSunHours", () => {
  it("still returns plain plants within a sun window", () => {
    const plants = getPlantsForSunHours(4, 6);
    expect(plants.length).toBeGreaterThan(0);
    expect(plants.length).toBeLessThanOrEqual(6);
    plants.forEach((p) => expect(p.minDirectSunHours).toBeLessThanOrEqual(4));
  });
});
