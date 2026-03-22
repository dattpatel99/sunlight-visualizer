# System Architecture

## Overview

Sunlight Visualizer is a client-side single-page application built with React 19 and Three.js. There is no backend server — all data fetching, computation, and rendering happens in the browser.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                 Presentation Layer               │
│          React Components + Three.js Scene       │
├─────────────────────────────────────────────────┤
│                  Logic Layer                     │
│             Custom React Hooks                   │
├─────────────────────────────────────────────────┤
│              Data Processing Layer               │
│     Projections, Geometry, Sun Calculations      │
├─────────────────────────────────────────────────┤
│                External Data Sources             │
│   Overture Maps  ·  OpenStreetMap  ·  SunCalc    │
└─────────────────────────────────────────────────┘
```

### Presentation Layer (`src/components/`)

React components handle all UI rendering and user interaction. The 3D scene is rendered via React Three Fiber, which provides a declarative React interface to Three.js. UI controls (location input, time slider, facade analysis panel) live alongside the 3D canvas.

### Logic Layer (`src/hooks/`)

Custom hooks encapsulate stateful logic and side effects:

- **useBuildings** — Fetches building data from external APIs, transforms it into renderable geometry, and manages loading/error states.
- **useSunPosition** — Computes the sun's azimuth and altitude for a given location and timestamp using the SunCalc library.
- **useFacadeAnalysis** — Analyzes each building facade's sunlight exposure by sampling sun positions throughout the day.
- **useUrlState** — Synchronizes application state (location, date) to the URL hash for shareable links.

### Data Processing Layer (`src/lib/`)

Pure utility modules handle coordinate math, geometry generation, and data fetching:

- **projection.ts** — Converts WGS84 lat/lng coordinates to local XZ meter-based coordinates using Mercator projection with latitude cosine correction.
- **buildingGeometry.ts** — Creates Three.js `ExtrudeGeometry` from 2D building footprints with proper coordinate rotation for 3D extrusion.
- **facadeUtils.ts** — Extracts building edges as facades, assigns cardinal direction labels, and computes sunlight hours per facade by sampling sun position every 15 minutes.
- **sunDirection.ts** — Converts SunCalc azimuth/altitude into a Three.js `Vector3` for directional light positioning.
- **sunlightStats.ts** — Aggregates facade exposure data into summary statistics.

### External Data Sources

- **Overture Maps Foundation** — Primary building data source via PMTiles. Cloud-optimized vector tiles accessed at zoom level 14 from an S3 bucket.
- **OpenStreetMap Overpass API** — Alternative building data source queried with radius-based spatial queries.
- **OpenStreetMap Nominatim** — Geocoding service for address-to-coordinate conversion.
- **OpenStreetMap Tile Server** — Map tiles at zoom 17 (~1.2m/px) composited into ground textures.
- **SunCalc** — Ephemeris library for computing sun position, sunrise, and sunset.

## Data Flow

```
User Input (location, date/time)
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│ useBuildings │────▶│ Overture / OSM   │  (fetch building footprints)
└──────┬───────┘     └──────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│ projection   │────▶│ buildingGeometry  │  (lat/lng → meters → 3D mesh)
└──────────────┘     └──────────────────┘
       │
       ▼
┌───────────────┐     ┌─────────────────┐
│ useSunPosition│────▶│ sunDirection     │  (sun azimuth/alt → light vector)
└──────┬────────┘     └─────────────────┘
       │
       ▼
┌────────────────┐
│ facadeAnalysis │  (dot product: facade normal vs sun direction)
└──────┬─────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Three.js Scene                       │
│  - Vertex-colored building meshes    │
│  - Directional light with shadows    │
│  - Textured ground plane             │
└──────────────────────────────────────┘
```

## State Management

Application state lives in `App.tsx` using React's `useState` and is passed down via props. There is no external state management library. Key state includes:

| State | Description |
|-------|-------------|
| `location` | Latitude, longitude, and search radius |
| `dateTime` | Current date and time for sun calculation |
| `buildings` | Array of fetched and projected building data |
| `selectedBuilding` | Currently clicked building for detail view |
| `dataSource` | Toggle between Overture Maps and OpenStreetMap |
| `isPlaying` | Whether time animation is running |

URL hash state (`#lat=...&lng=...&date=...`) is kept in sync via `useUrlState` so links can be shared.

## Sunlight and Shadow Calculations

### Solar Position

Sun position is computed using the [SunCalc](https://github.com/mourner/suncalc) library, which implements standard astronomical algorithms for solar ephemeris. Given a geographic location (latitude, longitude) and a `Date`, SunCalc returns:

- **Azimuth** — The sun's compass bearing in radians, where 0 = south and positive values go westward.
- **Altitude** — The sun's elevation angle in radians, where 0 = horizon and π/2 = directly overhead (zenith).

When the altitude is negative, the sun is below the horizon (nighttime).

### Sun Direction in 3D Space

The azimuth and altitude are converted to a Three.js `Vector3` representing the directional light position (`src/lib/sunDirection.ts`). The coordinate mapping from SunCalc conventions to Three.js world space (+X = east, +Y = up, +Z = south) is:

```
x = -sin(azimuth) × cos(altitude) × SUN_DISTANCE
y =  sin(altitude) × SUN_DISTANCE
z =  cos(azimuth) × cos(altitude) × SUN_DISTANCE
```

`SUN_DISTANCE` (200 units) places the light far enough from the origin to produce parallel rays across the scene.

### Facade Extraction

Building facades are derived from the 2D footprint polygon (`src/lib/facadeUtils.ts`):

1. **Winding order detection** — The signed area of the polygon determines whether vertices are in counter-clockwise (CCW) or clockwise (CW) order.
2. **Edge normals** — For each consecutive pair of vertices, the outward-facing unit normal is computed on the XZ plane. The normal direction is flipped based on winding order so it always points away from the building interior.
3. **Degenerate edge filtering** — Edges shorter than 0.1 meters are discarded.
4. **Cardinal direction labeling** — Each facade normal is classified into one of eight compass directions (N, NE, E, SE, S, SW, W, NW) using `atan2(nx, -nz)` mapped to 45-degree bins.
5. **Merging** — Raw polygon edges are grouped by cardinal direction. Within each group, normals are averaged (weighted by edge length) and lengths are summed. This reduces a complex polygon's 12–16 edges into 4–8 meaningful wall directions.

### Facade Sunlight Exposure

The core exposure calculation (`computeFacadeExposure` in `src/lib/facadeUtils.ts`) determines how many hours of direct sunlight each facade receives on a given day:

1. **Time range** — Sunrise and sunset are computed via `SunCalc.getTimes()` for the building's location and date.
2. **15-minute sampling** — The sunrise-to-sunset period is divided into 15-minute intervals (each worth 0.25 hours).
3. **Sun direction samples** — At each interval, `SunCalc.getPosition()` provides the sun's azimuth and altitude. The horizontal sun direction vector on the XZ plane is:
   ```
   sunXZ = [-sin(azimuth), cos(azimuth)]
   ```
   Samples where altitude ≤ 0 (sun below horizon) are skipped.
4. **Dot product test** — For each facade, the dot product of the facade's outward normal and the sun direction is computed:
   ```
   dot = normal · sunXZ
   ```
   - If `dot > 0`, the facade faces toward the sun during that interval.
   - The exposure contribution is `dot × 0.25 hours`, weighting by the cosine of the incidence angle. A facade directly facing the sun receives the full 0.25-hour contribution; one at a glancing angle receives less.
5. **Accumulation** — Contributions are summed across all intervals to produce a `sunlightHours` value per facade. A south-facing facade in the northern hemisphere will typically accumulate the most hours.

**Limitations:** The exposure calculation does not account for occlusion by neighboring buildings. It assumes unobstructed line-of-sight between each facade and the sun at every sampled interval.

### Shadow Rendering

Real-time shadows in the 3D scene are handled by Three.js shadow mapping, not by the facade exposure algorithm. The two systems are independent:

- **DirectionalLight** (`src/components/SunLight.tsx`) is positioned at the calculated sun vector and configured with `castShadow: true`.
- **Shadow map** — A 2048×2048 depth texture is rendered from the light's perspective using an orthographic camera (frustum size ±300 units, near 1, far 600). A bias of −0.001 prevents shadow acne artifacts.
- **Soft shadows** — The Canvas is configured with `shadows="soft"`, enabling PCF (Percentage-Closer Filtering) for softer shadow edges.
- **Shadow receivers** — Building meshes both cast and receive shadows. The ground plane receives shadows but does not cast them.

When the sun is below the horizon (nighttime), the directional light intensity is set to 0 and only ambient light (intensity 0.3) remains.

### Exposure Visualization

Facade exposure values are mapped to vertex colors on the building mesh (`src/components/Building.tsx`):

- **Color gradient** — Exposure hours are linearly interpolated between a shade color (#446688, blue) at 0 hours and a sun color (#f5c542, yellow) at the maximum exposure among all facades.
- **Roof/floor faces** — Triangles with a vertical normal (|ny| > 0.9) receive a neutral color (#8899bb) since they are not wall facades.
- **Interactive highlighting** — When a user selects a compass direction in the facade analysis panel, matching wall faces are colored magenta (#ff44ff) and non-matching faces are dimmed (#334466).

## Performance Considerations

- **Geometry merging** — When more than 50 buildings are loaded, individual geometries are merged into a single mesh to reduce draw calls.
- **Selective rendering** — The selected building is rendered separately to allow individual interaction and highlighting.
- **Tile compositing** — Ground map tiles (5x5 grid) are composited onto a single canvas to minimize texture binds.
- **15-minute sampling** — Facade sunlight exposure is computed by sampling sun position at 15-minute intervals rather than continuously, balancing accuracy with computation cost.
