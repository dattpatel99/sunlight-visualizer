/**
 * Plant database — client-side data for ~65 common edible/ornamental/indoor plants.
 * Matching is based on facade sunlight hours + weather + user preferences +
 * the live garden filter (apartment/home, benefits, maintenance priority).
 */

export const BENEFITS = [
  "edible",
  "pollinator",
  "air-purifying",
  "pest-deterrent",
  "cut-flower",
  "medicinal",
  "fragrant",
] as const;
export type Benefit = (typeof BENEFITS)[number];

export const MAINTENANCE_LEVELS = ["low", "medium", "high"] as const;
export type Maintenance = (typeof MAINTENANCE_LEVELS)[number];

export interface PlantEntry {
  id: string;
  name: string;
  emoji: string;
  category: "vegetable" | "herb" | "fruit" | "flower" | "succulent" | "foliage";
  /** Minimum direct sun hours needed on the facade (hours/day) */
  minDirectSunHours: number;
  /** Maximum direct sun hours tolerance (hours/day) — heat-sensitive plants cap out */
  maxDirectSunHours?: number;
  /** Best facade directions (empty = any) */
  preferredFacades?: string[];
  /** Avoid these facade directions */
  avoidFacades?: string[];
  heatTolerance: "cool" | "moderate" | "heat-loving";
  frostTolerance: "none" | "light" | "hardy";
  waterNeeds: "low" | "moderate" | "high";
  /** Days from seed/seedling to harvest (999 = perennial/foliage, no harvest) */
  daysToHarvest?: number;
  beginnerFriendly: boolean;
  /** Short why-it-fits sentence */
  notes: string;
  /** Toxic to pets or small children */
  toxic?: boolean;
  /** Happy grown in a pot/container (balcony, patio, windowsill) */
  containerFriendly: boolean;
  /** Can live indoors near a window (apartment-friendly) */
  indoorSuitable: boolean;
  /** Structured benefits the plant provides — drives the benefit filter */
  benefits: Benefit[];
  /** Overall upkeep level */
  maintenance: Maintenance;
}

// ----------------------------------------------------------------
// Database
// ----------------------------------------------------------------
const PLANTS: PlantEntry[] = [
  // ── VEGETABLES ──────────────────────────────────────────────────────────────
  {
    id: "tomato-01",
    name: "Cherry Tomato",
    emoji: "🍅",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 65,
    beginnerFriendly: true,
    notes: "Thrives on south-facing walls — the reflected heat boosts fruit set.",
    preferredFacades: ["S", "SW", "SE"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "tomato-02",
    name: "Roma Tomato",
    emoji: "🍅",
    category: "vegetable",
    minDirectSunHours: 7,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 75,
    beginnerFriendly: true,
    notes: "Reliable producer; needs consistent watering to prevent blossom end rot.",
    preferredFacades: ["S", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "pepper-bell-01",
    name: "Bell Pepper",
    emoji: "🫑",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Start after last frost; peppers love the warmth of a south-facing spot.",
    preferredFacades: ["S", "SE", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "pepper-jalapeno-01",
    name: "Jalapeño",
    emoji: "🌶️",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Compact and prolific — great for containers on a sunny patio.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "cucumber-01",
    name: "Cucumber",
    emoji: "🥒",
    category: "vegetable",
    minDirectSunHours: 6,
    maxDirectSunHours: 10,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "high",
    daysToHarvest: 55,
    beginnerFriendly: true,
    notes: "Loves warmth but appreciates some afternoon shade in very hot climates.",
    avoidFacades: ["W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "high",
  },
  {
    id: "zucchini-01",
    name: "Zucchini",
    emoji: "🥒",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 50,
    beginnerFriendly: true,
    notes: "Incredibly productive — one plant can feed a household. Loves full sun.",
    preferredFacades: ["S", "SW", "SE"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "bean-runner-01",
    name: "Runner Bean",
    emoji: "🫘",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Beautiful flowers AND edible beans — a dual-purpose plant.",
    preferredFacades: ["S", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible", "pollinator"],
    maintenance: "medium",
  },
  {
    id: "lettuce-01",
    name: "Leaf Lettuce",
    emoji: "🥬",
    category: "vegetable",
    minDirectSunHours: 3,
    maxDirectSunHours: 6,
    heatTolerance: "cool",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 30,
    beginnerFriendly: true,
    notes: "Perfect for east-facing walls — morning sun, afternoon shade prevents bolting.",
    preferredFacades: ["N", "NE", "E", "NW"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "spinach-01",
    name: "Spinach",
    emoji: "🥬",
    category: "vegetable",
    minDirectSunHours: 3,
    maxDirectSunHours: 6,
    heatTolerance: "cool",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 40,
    beginnerFriendly: true,
    notes: "Cool-season champion — plant early spring or fall. Bolts in heat.",
    preferredFacades: ["N", "NE", "E"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "kale-01",
    name: "Curly Kale",
    emoji: "🥬",
    category: "vegetable",
    minDirectSunHours: 4,
    heatTolerance: "cool",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 55,
    beginnerFriendly: true,
    notes: "Frost actually sweetens the leaves. Very forgiving — great for beginners.",
    preferredFacades: ["N", "NE", "E", "NW", "S"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "carrot-01",
    name: "Carrot",
    emoji: "🥕",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 75,
    beginnerFriendly: false,
    notes: "Needs loose, deep soil. Patience rewarded — the sweetness is worth it.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "radish-01",
    name: "Radish",
    emoji: "🥬",
    category: "vegetable",
    minDirectSunHours: 4,
    heatTolerance: "cool",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 25,
    beginnerFriendly: true,
    notes: "Fastest harvest in the garden — ready in as little as 3 weeks. Sow often.",
    preferredFacades: ["N", "NE", "E", "S", "SE"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "beet-01",
    name: "Beet",
    emoji: "🍠",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 55,
    beginnerFriendly: true,
    notes: "Roots and greens are both edible. Handles cool weather well.",
    preferredFacades: ["N", "NE", "E", "S", "SE", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "eggplant-01",
    name: "Eggplant",
    emoji: "🍆",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 80,
    beginnerFriendly: false,
    notes: "Needs warmth and patience — the glossy fruits are worth the wait.",
    preferredFacades: ["S", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "high",
  },
  {
    id: "broccoli-01",
    name: "Broccoli",
    emoji: "🥦",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "cool",
    frostTolerance: "hardy",
    waterNeeds: "high",
    daysToHarvest: 80,
    beginnerFriendly: true,
    notes: "Grows best in cool weather. Harvest the central head, then side shoots keep coming.",
    preferredFacades: ["N", "NE", "E", "S"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "high",
  },
  {
    id: "squash-butternut-01",
    name: "Butternut Squash",
    emoji: "🎃",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 100,
    beginnerFriendly: true,
    notes: "Space-hungry but rewarding — stores for months after harvest.",
    preferredFacades: ["S", "SW", "SE"],
    containerFriendly: false,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "pea-01",
    name: "Sugar Snap Pea",
    emoji: "🫛",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "cool",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 60,
    beginnerFriendly: true,
    notes: "Plant early — peas love cool soil. Eat them straight off the vine.",
    preferredFacades: ["N", "NE", "E", "S", "SE"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible", "pollinator"],
    maintenance: "low",
  },
  {
    id: "cabbage-01",
    name: "Green Cabbage",
    emoji: "🥬",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "cool",
    frostTolerance: "hardy",
    waterNeeds: "high",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Slow-growing but resilient. Sow in spring or fall.",
    preferredFacades: ["N", "NE", "E", "S", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "high",
  },
  {
    id: "onion-01",
    name: "Onion",
    emoji: "🧅",
    category: "vegetable",
    minDirectSunHours: 6,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 100,
    beginnerFriendly: true,
    notes: "Long season but low maintenance. Bulbs size up in long days.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "potato-01",
    name: "Potato",
    emoji: "🥔",
    category: "vegetable",
    minDirectSunHours: 5,
    heatTolerance: "cool",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Plant in soil hilled up around stems. Fun to grow in containers too.",
    preferredFacades: ["N", "NE", "E", "S", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },

  // ── HERBS ──────────────────────────────────────────────────────────────────
  {
    id: "basil-01",
    name: "Sweet Basil",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    maxDirectSunHours: 8,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 25,
    beginnerFriendly: true,
    notes: "Pinch flowers to keep leaves bushy. The more you harvest, the more it grows.",
    preferredFacades: ["S", "SE", "SW"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant"],
    maintenance: "low",
  },
  {
    id: "basil-thai-01",
    name: "Thai Basil",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 30,
    beginnerFriendly: true,
    notes: "More heat-tolerant than sweet basil. Gorgeous purple stems and flowers.",
    preferredFacades: ["S", "SW"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant"],
    maintenance: "low",
  },
  {
    id: "cilantro-01",
    name: "Cilantro",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 3,
    maxDirectSunHours: 6,
    heatTolerance: "cool",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 21,
    beginnerFriendly: true,
    notes: "Bolts quickly in heat — successions of sowing every 2 weeks keeps you in supply.",
    preferredFacades: ["N", "NE", "E", "NW"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "parsley-01",
    name: "Flat-Leaf Parsley",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 4,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Biennial — grows leaves first year, flowers second. Very generous producer.",
    preferredFacades: ["N", "NE", "E", "S", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "mint-01",
    name: "Spearmint",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 3,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "high",
    daysToHarvest: 30,
    beginnerFriendly: true,
    notes: "Spreads aggressively — keep it in a container or it will take over.",
    toxic: true,
    preferredFacades: ["N", "NE", "E", "NW"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant", "pest-deterrent", "medicinal"],
    maintenance: "low",
  },
  {
    id: "oregano-01",
    name: "Oregano",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 45,
    beginnerFriendly: true,
    notes: "Drought-loving — almost thrives on neglect. Mediterranean climate favorite.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant", "pollinator"],
    maintenance: "low",
  },
  {
    id: "thyme-01",
    name: "Common Thyme",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Woody perennial — comes back year after year. Handles poor, dry soil.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant", "pollinator"],
    maintenance: "low",
  },
  {
    id: "rosemary-01",
    name: "Rosemary",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Woody shrub, semi-perennial in mild climates. Incredibly fragrant.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant"],
    maintenance: "low",
  },
  {
    id: "sage-01",
    name: "Garden Sage",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 75,
    beginnerFriendly: true,
    notes: "Velvety leaves, drought-tolerant. Beautiful as an ornamental edible too.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant", "pollinator"],
    maintenance: "low",
  },
  {
    id: "chives-01",
    name: "Chives",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 4,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 30,
    beginnerFriendly: true,
    notes: "Perennial — comes back every spring. Pretty purple flowers are edible too.",
    preferredFacades: ["N", "NE", "E", "S", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "pollinator"],
    maintenance: "low",
  },
  {
    id: "dill-01",
    name: "Dill",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 40,
    beginnerFriendly: true,
    notes: "Attracts beneficial insects. Let some go to seed — volunteers will surprise you.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible", "pollinator"],
    maintenance: "low",
  },
  {
    id: "fennel-01",
    name: "Fennel",
    emoji: "🌿",
    category: "herb",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 65,
    beginnerFriendly: false,
    notes: "Anise-flavored bulb and fronds. Allelopathic — keep away from most vegetables.",
    preferredFacades: ["S", "SE", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible", "pollinator"],
    maintenance: "medium",
  },
  {
    id: "lavender-01",
    name: "English Lavender",
    emoji: "💜",
    category: "herb",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Pollinator magnet. Dried flowers last for months — fragrant sachets year-round.",
    preferredFacades: ["S", "SW", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["pollinator", "fragrant", "medicinal"],
    maintenance: "low",
  },

  // ── FRUITS ─────────────────────────────────────────────────────────────────
  {
    id: "strawberry-01",
    name: "Strawberry",
    emoji: "🍓",
    category: "fruit",
    minDirectSunHours: 6,
    heatTolerance: "moderate",
    frostTolerance: "light",
    waterNeeds: "moderate",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Compact enough for containers or hanging baskets. Produces runners to expand your patch.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },
  {
    id: "blueberry-01",
    name: "Blueberry",
    emoji: "🫐",
    category: "fruit",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 140,
    beginnerFriendly: false,
    notes: "Needs acidic soil (pH 4.5–5.5). Patience — full production in year 3.",
    preferredFacades: ["S", "SE", "NE", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "high",
  },
  {
    id: "lemon-01",
    name: "Dwarf Lemon",
    emoji: "🍋",
    category: "fruit",
    minDirectSunHours: 7,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 180,
    beginnerFriendly: false,
    notes: "Perfect for large containers on a hot south-facing wall. Bring inside in winter.",
    preferredFacades: ["S", "SW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["edible", "fragrant"],
    maintenance: "high",
  },
  {
    id: "fig-01",
    name: "Fig",
    emoji: "🍈",
    category: "fruit",
    minDirectSunHours: 7,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 120,
    beginnerFriendly: true,
    notes: "Drought-tolerant once established. In warm climates, produces two crops a year.",
    preferredFacades: ["S", "SW", "W"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "low",
  },
  {
    id: "grape-01",
    name: "Grape Vine",
    emoji: "🍇",
    category: "fruit",
    minDirectSunHours: 7,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 150,
    beginnerFriendly: true,
    notes: "Train along a south-facing wall on wires — the reflected heat improves ripening.",
    preferredFacades: ["S", "SW"],
    toxic: true,
    containerFriendly: false,
    indoorSuitable: false,
    benefits: ["edible"],
    maintenance: "medium",
  },

  // ── FLOWERS ───────────────────────────────────────────────────────────────
  {
    id: "sunflower-01",
    name: "Sunflower",
    emoji: "🌻",
    category: "flower",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 80,
    beginnerFriendly: true,
    notes: "Cheerful and easy. The seeds feed birds too. Kids love watching them grow tall.",
    preferredFacades: ["S", "SW", "SE"],
    containerFriendly: false,
    indoorSuitable: false,
    benefits: ["pollinator", "cut-flower"],
    maintenance: "medium",
  },
  {
    id: "marigold-01",
    name: "Marigold",
    emoji: "🌼",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 50,
    beginnerFriendly: true,
    notes: "Natural pest deterrent — plant near vegetables. Brilliant orange all season.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["pest-deterrent", "pollinator"],
    maintenance: "low",
  },
  {
    id: "zinnia-01",
    name: "Zinnia",
    emoji: "🌸",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 60,
    beginnerFriendly: true,
    notes: "Cut-and-come-again bloomer — the more you cut, the more flowers you get.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["pollinator", "cut-flower"],
    maintenance: "low",
  },
  {
    id: "petunia-01",
    name: "Petunia",
    emoji: "🌺",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 70,
    beginnerFriendly: true,
    notes: "Long-blooming and fragrant. Great in hanging baskets cascading from a sunny wall.",
    preferredFacades: ["S", "SE", "SW", "E"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["fragrant"],
    maintenance: "low",
  },
  {
    id: "geranium-01",
    name: "Geranium",
    emoji: "🌺",
    category: "flower",
    minDirectSunHours: 4,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 90,
    beginnerFriendly: true,
    notes: "Classic balcony plant. Very forgiving of inconsistent watering.",
    preferredFacades: ["S", "SE", "SW", "E", "W", "N"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["fragrant"],
    maintenance: "low",
  },
  {
    id: "nasturtium-01",
    name: "Nasturtium",
    emoji: "🌸",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 50,
    beginnerFriendly: true,
    notes: "Edible flowers with a peppery taste. Act as trap crops for aphids — sacrifice themselves to protect vegetables.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["edible", "pest-deterrent", "pollinator"],
    maintenance: "low",
  },
  {
    id: "cosmos-01",
    name: "Cosmos",
    emoji: "🌸",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 60,
    beginnerFriendly: true,
    notes: "Delicate daisy-like flowers on tall stems. Self-seeds freely — volunteers next year!",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["pollinator", "cut-flower"],
    maintenance: "low",
  },
  {
    id: "dahlia-01",
    name: "Dahlia",
    emoji: "🌸",
    category: "flower",
    minDirectSunHours: 6,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "high",
    daysToHarvest: 90,
    beginnerFriendly: false,
    notes: "Tubers dug up in fall and stored inside. Stunning cut flowers all summer.",
    preferredFacades: ["S", "SE", "SW"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["cut-flower", "pollinator"],
    maintenance: "high",
  },
  {
    id: "chrysanthemum-01",
    name: "Chrysanthemum",
    emoji: "🌼",
    category: "flower",
    minDirectSunHours: 5,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "moderate",
    daysToHarvest: 100,
    beginnerFriendly: true,
    notes: "Fall bloomer — just when everything else is fading. Comes back year after year.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["cut-flower", "pollinator"],
    maintenance: "medium",
  },
  {
    id: "hydrangea-01",
    name: "Hydrangea",
    emoji: "💐",
    category: "flower",
    minDirectSunHours: 3,
    maxDirectSunHours: 6,
    heatTolerance: "moderate",
    frostTolerance: "hardy",
    waterNeeds: "high",
    daysToHarvest: 730,
    beginnerFriendly: true,
    notes: "Iconic shrub — blue in acidic soil, pink in alkaline. Magnificent on a north wall.",
    preferredFacades: ["N", "NE", "NW", "E"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["cut-flower"],
    maintenance: "high",
  },

  // ── SUCCULENTS ─────────────────────────────────────────────────────────────
  {
    id: "echeveria-01",
    name: "Echeveria",
    emoji: "🪷",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Rosette succulents in rainbow colors. Perfect for a sunny windowsill or wall shelf.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: [],
    maintenance: "low",
  },
  {
    id: "sempervivum-01",
    name: "Sempervivum (Hens & Chicks)",
    emoji: "🪷",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Incredibly hardy — survives snow, drought, and neglect. Produces many offsets.",
    preferredFacades: ["S", "SE", "SW", "E", "W", "N"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: [],
    maintenance: "low",
  },
  {
    id: "aloe-vera-01",
    name: "Aloe Vera",
    emoji: "🌵",
    category: "succulent",
    minDirectSunHours: 5,
    heatTolerance: "heat-loving",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Medicinal gel inside the leaves. Beautiful and useful — bring inside if frost threatens.",
    preferredFacades: ["S", "SW", "W"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["medicinal", "air-purifying"],
    maintenance: "low",
  },
  {
    id: "sedum-01",
    name: "Sedum (Stonecrop)",
    emoji: "🪷",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Fall-blooming groundcover. Attracts butterflies and bees. Virtually indestructible.",
    preferredFacades: ["S", "SE", "SW", "E", "W", "N"],
    containerFriendly: true,
    indoorSuitable: false,
    benefits: ["pollinator"],
    maintenance: "low",
  },
  {
    id: "agave-01",
    name: "Agave",
    emoji: "🌵",
    category: "succulent",
    minDirectSunHours: 6,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Architectural rosette plant. Dramatic on a rooftop or sunny patio. Suckers freely.",
    preferredFacades: ["S", "SW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: false,
    benefits: [],
    maintenance: "low",
  },

  // ── INDOOR FOLIAGE / AIR-PURIFYING HOUSEPLANTS ──────────────────────────────
  {
    id: "snake-plant-01",
    name: "Snake Plant",
    emoji: "🪴",
    category: "succulent",
    minDirectSunHours: 0,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Nearly indestructible — tolerates low light and long gaps between watering. A top indoor air-filter.",
    preferredFacades: ["N", "NE", "E", "NW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
  {
    id: "pothos-01",
    name: "Pothos",
    emoji: "🌿",
    category: "foliage",
    minDirectSunHours: 0,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Trailing vine that thrives in low to medium light. A forgiving first houseplant that cleans the air.",
    preferredFacades: ["N", "NE", "E", "NW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
  {
    id: "zz-plant-01",
    name: "ZZ Plant",
    emoji: "🪴",
    category: "foliage",
    minDirectSunHours: 0,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Glossy leaves and water-storing rhizomes — survives weeks of neglect in low light.",
    preferredFacades: ["N", "NE", "E", "NW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
  {
    id: "spider-plant-01",
    name: "Spider Plant",
    emoji: "🌿",
    category: "foliage",
    minDirectSunHours: 1,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Pet-safe and prolific — sends out baby plantlets you can replant. Excellent air cleaner.",
    preferredFacades: ["N", "NE", "E", "W"],
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
  {
    id: "peace-lily-01",
    name: "Peace Lily",
    emoji: "🌱",
    category: "foliage",
    minDirectSunHours: 0,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Elegant white blooms even in low light. Droops to tell you exactly when it's thirsty.",
    preferredFacades: ["N", "NE", "E", "NW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "medium",
  },
  {
    id: "monstera-01",
    name: "Monstera",
    emoji: "🌿",
    category: "foliage",
    minDirectSunHours: 1,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Iconic split leaves. Bright indirect light brings out the dramatic fenestrations.",
    preferredFacades: ["E", "W", "N", "NE"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "medium",
  },
  {
    id: "rubber-plant-01",
    name: "Rubber Plant",
    emoji: "🪴",
    category: "foliage",
    minDirectSunHours: 2,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Burgundy, glossy leaves. Bright indirect light keeps it happy and growing tall.",
    preferredFacades: ["E", "W", "NE"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
  {
    id: "philodendron-01",
    name: "Heartleaf Philodendron",
    emoji: "🌿",
    category: "foliage",
    minDirectSunHours: 1,
    heatTolerance: "moderate",
    frostTolerance: "none",
    waterNeeds: "moderate",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Cascading heart-shaped leaves — one of the easiest trailing houseplants to keep alive.",
    preferredFacades: ["N", "NE", "E", "NW"],
    toxic: true,
    containerFriendly: true,
    indoorSuitable: true,
    benefits: ["air-purifying"],
    maintenance: "low",
  },
];

// ----------------------------------------------------------------
// Types for matching
// ----------------------------------------------------------------

export interface FacadeExposureInput {
  direction: string;
  sunlightHours: number;
}

export interface WeatherInput {
  currentTemp: number;
  todayHigh: number;
  todayLow: number;
  frostToday: boolean;
  rainyToday: boolean;
  uvIndex: number;
}

export interface UserPrefsInput {
  experience: "beginner" | "intermediate" | "expert";
  waterFrequency: "daily" | "few-days" | "weekly" | "forgetful";
  petsOrKids: boolean;
  goals: string[];
  avoidPlants: string[];
  favoriteSeasons: string[];
  gardenLocation: "indoor" | "outdoor" | "both";
}

/** The live filter driven by the garden drawer's wizard + chips. */
export interface GardenFilter {
  location: "apartment" | "home";
  benefits: Benefit[];
  /** 0–100. Higher = the user wants to prioritise low-maintenance plants. */
  maintenancePriority: number;
}

export interface ScoreReason {
  /** Stable key for tests/logic, e.g. "benefit-match", "sun-shortfall". */
  kind: string;
  /** Human-facing text for the "why this scored X%" explainer. */
  label: string;
  /** Signed contribution to the score. */
  delta: number;
}

export interface PlantScore {
  plant: PlantEntry;
  /** 0–100. */
  score: number;
  reasons: ScoreReason[];
  /** True when the facade gets less direct sun than the plant needs. */
  sunShortfall: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Score how well a plant fits the facade, weather, prefs and live filter.
 * Returns a breakdown, or `null` when the plant is fundamentally excluded
 * (toxic for a pet/kid household, or explicitly avoided). Insufficient sun is
 * a heavy penalty, NOT an exclusion — that surfaces best-effort fallback cards.
 */
/** Whether the plant satisfies the user's hard filter facets (location / benefits / low-effort). */
export function plantMatchesFilter(plant: PlantEntry, filter: GardenFilter): boolean {
  if (filter.location === "apartment" && !plant.indoorSuitable) return false;
  if (filter.benefits.length > 0 && !filter.benefits.some((b) => plant.benefits.includes(b))) return false;
  if (filter.maintenancePriority >= LOW_EFFORT_THRESHOLD && plant.maintenance === "high") return false;
  return true;
}

/** maintenancePriority at/above this means "low-effort only" — hides fussy plants. */
export const LOW_EFFORT_THRESHOLD = 70;

export function scorePlant(
  plant: PlantEntry,
  facade: FacadeExposureInput,
  weather: WeatherInput | null,
  prefs: UserPrefsInput,
  filter: GardenFilter
): PlantScore | null {
  // Hard exclusions — the plant simply doesn't belong in the list.
  if (prefs.petsOrKids && plant.toxic) return null;
  if (prefs.avoidPlants.includes(plant.id)) return null;
  // Filter facets are HARD filters: the list shows only plants that match.
  if (!plantMatchesFilter(plant, filter)) return null;

  const reasons: ScoreReason[] = [];
  let score = 50;
  const add = (kind: string, label: string, delta: number) => {
    score += delta;
    reasons.push({ kind, label, delta });
  };

  // Sun fit / shortfall / excess
  let sunShortfall = false;
  if (facade.sunlightHours < plant.minDirectSunHours) {
    sunShortfall = true;
    const gap = plant.minDirectSunHours - facade.sunlightHours;
    add(
      "sun-shortfall",
      `needs ${plant.minDirectSunHours}h+ sun — your facade gets ${facade.sunlightHours.toFixed(0)}h`,
      -Math.min(40, 8 + gap * 8)
    );
  } else if (plant.maxDirectSunHours != null && facade.sunlightHours > plant.maxDirectSunHours) {
    const over = facade.sunlightHours - plant.maxDirectSunHours;
    add("sun-excess", `prefers under ${plant.maxDirectSunHours}h — may scorch here`, -Math.min(20, over * 5));
  } else {
    add("sun-fit", `${facade.sunlightHours.toFixed(0)}h suits its ${plant.minDirectSunHours}h+ need`, 15);
  }

  // Location fit (apartment plants are guaranteed indoor-suitable by the hard filter).
  if (filter.location === "apartment") {
    add("apartment-fit", "thrives indoors in a container", 18);
  } else if (!plant.indoorSuitable) {
    add("home-fit", "happy outdoors in a bed or large pot", 8);
  }

  // Benefit match (guaranteed to overlap by the hard filter when benefits are chosen).
  if (filter.benefits.length) {
    const matched = filter.benefits.filter((b) => plant.benefits.includes(b));
    add("benefit-match", matched.join(", "), Math.min(24, 14 + (matched.length - 1) * 8));
  }

  // Maintenance ranking (high-maintenance plants are already excluded when low-effort is on).
  const mp = clamp(filter.maintenancePriority, 0, 100) / 100;
  if (mp > 0.05) {
    if (plant.maintenance === "low") add("low-maintenance", "easy-going, hard to kill", Math.round(18 * mp));
    else if (plant.maintenance === "medium") add("medium-maintenance", "moderate care", -Math.round(4 * mp));
  }

  // Experience
  if (plant.beginnerFriendly && prefs.experience === "beginner") {
    add("beginner", "beginner-friendly", 8);
  }

  // Weather (optional)
  if (weather) {
    if (weather.frostToday && plant.frostTolerance === "none") add("frost-risk", "frost today — this one is tender", -25);
    else if (weather.frostToday && plant.frostTolerance === "light") add("frost-risk", "light frost today — protect it", -8);
    if (weather.todayHigh > 32 && plant.heatTolerance === "cool") add("heat-risk", "today's heat may stress it", -15);
    if (weather.todayLow < 5 && plant.heatTolerance === "heat-loving") add("cold-risk", "too cold right now for a heat-lover", -12);
  }

  // Water habits
  if (prefs.waterFrequency === "forgetful" && plant.waterNeeds === "high") add("water-mismatch", "thirsty — tough if you forget", -18);
  if (prefs.waterFrequency === "forgetful" && plant.waterNeeds === "low") add("water-match", "drought-tolerant — forgiving", 10);

  // Facade preference
  if (plant.preferredFacades?.includes(facade.direction)) add("facade-preferred", `loves a ${facade.direction} wall`, 12);
  if (plant.avoidFacades?.includes(facade.direction)) add("facade-avoid", `${facade.direction} isn't ideal for it`, -15);

  return { plant, score: clamp(Math.round(score), 0, 100), reasons, sunShortfall };
}

/**
 * Match plants to a facade given weather, prefs and the live filter.
 * Returns a scored breakdown sorted by score descending, top `limit`.
 */
export function matchPlantsToFacade(
  facade: FacadeExposureInput,
  weather: WeatherInput | null,
  prefs: UserPrefsInput,
  filter: GardenFilter,
  limit = 8
): PlantScore[] {
  return PLANTS.map((p) => scorePlant(p, facade, weather, prefs, filter))
    .filter((s): s is PlantScore => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Return all plants broadly compatible with a given sun-hour range.
 * Used for the passive, filter-free plant panel.
 */
export function getPlantsForSunHours(sunlightHours: number, limit = 8): PlantEntry[] {
  return PLANTS.filter((p) => p.minDirectSunHours <= sunlightHours)
    .filter((p) => (p.maxDirectSunHours ?? 999) >= sunlightHours)
    .slice(0, limit);
}

export { PLANTS };
