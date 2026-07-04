# Facade Sunlight Intensity Feature — Design Doc

**Feature:** Calculate and display real-time sunlight intensity (W/m²) per building facade
**Author:** Hermes Agent (PandaBoi)
**Created:** 2026-07-04
**Status:** Draft

---

## 1. Problem Statement

Currently, the app calculates **sunlight hours per facade** — a useful proxy for relative exposure, but it doesn't account for the fact that midday sun delivers far more energy per square meter than early-morning or late-afternoon sun. A facade that gets 4 hours of weak morning sun and 2 hours of strong midday sun is more energetically valuable than a facade with 6 hours of purely glancing light.

**We need to compute and display instantaneous sunlight irradiance (W/m²) per facade**, at the currently selected time, so users can understand the real energy potential of each wall surface.

---

## 2. Goals

1. **At any selected time**, show the current sunlight intensity (W/m²) hitting each facade
2. **Over the full day**, integrate intensity × time to produce a radiant energy estimate (Wh/m²/day) per facade — replacing the current dot-product-based "hours" metric with a more physically meaningful energy value
3. **Display both metrics** in the existing FacadeAnalysis panel, without breaking existing UI

---

## 3. Technical Background

### 3.1 Solar Irradiance Model

Direct normal irradiance (DNI) at ground level varies with solar altitude. We use a simple clear-sky model:

```
DNI(altitude) = SOLAR_CONSTANT × sin(altitude)
```

Where:
- **SOLAR_CONSTANT** = 1000 W/m² (approximate max at sea level, perpendicular to sun)
- **altitude** = sun elevation angle in radians (from SunCalc)
- When altitude ≤ 0 → night → 0 W/m²

This is a clear-sky model (no cloud cover, no atmospheric attenuation beyond the sin(altitude) factor).

### 3.2 Facade Irradiance

A facade receives irradiance proportional to the cosine of the angle between:
- The sun's ray direction (on the XZ ground plane, toward the sun)
- The facade's outward normal

```
irradiance = DNI × cos(angle between facade-normal and sun direction)
```

In the XZ plane, this is simply the dot product of:
- `nx, nz` (facade outward normal, from existing `facadeUtils.ts`)
- `sunDx, sunDz` (sun direction unit vector, already computed in `facadeUtils.ts`)

Since both are unit vectors, `dot = cos(θ)` directly.

```
facadeIrradiance = DNI × max(0, dot(nx, nz), (sunDx, sunDz))
```

### 3.3 Daily Energy Integration

Currently `computeFacadeExposure` samples sun position every 15 minutes and accumulates `dot × sampleHours`. This produces "effective sunlit hours" which is a reasonable proxy, but we can improve it:

**New algorithm:**
For each 15-minute sample `i`:
```
DNI_i = 1000 × sin(altitude_i)   (only if altitude_i > 0)
energy_i = DNI_i × max(0, dot_i) × (15/60)   [Wh]
```

Daily energy = sum of all `energy_i` for the facade.

This produces **Wh/m²/day** directly, which is the standard unit for solar energy potential.

### 3.4 Existing Data Structures

```typescript
// src/lib/facadeUtils.ts — existing FacadeExposure
export interface FacadeExposure extends Facade {
  sunlightHours: number;   // ← replace with energy (Wh/m²/day)
}
```

The new type will **add** `intensity` (instantaneous W/m²) while keeping `sunlightHours` for backward compatibility, but the UI will show energy in Wh/m²/day.

---

## 4. API Changes

### 4.1 `src/lib/facadeUtils.ts`

**Constants to add:**
```typescript
export const SOLAR_CONSTANT = 1000; // W/m²
```

**`computeFacadeExposure` signature unchanged**, but return type extends:

```typescript
export interface FacadeExposure extends Facade {
  sunlightHours: number;     // kept for backward compat, now computed as energy/solar_constant (≈ hours)
  intensity: number;         // NEW: instantaneous irradiance at selected time (W/m²)
  dailyEnergy: number;       // NEW: integrated daily radiant energy (Wh/m²/day)
  cosTheta: number;           // NEW: cosine of sun-facade angle (0-1, measure of directness)
}
```

### 4.2 `src/components/FacadeAnalysis.tsx`

**New display fields per facade row:**
- **Intensity badge** — shows current W/m² with a color gradient (blue=low, yellow=high)
- **Daily Energy** — shows integrated Wh/m²/day
- **cosTheta indicator** — small indicator of how directly sun hits (0=glancing, 1=perpendicular)

**Color scale for intensity:**
- 0 W/m² → `#6699cc` (blue, no sun)
- 1–250 W/m² → interpolated blue→yellow
- 250–500 W/m² → interpolated yellow→orange
- 500–1000 W/m² → `#ff6600` (orange-red, peak direct sun)

### 4.3 `src/lib/sunlightStats.ts`

Add to `SunlightStats`:
```typescript
export interface SunlightStats {
  // ...existing fields...
  peakIntensity: number;      // W/m² — highest instantaneous irradiance of any facade today
  totalDailyEnergy: number;  // Wh/m²/day — sum of all facade energies
  bestEnergyFacade: { direction: string; energy: number } | null;
}
```

---

## 5. Implementation Plan

### Phase 1 — Core Logic (no UI changes)
1. Add `SOLAR_CONSTANT` constant to `src/lib/facadeUtils.ts`
2. Extend `FacadeExposure` interface with `intensity`, `dailyEnergy`, `cosTheta`
3. Refactor `computeFacadeExposure`:
   - Accept a `currentTime?: Date` parameter for instantaneous intensity
   - When `currentTime` provided: compute intensity at that moment
   - Always compute `dailyEnergy` by integrating over the full day
4. Update `useFacadeAnalysis` hook to pass the current `date` (at current time) as `currentTime`
5. Run existing tests to ensure backward compat

### Phase 2 — UI Updates
6. Update `FacadeAnalysis.tsx` to show intensity badge + daily energy
7. Update `SunlightStats.ts` → `computeSunlightStats` to add peak/total metrics
8. Add tests for new calculations

### Phase 3 — Polish
9. Update `FacadeAnalysis.tsx` with intensity color scale
10. Add hover tooltip showing cosTheta explanation
11. Run full test suite

---

## 6. File Changes Summary

| File | Change |
|------|--------|
| `src/lib/facadeUtils.ts` | Add constants, extend interface, refactor `computeFacadeExposure` |
| `src/hooks/useFacadeAnalysis.ts` | Pass current time to `computeFacadeExposure` |
| `src/types/index.ts` | Extend `FacadeExposure` type |
| `src/components/FacadeAnalysis.tsx` | New intensity badge + energy display |
| `src/lib/sunlightStats.ts` | Add peak/total energy stats |
| `src/components/SunlightStats.tsx` | Display new stats |
| `src/components/__tests__/FacadeAnalysis.test.tsx` | Update tests |

---

## 7. Out of Scope

- Cloud cover / weather data — clear-sky model only
- Diffuse (non-direct) irradiance — only direct beam radiation modeled
- Shading from other buildings (occlusion) — would require raycasting per facade point
- Seasonal storage / cumulative energy tracking — single day only
- Heat map overlay on 3D geometry — future work
