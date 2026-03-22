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

## Performance Considerations

- **Geometry merging** — When more than 50 buildings are loaded, individual geometries are merged into a single mesh to reduce draw calls.
- **Selective rendering** — The selected building is rendered separately to allow individual interaction and highlighting.
- **Tile compositing** — Ground map tiles (5x5 grid) are composited onto a single canvas to minimize texture binds.
- **15-minute sampling** — Facade sunlight exposure is computed by sampling sun position at 15-minute intervals rather than continuously, balancing accuracy with computation cost.
