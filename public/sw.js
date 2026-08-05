// Minimal service worker: no offline caching. It exists only so the app
// satisfies PWA installability checks and launches in standalone mode when
// added to a home screen — fetches are passed straight through to the
// network, unmodified.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
