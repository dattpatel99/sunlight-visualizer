import { useState } from "react";
import type { LatLng } from "../types";
import { geocodeAddress, type GeocodeResult } from "../lib/geocode";

interface AddressSearchProps {
  onSelect: (location: LatLng) => void;
}

export function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const data = await geocodeAddress(query.trim());
      if (data.length === 0) {
        setError("No results found");
      } else {
        setResults(data);
      }
    } catch {
      setError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 4 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search address..."
          style={inputStyle}
        />
        <button onClick={handleSearch} disabled={searching} style={searchBtnStyle}>
          {searching ? "..." : "Go"}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "#dc2626" }}>{error}</div>}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 120, overflowY: "auto" }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(r.location);
                setResults([]);
                setQuery("");
              }}
              style={resultStyle}
              title={r.displayName}
            >
              {r.displayName.length > 50
                ? r.displayName.slice(0, 50) + "..."
                : r.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 13,
};

const searchBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const resultStyle: React.CSSProperties = {
  padding: "4px 6px",
  background: "#f5f5f5",
  border: "1px solid #e5e5e5",
  borderRadius: 3,
  fontSize: 11,
  cursor: "pointer",
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
