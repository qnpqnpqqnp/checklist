import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "체크리스트",
    short_name: "체크리스트",
    description: "체크리스트",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "ko",
    background_color: "#EDEEF1",
    theme_color: "#4A5BA8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
