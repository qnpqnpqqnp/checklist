"use client";

import { useEffect } from "react";
import { SW_VERSION } from "./sw-version.generated";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // If the page was already controlled by a worker when it loaded, then a
    // later controller change means a *new* deploy took over — reload once
    // so the tab stops running the old bundle. (On the very first visit
    // there is no prior controller, so we don't reload.)
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
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

    // Re-check for a new deploy whenever the app comes back to the
    // foreground — this is the "close and reopen" path for an installed PWA
    // as well as a tab regaining focus.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        reg?.update().catch(() => {});
      }
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
