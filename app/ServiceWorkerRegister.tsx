"use client";

import { useEffect } from "react";
import { SW_VERSION } from "./sw-version.generated";
import { isOAuthPending } from "@/lib/oauth-pending";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // If the page was already controlled by a worker when it loaded, a later
    // controller change means a *new* deploy took over — reload once so the
    // tab stops running the old bundle. (First visit has no prior
    // controller, so nothing to reload.)
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    let swapDeferred = false;

    const finishSwap = () => {
      if (!hadController || reloaded) return;
      // Never reload in the middle of the Google sign-in round-trip: it
      // aborts the trip to the provider, or interrupts the code exchange on
      // the way back. Retry once the flow is done (see onVisible).
      if (isOAuthPending()) {
        swapDeferred = true;
        return;
      }
      // Don't reload while the user is away at the provider — wait until the
      // tab is focused again.
      if (document.visibilityState !== "visible") {
        swapDeferred = true;
        return;
      }
      reloaded = true;
      window.location.reload();
    };

    const onControllerChange = () => finishSwap();
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    let reg: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      // The ?v= query changes every build, so the browser always sees a new
      // worker for a new deploy. updateViaCache:"none" keeps the HTTP cache
      // out of the update check entirely.
      .register(`/sw.js?v=${encodeURIComponent(SW_VERSION)}`, {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        reg = registration;
        registration.update().catch(() => {});
      })
      .catch(() => {});

    // Re-check for a new deploy whenever the app returns to the foreground
    // (the "close and reopen" path for an installed PWA, and a tab regaining
    // focus). Also the moment to finish a swap that was deferred because a
    // new worker took control while we were away or mid-auth.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      reg?.update().catch(() => {});
      if (swapDeferred && navigator.serviceWorker.controller) finishSwap();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
