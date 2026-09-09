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
  const { request } = event;

  // Chrome sends speculative/prefetched navigations with
  // cache: "only-if-cached" while mode stays "navigate". Reconstructing
  // that request inside fetch() is invalid ("only-if-cached" is only
  // allowed with mode "same-origin") and throws a synchronous
  // TypeError: Failed to fetch, which surfaces as a network error on the
  // page load (this is what broke "/login"). Let the browser handle it.
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  // Requests with a body (POST/PUT/PATCH — e.g. the Supabase auth token
  // exchange) expose event.request.body as a ReadableStream that has
  // already been read once by the browser. Re-fetching that same Request
  // object fails with "Failed to fetch" because the stream can't be
  // replayed. This worker does no caching, so there's nothing to gain
  // from intercepting these anyway — let them go straight to the network.
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(fetch(request));
});
