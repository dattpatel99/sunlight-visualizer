import { useState } from "react";
import type { LatLng } from "../types";
import { PRESETS, OVERPASS_RADIUS } from "../constants";

interface LocationInputProps {
  onLoad: (center: LatLng, radius: number) => void;
  loading: boolean;
}

export function LocationInput({ onLoad, loading }: LocationInputProps) {
  const [lat, setLat] = useState("40.748");
  const [lng, setLng] = useState("-73.986");
  const [radius, setRadius] = useState(OVERPASS_RADIUS);

  const handleLoad = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    onLoad({ lat: latNum, lng: lngNum }, radius);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ margin: 0 }}>Location</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontSize: 12, color: "#888" }}>Latitude</span>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontSize: 12, color: "#888" }}>Longitude</span>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
      <label>
        <span style={{ fontSize: 12, color: "#888" }}>
          Radius: {radius}m
        </span>
        <input
          type="range"
          min={50}
          max={500}
          step={25}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: "100%", marginTop: 2 }}
        />
      </label>
      <button onClick={handleLoad} disabled={loading} style={buttonStyle}>
        {loading ? "Loading..." : "Load Buildings"}
      </button>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setLat(String(p.location.lat));
              setLng(String(p.location.lng));
              onLoad(p.location, radius);
            }}
            disabled={loading}
            style={presetStyle}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  display: "block",
  marginTop: 2,
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

const presetStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "#f0f0f0",
  border: "1px solid #ddd",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
};
