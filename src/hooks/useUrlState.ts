import { useEffect, useRef } from "react";
import type { LatLng } from "../types";

interface UrlState {
  center: LatLng;
  date: Date;
}

function parseHash(): Partial<UrlState> {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};

  const params = new URLSearchParams(hash);
  const result: Partial<UrlState> = {};

  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  if (!isNaN(lat) && !isNaN(lng)) {
    result.center = { lat, lng };
  }

  const dateStr = params.get("date");
  const timeStr = params.get("time");
  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date();
    date.setFullYear(y, m - 1, d);
    if (timeStr) {
      const [h, min] = timeStr.split(":").map(Number);
      date.setHours(h ?? 12, min ?? 0, 0, 0);
    } else {
      date.setHours(12, 0, 0, 0);
    }
    result.date = date;
  }

  return result;
}

function buildHash(state: UrlState): string {
  const d = state.date;
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `lat=${state.center.lat}&lng=${state.center.lng}&date=${dateStr}&time=${timeStr}`;
}

/** Read initial state from URL hash, and keep hash in sync with state changes */
export function useUrlState(
  center: LatLng,
  date: Date,
  onRestore: (state: Partial<UrlState>) => void
) {
  const initialized = useRef(false);

  // On mount: read URL hash and restore state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const restored = parseHash();
    if (restored.center || restored.date) {
      onRestore(restored);
    }
  }, [onRestore]);

  // On state change: update URL hash (debounced)
  useEffect(() => {
    const hash = buildHash({ center, date });
    window.location.replace(`#${hash}`);
  }, [center, date]);
}
