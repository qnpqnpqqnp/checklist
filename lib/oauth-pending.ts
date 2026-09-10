// Shared marker for "an OAuth redirect is in flight in this tab".
//
// ServiceWorkerRegister reloads the page when a new service worker takes
// control. That reload must NOT happen in the middle of the Google sign-in
// round-trip: mid-flight it aborts the navigation to the provider, and on
// the way back it interrupts the one-time code exchange. This flag lets the
// reload logic hold off until the flow has finished.

const KEY = "sw:oauth-pending";
const MAX_AGE_MS = 5 * 60 * 1000;

export function markOAuthPending() {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode, disabled) — the URL check
    // in isOAuthPending() still covers the return leg.
  }
}

export function clearOAuthPending() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

export function isOAuthPending() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw && Date.now() - Number(raw) < MAX_AGE_MS) return true;
  } catch {}
  if (typeof window !== "undefined") {
    // The provider sends the user back with ?code= (success) or ?error=.
    if (/[?&](code|error|state)=/.test(window.location.search)) return true;
  }
  return false;
}
