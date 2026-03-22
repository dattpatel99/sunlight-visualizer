# Components

## UI Components (`src/components/`)

### Scene

The root 3D container. Wraps a React Three Fiber `<Canvas>` with orbit controls for camera rotation, zoom, and pan. Configures the WebGL renderer with shadow mapping and sets default camera positioning.

### Buildings

Renders the collection of loaded buildings. For performance, when more than 50 buildings are present, all geometries are merged into a single mesh. The selected building is always rendered individually so it can be highlighted and interacted with separately.

### Building

Renders a single building as an extruded 3D mesh. Applies per-vertex coloring based on facade sunlight exposure — colors range from blue (full shade) to yellow (full sun). Handles click events for building selection.

### LocationInput

The main location control panel providing:
- Latitude and longitude text inputs for manual coordinate entry
- A radius slider (50–500m) controlling the building search area
- A data source toggle switching between Overture Maps and OpenStreetMap
- Preset location buttons for quick navigation (NYC, London, Tokyo)

### AddressSearch

A search bar that converts a street address into geographic coordinates using the OpenStreetMap Nominatim geocoding API. Results update the location inputs.

### TimeControls

Date and time controls for the sun simulation:
- A date picker to set the calendar date
- A time slider for scrubbing through the day
- Play/pause button for automatic time animation
- Speed selector with four options: 5, 10, 30, or 60 minutes per tick

### FacadeAnalysis

Displays a per-direction breakdown of sunlight exposure hours for a selected building. Each facade direction (N, NE, E, SE, S, SW, W, NW) is listed with its computed hours of direct sunlight. Directions are clickable — selecting one highlights the corresponding facade on the 3D model.

### SunlightStats

A statistics summary panel showing:
- Sunrise and sunset times for the current location and date
- Total daylight hours
- Best and worst facades by sunlight exposure
- Average exposure across all facades

### BuildingInfo

Displays metadata for the currently selected building, including its ID, height, and vertex count.

### SunLight

A Three.js `DirectionalLight` positioned according to the calculated sun direction. Casts real-time shadows that update as the time changes. Shadow map resolution and camera frustum are configured in `constants.ts`.

### Ground

A textured ground plane that:
- Fetches OpenStreetMap tiles at zoom 17 and composites a 5x5 tile grid onto a single canvas
- Applies the composited map as a texture to a flat plane mesh
- Receives shadows cast by buildings

### Compass

An on-screen compass rose overlay indicating the camera's orientation relative to geographic north. Updates as the user rotates the 3D view.

---

## Custom Hooks (`src/hooks/`)

### useBuildings

Fetches building footprint data from either Overture Maps (PMTiles) or the OpenStreetMap Overpass API based on the selected data source. Converts raw coordinates to local meter-based positions via the projection module, manages loading/error states, and returns an array of building objects ready for rendering.

### useSunPosition

Takes a geographic location and a `Date` object, returns the sun's azimuth and altitude computed by SunCalc. These values drive both the directional light placement and the facade exposure calculations.

### useFacadeAnalysis

For a given building, extracts all exterior edges as facades, determines their compass direction from the wall normal, and computes how many hours of direct sunlight each facade receives. Sampling is done every 15 minutes from sunrise to sunset using a dot-product test between the facade normal and the sun direction vector.

### useUrlState

Reads and writes location and date/time parameters to the URL hash (`#lat=...&lng=...&date=...&time=...`). Enables shareable URLs that restore a specific view when opened.

---

## Library Modules (`src/lib/`)

### overture.ts

Fetches building footprints from the Overture Maps Foundation PMTiles dataset. Reads vector tiles at zoom level 14, parses geometry and properties (height, floor count) using Protocol Buffer decoding, and deduplicates buildings by string ID.

### overpass.ts

Queries the OpenStreetMap Overpass API for buildings within a geographic bounding box. Extracts building height from OSM tags (`height`, `building:levels`) and converts ways/relations into coordinate arrays.

### projection.ts

Provides `projectCoordinates` and `unprojectCoordinates` functions that convert between WGS84 lat/lng and a local XZ coordinate system measured in meters. Uses Mercator projection math with a cosine correction factor for the reference latitude.

### buildingGeometry.ts

Creates Three.js `ExtrudeGeometry` objects from 2D building footprint coordinates. Handles the coordinate system rotation needed to properly orient extruded shapes in 3D space (XZ ground plane).

### facadeUtils.ts

Extracts the exterior edges of a building footprint as facades. Each facade gets a compass direction label based on its outward-facing normal vector. Computes per-facade sunlight hours by testing sun visibility at 15-minute intervals throughout the day.

### sunDirection.ts

Converts sun azimuth (compass bearing) and altitude (elevation angle) from SunCalc into a Three.js `Vector3` suitable for positioning a directional light source in the 3D scene.

### sunlightStats.ts

Aggregates facade analysis results into summary statistics: sunrise/sunset times, total daylight hours, best and worst facade directions, and average sunlight exposure across all facades.

### geocode.ts

Wraps the OpenStreetMap Nominatim API to convert a text address query into geographic coordinates (latitude, longitude).

### mapTiles.ts

Fetches OpenStreetMap raster tiles at zoom level 17 and composites a 5x5 grid of tiles onto an HTML canvas element. The resulting canvas is used as a texture for the ground plane, providing accurate geographic context at approximately 1.2 meters per pixel.
