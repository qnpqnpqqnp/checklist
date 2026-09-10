import type { NextConfig } from "next";

const NO_STORE = "no-cache, no-store, must-revalidate";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The service worker script must never be cached, so a new deploy's
        // worker is fetched on the very next visit instead of up to 24h
        // later. Without this the installed PWA can stay pinned to an old
        // build indefinitely.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: NO_STORE },
        ],
      },
      {
        // Same reasoning for the web app manifest.
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: NO_STORE }],
      },
    ];
  },
};

export default nextConfig;
