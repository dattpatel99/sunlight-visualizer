# Sunlight Visualizer

An interactive 3D web application that visualizes sunlight exposure on buildings throughout the day. Explore how sunlight hits building facades at any location, date, and time — useful for urban planning, architecture, real estate evaluation, and solar energy research.

## Features

- **3D Building Visualization** — Buildings rendered as extruded 3D meshes with real-time shadow casting
- **Facade Sunlight Analysis** — Per-wall breakdown of direct sunlight hours, color-coded from blue (shade) to yellow (full sun)
- **Dual Data Sources** — Fetch buildings from Overture Maps Foundation (PMTiles) or OpenStreetMap (Overpass API)
- **Time Simulation** — Scrub through any time of day with animated playback at configurable speeds
- **Sun Position Tracking** — Accurate sun azimuth and altitude computed from geographic coordinates and date
- **Address Search** — Look up any address and jump to its location via geocoding
- **Preset Locations** — Quick-access buttons for NYC, London, and Tokyo
- **Sunlight Statistics** — Summary panel with sunrise/sunset times, daylight hours, and best/worst facade exposure
- **Interactive Selection** — Click buildings to view detailed facade analysis and metadata
- **Map Ground Texture** — Real OpenStreetMap tiles composited as the ground plane
- **Compass Overlay** — On-screen compass showing camera orientation relative to north
- **Shareable URLs** — Location and time state encoded in the URL hash for easy sharing

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/dattpatel99/sunlight-visualizer.git
cd sunlight-visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/sunlight-visualizer/`.

### Other Commands

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Documentation

Detailed documentation is available in the [`docs/`](docs/) folder:

- [System Architecture](docs/system-architecture.md) — Architecture layers, data flow, and state management
- [Components](docs/components.md) — UI components, custom hooks, and library modules
- [Testing Framework](docs/testing-framework.md) — Test stack, structure, and patterns
- [Workflows](docs/workflows.md) — CI/CD pipelines and local development workflow

## Acknowledgments

This project is built on the shoulders of these open-source projects:

- [Three.js](https://threejs.org/) — 3D graphics library for the web
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js
- [Drei](https://github.com/pmndrs/drei) — Useful helpers and abstractions for React Three Fiber
- [React](https://react.dev/) — UI component framework
- [SunCalc](https://github.com/mourner/suncalc) — Sun position and sunlight phase calculations
- [PMTiles](https://github.com/protomaps/PMTiles) — Cloud-optimized tile archive format
- [Overture Maps Foundation](https://overturemaps.org/) — Open map data including building footprints
- [OpenStreetMap](https://www.openstreetmap.org/) — Community-built map data, tiles, geocoding (Nominatim), and spatial queries (Overpass API)
- [Vite](https://vitejs.dev/) — Fast build tool and development server
- [Vitest](https://vitest.dev/) — Unit testing framework
- [React Testing Library](https://testing-library.com/) — Component testing utilities
- [TypeScript](https://www.typescriptlang.org/) — Static type checking for JavaScript
