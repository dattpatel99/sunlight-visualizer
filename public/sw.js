/**
 * Service Worker — Sunlight Visualizer
 *
 * Caching strategy:
 *  - App shell (JS/CSS/HTML): Cache-first, update in background ( stale-while-revalidate )
 *  - OSM tiles: Cache-first, 90-day TTL (1-3 months acceptable per user requirement)
 *  - PMTiles files: Cache-first, 7-day TTL (building data is mostly static, 1 week fresh is fine)
 *
 * Network-first fallback for all resources so the app works offline
 * after an initial successful visit.
 */

const TILE_CACHE = "sunlight-v1-tiles";
const APP_CACHE = "sunlight-v1-app";
const PMTILES_CACHE = "sunlight-v1-pmtiles";
const TILE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days (1-3 months per user requirement)
const PMTILE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Install: pre-cache app shell immediately
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      // Cache app shell on install so the app works offline ASAP
      return cache.addAll([
        "/",
        "/index.html",
      ]).catch(() => {
        // Non-fatal: don't block install if some resources aren't present yet
      });
    })
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: clean up old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  const validCaches = [APP_CACHE, TILE_CACHE, PMTILES_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch: route-based caching strategies
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== "GET") return;

  // -------------------------------------------------------------------------
  // OSM tile.openstreetmap.org tiles → cache-first, 90-day TTL
  // -------------------------------------------------------------------------
  if (
    url.hostname === "tile.openstreetmap.org" ||
    url.hostname.endsWith(".tile.openstreetmap.org")
  ) {
    event.respondWith(cacheFirstWithTTL(request, TILE_CACHE, TILE_TTL));
    return;
  }

  // -------------------------------------------------------------------------
  // Overture PMTiles (AWS S3) → cache-first, 7-day TTL
  // -------------------------------------------------------------------------
  if (
    url.hostname.includes("overturemaps") ||
    url.hostname.endsWith(".s3.amazonaws.com")
  ) {
    event.respondWith(cacheFirstWithTTL(request, PMTILES_CACHE, PMTILE_TTL));
    return;
  }

  // -------------------------------------------------------------------------
  // App assets (JS/CSS/fonts from same origin) → stale-while-revalidate
  // Also handles Vite HMR in dev
  // -------------------------------------------------------------------------
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
    return;
  }

  // -------------------------------------------------------------------------
  // Everything else → network-first, fall back to cache
  // -------------------------------------------------------------------------
  event.respondWith(networkFirst(request, APP_CACHE));
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/**
 * Cache-first with TTL expiry.
 * Returns cached response if fresh; otherwise fetches from network and caches.
 */
async function cacheFirstWithTTL(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("date");
    if (dateHeader) {
      const age = Date.now() - new Date(dateHeader).getTime();
      if (age < ttlMs) return cached;
      // Expired — delete and fall through to network fetch
      cache.delete(request);
    }
  }

  // Try network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      cache.put(request, cloned);
    }
    return response;
  } catch {
    // Network failed and cache was expired or absent — return opaque error
    return cached || new Response("Offline and cache expired", { status: 503 });
  }
}

/**
 * Stale-while-revalidate: immediately return cached response if available,
 * then update the cache in the background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response("Offline", { status: 503 });
}

/**
 * Network-first: try network, fall back to cache.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}
