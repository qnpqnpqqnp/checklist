// Minimal service worker. It keeps no cache of its own — it exists so the
// app satisfies PWA installability and, critically, so that every launch of
// the installed app pulls the *document* fresh from the network. That is
// what makes a new deploy show up as soon as the user reopens the app.
//
// Update flow (see app/ServiceWorkerRegister.tsx):
//   1. The page registers /sw.js?v=<build id>. The query changes every
//      build, so the browser always treats it as a new script and installs
//      it (byte-identical content is not enough on its own).
//   2. This worker calls skipWaiting() on install and clients.claim() on
//      activate, so the new worker takes over immediately.
//   3. The page listens for `controllerchange` and reloads once, so the
//      running tab stops executing the old bundle.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only take over top-level navigations. Everything else (Next.js chunks,
  // CSS, images) is content-hashed and served immutable, so the browser
  // handles it correctly across deploys on its own — don't intercept.
  if (request.mode !== "navigate") return;

  // Chrome fires speculative/prefetched navigations with
  // cache: "only-if-cached"; re-issuing that inside fetch() throws. Leave
  // it to the browser.
  if (request.cache === "only-if-cached") return;

  // Always fetch the document bypassing the HTTP cache, so a reopened app
  // never renders a stale HTML shell that points at an old build. No
  // offline fallback (this worker holds no cache) — same as before.
  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => fetch(request))
  );
});
