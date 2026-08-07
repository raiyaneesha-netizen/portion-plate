/* Portion Plate — optional service worker.
   Only needed if you HOST the app (GitHub Pages, Netlify, Cloudflare Pages).
   Put this file next to portion-plate.html, renamed so the paths below match.
   Opening the .html directly from disk already works offline without this. */

const CACHE = "portion-plate-v1";

// Everything the app needs. It's a single file, so this is short.
const ASSETS = [
  "./",
  "./index.html"
];

// Install: pre-cache the shell.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(() => {})          // a missing path shouldn't block install
      .then(() => self.skipWaiting())
  );
});

// Activate: drop caches from older versions.
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network, and keep the cache warm.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;

      return fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          // Offline and not cached: for a page request, hand back the app shell.
          e.request.mode === "navigate"
            ? caches.match("./index.html")
            : Response.error()
        );
    })
  );
});
