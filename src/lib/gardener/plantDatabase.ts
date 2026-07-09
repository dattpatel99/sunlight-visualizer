/**
 * Plant database — client-side JSON with ~80 common edible/ornamental plants.
 * Matching is based on facade sunlight hours + weather conditions + user preferences.
 */

export interface PlantEntry {
  id: string;
  name: string;
  emoji: string;
  category: "vegetable" | "herb" | "fruit" | "flower" | "succulent";
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
  /** Days from seed/seedling to harvest (vegetables/herbs only) */
  daysToHarvest?: number;
  beginnerFriendly: boolean;
  /** Short why-it-fits sentence */
  notes: string;
  /** Toxic to pets or small children */
  toxic?: boolean;
}

// ----------------------------------------------------------------
// Database — ~80 entries across categories
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
    notes: "Needs loose, deep soil. patience rewarded — the sweetness is worth it.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
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
    notes: "Slow-growing but resilient. Theaby in spring or fall.",
    preferredFacades: ["N", "NE", "E", "S", "W"],
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
  },

  // ── SUCCULENTS ─────────────────────────────────────────────────────────────
  {
    id: "echeveria-01",
    name: "Echeveria",
    emoji: "🌵",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "light",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Rosette succulents in rainbow colors. Perfect for a sunny windowsill or wall shelf.",
    preferredFacades: ["S", "SE", "SW", "E", "W"],
  },
  {
    id: "sempervivum-01",
    name: "Sempervivum (Hens & Chicks)",
    emoji: "🌵",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Incredibly hardy — survives snow, drought, and neglect. Produces many offsets.",
    preferredFacades: ["S", "SE", "SW", "E", "W", "N"],
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
  },
  {
    id: "sedum-01",
    name: "Sedum (Stonecrop)",
    emoji: "🌵",
    category: "succulent",
    minDirectSunHours: 4,
    heatTolerance: "heat-loving",
    frostTolerance: "hardy",
    waterNeeds: "low",
    daysToHarvest: 999,
    beginnerFriendly: true,
    notes: "Fall-blooming groundcover. Attracts butterflies and bees. Virtually indestructible.",
    preferredFacades: ["S", "SE", "SW", "E", "W", "N"],
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

/** Score how well a plant fits (0–100). Returns null if fundamentally incompatible. */
function scorePlant(
  plant: PlantEntry,
  facade: FacadeExposureInput,
  weather: WeatherInput,
  prefs: UserPrefsInput
): number | null {
  // Hard blocks
  if (plant.minDirectSunHours > facade.sunlightHours) return null;
  if (plant.minDirectSunHours > (plant.maxDirectSunHours ?? 999)) return null;
  if (prefs.petsOrKids && plant.toxic) return null;
  if (prefs.avoidPlants.includes(plant.id)) return null;

  let score = 50; // base

  // Sun match (the more direct sun it gets beyond minimum, the better, capped at 10h)
  const sunScore = Math.min(facade.sunlightHours / 10, 1) * 20;
  score += sunScore;

  // Beginner bonus
  if (plant.beginnerFriendly && prefs.experience === "beginner") score += 15;

  // Frost penalty
  if (weather.frostToday && plant.frostTolerance === "none") score -= 30;
  if (weather.frostToday && plant.frostTolerance === "light") score -= 10;

  // Heat penalty
  if (weather.todayHigh > 32 && plant.heatTolerance === "cool") score -= 20;
  if (weather.todayHigh > 32 && plant.heatTolerance === "moderate") score -= 5;
  if (weather.todayLow < 5 && plant.heatTolerance === "heat-loving") score -= 15;

  // Water preference match
  if (prefs.waterFrequency === "daily" && plant.waterNeeds === "low") score -= 10;
  if (prefs.waterFrequency === "forgetful" && plant.waterNeeds === "high") score -= 25;
  if (prefs.waterFrequency === "forgetful" && plant.waterNeeds === "low") score += 15;

  // Goal match bonus
  if (prefs.goals.includes("fresh herbs") && plant.category === "herb") score += 10;
  if (prefs.goals.includes("saves money") && (plant.category === "vegetable" || plant.category === "herb")) score += 5;
  if (prefs.goals.includes("pretty flowers") && plant.category === "flower") score += 10;

  // Facade preference
  if (plant.preferredFacades?.includes(facade.direction)) score += 15;
  if (plant.avoidFacades?.includes(facade.direction)) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Match plants to a facade direction given current weather + user preferences.
 * Returns top `limit` plants sorted by score descending.
 */
export function matchPlantsToFacade(
  facade: FacadeExposureInput,
  weather: WeatherInput,
  prefs: UserPrefsInput,
  limit = 8
): PlantEntry[] {
  const scored = PLANTS
    .map((p) => ({ plant: p, score: scorePlant(p, facade, weather, prefs) }))
    .filter((s): s is { plant: PlantEntry; score: number } => s.score !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.plant);
}

/**
 * Return all plants that are broadly compatible with a given sun-hour range.
 * Used for the passive always-visible plant panel.
 */
export function getPlantsForSunHours(
  sunlightHours: number,
  limit = 8
): PlantEntry[] {
  return PLANTS
    .filter((p) => p.minDirectSunHours <= sunlightHours)
    .filter((p) => (p.maxDirectSunHours ?? 999) >= sunlightHours)
    .slice(0, limit);
}

export { PLANTS };
