# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173/ (base is "./")
npm run build      # tsc -b (typecheck) then vite build → dist/
npm run preview    # Serve the production build locally
npm test           # vitest run — full suite once (this is what CI runs)
npx vitest         # watch mode during development
npx vitest run src/lib/__tests__/facadeUtils.extended.test.ts   # single test file
npx vitest run -t "cardinal direction"                          # single test by name
npx playwright install chromium   # one-time: browser for e2e
npm run test:e2e                  # Playwright e2e (spins up the dev server itself)
```

There is no separate lint step; type checking happens via `tsc -b` inside `npm run build`.

## Architecture

Client-only React 19 + Three.js SPA. **No backend** — all fetching, math, and rendering happen in the browser. State lives in `App.tsx` via `useState` and flows down through props (no Redux/Zustand/context store).

The pipeline, layered from data to pixels:

1. **`src/lib/` (pure logic)** — no React. `projection.ts` converts WGS84 lat/lng → local XZ meters (Mercator + latitude-cosine correction). `overpass.ts` (OSM Overpass) fetches building footprints — the app's only building source. (`overture.ts` still exists and is unit-tested but is no longer wired into the UI; Overture was removed from the data-source picker.) `buildingGeometry.ts` extrudes 2D footprints into Three.js geometry. `facadeUtils.ts` extracts wall facades, labels them by cardinal direction, and computes per-facade sun exposure. `sunDirection.ts` maps SunCalc azimuth/altitude → a light-position `Vector3`. `geocode.ts` (Nominatim) and `mapTiles.ts` (OSM tiles → ground texture) round out the data layer.
2. **`src/hooks/` (stateful logic)** — `useBuildings` (fetch + project + loading/error state), `useSunPosition` (SunCalc for a location + `Date`), `useFacadeAnalysis` (per-facade exposure for the selected building), `useUrlState` (syncs location/date to the URL hash for shareable links).
3. **`src/components/` (presentation)** — `Scene.tsx` hosts the React Three Fiber `<Canvas>`; `Buildings.tsx`/`Building.tsx`, `Ground.tsx`, `SunLight.tsx`, `Compass.tsx` render the 3D scene. The app shell (the **"1a" design**) is a **full-bleed canvas with floating overlays**, not a sidebar: `App.tsx` composes `components/shell/` (`CircleRail` — one rule: a circle is green iff its panel is open; `OverlayPanel`, `AddressBar`/`FacadeTag`), a bottom time scrubber (`TimeControls`), a left **Buildings & Sun** panel (`LocationInput`, `BuildingInfo`, `FacadeAnalysis`, `SunlightStats`, and a building-list for non-canvas selection), the right **Garden drawer** (`components/garden/`), and **Fern** bottom-left (`components/fern/`). Design tokens live in `src/theme.ts` (colours/spacing/radii/shadow) — reuse them instead of ad-hoc hex.

### Coordinate system conventions

Three.js world space is **+X = east, +Y = up, +Z = south** (so **−Z = north**). This convention is baked into `sunDirection.ts`, `facadeUtils.ts` (`normalToDirection` uses `atan2(nx, -nz)`), and the geometry code — keep it consistent when touching any of them.

### Facade sunlight model (the domain core)

Two **independent** systems produce the "sunlight" you see — do not conflate them:

- **Facade exposure** (`computeFacadeExposure` in `facadeUtils.ts`) is a pure analytic calculation. It samples the sun every 15 min from sunrise to sunset and, per facade, accumulates `dot(normal, sunXZ)` weighted by time. It **ignores occlusion** by neighboring buildings. `FacadeExposure` carries `sunlightHours`, plus optional `intensity` (W/m² now), `dailyEnergy` (Wh/m²/day), and `cosTheta` — the optional fields may be absent, so guard with `?? 0`.
- **Rendered shadows** are Three.js shadow-mapping from a `DirectionalLight` at the sun vector (`SunLight.tsx`). Purely visual, separate code path.

Tunable magic numbers live in `src/constants.ts` (`SUN_DISTANCE`, `SHADOW_MAP_SIZE`, `SHADOW_CAMERA_SIZE`, default building height, `METERS_PER_LEVEL`, `OVERPASS_RADIUS`).

### Gardening agent — "Fern" (`src/lib/gardener/`)

An optional AI gardening assistant layered on top of the facade analysis (branch `feat/gardening-agent`).

- **`GardenerAgent.ts`** builds a context prompt (location + weather + facade sun hours + prefs + memory) and calls **OpenAI** directly from the browser. Model is selectable in Fern settings (`FERN_MODELS`, default `gpt-4o-mini`, stored in `sessionStorage`). It expects a **JSON-only** response and degrades gracefully to passive, database-driven plant suggestions on any error (`no_key` / `quota_exhausted` / `auth_error` / `network_error`).
- **API key handling:** the user's OpenAI key lives in `sessionStorage` under `gardener_openai_key` — never persisted server-side, never committed. Sent to OpenAI over HTTPS from the client.
- **`plantDatabase.ts`** is the domain core of the garden feature: ~65 plants (incl. indoor air-purifying houseplants). Each `PlantEntry` has `containerFriendly`/`indoorSuitable` (apartment vs home), a structured `benefits[]` taxonomy (`BENEFITS`), and an explicit `maintenance` level. **`scorePlant(plant, facade, weather, prefs, filter)` returns a `{plant, score, reasons}` breakdown** (drives the card's "%" and "why this scored X%" explainer). The `GardenFilter` facets are **hard filters** (`plantMatchesFilter`): `location: "apartment"` requires `indoorSuitable`; a non-empty `benefits[]` requires overlap; `maintenancePriority ≥ LOW_EFFORT_THRESHOLD` (70) excludes high-maintenance plants — the drawer shows a clean empty state when nothing matches. Other hard exclusions: toxic+`petsOrKids`, `avoidPlants`. Insufficient facade sun is a *soft penalty* (best-effort fallback cards), not a filter. The live `GardenFilter` comes from `userPreferences.gardenFilterFromPrefs`.
- **`weatherService.ts`** uses **Open-Meteo** (free, no key), cached in `sessionStorage` for 30 min. `userPreferences.ts` and `gardenerMemory.ts` persist user context (localStorage).
- UI: the Garden drawer (`components/garden/`: `GardenDrawer`, `GardenFilters` — one expandable "What are you growing for?" section holding every filter, `PlantCard`, `WeatherStrip`) and Fern (`components/fern/`: `Fern`, `FernSettings`). `WeatherPanel.tsx` backs the 🌤️ rail panel. The building list under the Buildings & Sun panel is debug-only (`?debug`); normally you select a building in the 3D view.

## Testing

**Unit/component** — Vitest + React Testing Library + jsdom. Config in `vitest.config.ts` (`globals: true`, setup at `src/test/setup.ts`; `e2e/**` is excluded). Tests are co-located in `__tests__/` dirs. External APIs (Overpass, Nominatim, Overture, OpenAI, Open-Meteo) are mocked with `vi.mock()`/`vi.stubGlobal("fetch", …)` — never hit the network. The garden feature is built **test-first**: write the test with explicit input→output expectations (it defines the interface), then implement to green (see `plantDatabase.test.ts`, `PlantFilters.test.tsx`, `PlantCard.test.tsx`).

**E2E** — Playwright (`e2e/garden.spec.ts`, config `playwright.config.ts`). Drives the real app in Chromium; Overpass/Open-Meteo/OpenAI/map-tiles are stubbed via `page.route` so runs are offline and deterministic. Because canvas raycast clicks are flaky, facade **and** building selection have non-canvas UI paths (the `data-testid` building-list + `facade-row-*` rows).

## Deployment

- **CI** (`.github/workflows/ci.yml`) runs `npm test` on PRs to `main`.
- **Deploy** (`.github/workflows/deploy.yml`) builds and publishes to **GitHub Pages** on push to `main`.
- `vite.config.ts` sets `base: "./"` (relative paths) so the build works at any root path. Do not hardcode an absolute base.
- A `docker/` setup (`Dockerfile` + `nginx.conf`, nginx alpine) serves the static build as an alternative to Pages.
