import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sri Mathru Driving School — Driving Lessons in Bengaluru",
    short_name: "Sri Mathru",
    description:
      "Book driving lessons online — automatic & manual cars, certified instructors, RTO license assistance and real-time progress tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
