import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LeaderScore",
    short_name: "LeaderScore",
    description: "지도자의 공과를 점수로 평가합니다",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1014",
    theme_color: "#0e1014",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
