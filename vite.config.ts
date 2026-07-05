import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use relative paths so the app works at any root path
  // (e.g. http://yourserver/ or http://yourserver/sunlight-visualizer/)
  base: "./",
});
