import type { LatLng } from "../types";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface GeocodeResult {
  location: LatLng;
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": "SunlightVisualizer/0.1 (github.com/dattpatel99/sunlight-visualizer)",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data: NominatimResult[] = await response.json();

  return data.map((r) => ({
    location: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
    displayName: r.display_name,
  }));
}
