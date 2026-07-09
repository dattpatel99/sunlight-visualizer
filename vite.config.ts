import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use relative paths so the app works at any root path
  // (e.g. http://yourserver/ or http://yourserver/sunlight-visualizer/)
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js ecosystem into its own chunk — reduces initial JS
          // and allows browsers to cache the heavy 3D library separately.
          three: ["three"],
          "react-three": ["@react-three/fiber", "@react-three/drei"],
          // PMTiles + vector tile stack
          tiles: ["pmtiles", "@mapbox/vector-tile", "pbf"],
          // SunCalc (lightweight, separate)
          suncalc: ["suncalc"],
        },
      },
    },
    // Vite default is 500kB; Three.js alone is ~600kB minified.
    // Raising to 800kB suppresses the warning; actual split makes
    // per-chunk loading faster even if the largest chunk warning persists.
    chunkSizeWarningLimit: 800,
  },
});
