# Testing Framework

## Stack

| Tool | Role |
|------|------|
| [Vitest](https://vitest.dev/) | Test runner and assertion library |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | Component rendering and DOM queries |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) | Simulating user interactions |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | Extended DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.) |
| [jsdom](https://github.com/jsdom/jsdom) | Browser DOM implementation for Node.js |

## Configuration

### vitest.config.ts

Vitest is configured with:
- `jsdom` as the test environment (provides `document`, `window`, etc.)
- Setup file at `src/test/setup.ts` that imports `@testing-library/jest-dom` for extended matchers

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (during development)
npx vitest
```

## Test Structure

Tests are co-located with source code using a `__tests__/` directory convention:

```
src/
├── __tests__/
│   └── App.test.tsx              # Integration test for the main App
├── components/__tests__/
│   ├── AddressSearch.test.tsx
│   ├── Compass.test.tsx
│   ├── FacadeAnalysis.test.tsx
│   ├── LocationInput.test.tsx
│   ├── SunlightStats.test.tsx
│   └── TimeControls.test.tsx
├── hooks/__tests__/
│   ├── useBuildings.test.ts
│   ├── useFacadeAnalysis.test.ts
│   ├── useSunPosition.test.ts
│   └── useUrlState.test.ts
└── lib/__tests__/
    ├── buildingGeometry.test.ts
    ├── facadeUtils.test.ts
    ├── geocode.test.ts
    ├── mapTiles.test.ts
    ├── overpass.test.ts
    ├── overture.test.ts
    ├── projection.test.ts
    ├── sunDirection.test.ts
    └── sunlightStats.test.ts
```

## Test Categories

### Unit Tests (`src/lib/__tests__/`)

Test pure utility functions and data processing logic in isolation:

- **projection.test.ts** — Verifies coordinate conversion accuracy between WGS84 and local meters.
- **buildingGeometry.test.ts** — Ensures 3D geometry is correctly generated from 2D footprints.
- **facadeUtils.test.ts** — Tests facade extraction, direction labeling, and sunlight hour calculation.
- **sunDirection.test.ts** — Validates sun azimuth/altitude to Three.js vector conversion.
- **sunlightStats.test.ts** — Checks aggregation of facade data into summary statistics.
- **geocode.test.ts** — Tests address-to-coordinate conversion with mocked API responses.
- **overpass.test.ts** — Tests OpenStreetMap data fetching and parsing with mocked responses.
- **overture.test.ts** — Tests Overture Maps PMTiles data fetching with mocked responses.
- **mapTiles.test.ts** — Tests tile grid compositing logic.

### Hook Tests (`src/hooks/__tests__/`)

Test custom React hooks using `renderHook` from React Testing Library:

- **useBuildings.test.ts** — Verifies data fetching, loading states, and error handling.
- **useSunPosition.test.ts** — Checks sun position computation for known locations and times.
- **useFacadeAnalysis.test.ts** — Tests facade analysis computation for sample buildings.
- **useUrlState.test.ts** — Verifies URL hash read/write synchronization.

### Component Tests (`src/components/__tests__/`)

Test React components by rendering them and asserting on DOM output and user interactions:

- **LocationInput.test.tsx** — Tests input fields, radius slider, preset buttons, and data source toggle.
- **AddressSearch.test.tsx** — Tests search input and geocoding API integration.
- **TimeControls.test.tsx** — Tests date picker, time slider, play/pause, and speed controls.
- **FacadeAnalysis.test.tsx** — Tests facade direction display and click interactions.
- **SunlightStats.test.tsx** — Tests statistics panel rendering with various data.
- **Compass.test.tsx** — Tests compass orientation display.

### Integration Tests (`src/__tests__/`)

- **App.test.tsx** — Renders the full application and verifies that all major sections are present and interconnected.

## Testing Patterns

### Mocking External APIs

External API calls (Overpass, Nominatim, Overture Maps) are mocked using `vi.mock()` to avoid network dependencies in tests:

```typescript
vi.mock('../geocode', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 40.7128, lng: -74.006 })
}));
```

### Testing Hooks

Hooks are tested using `renderHook` with appropriate wrappers:

```typescript
const { result } = renderHook(() => useSunPosition(location, date));
expect(result.current.altitude).toBeGreaterThan(0);
```

### Testing Components

Components are tested by rendering them, interacting with DOM elements, and asserting on visible output:

```typescript
render(<LocationInput {...props} />);
await userEvent.click(screen.getByText('NYC'));
expect(props.onLocationChange).toHaveBeenCalled();
```
