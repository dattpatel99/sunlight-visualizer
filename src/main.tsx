import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Register service worker for offline tile + PMTiles caching (1-3 month TTL)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW] registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
