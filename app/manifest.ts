import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fragrances by Hameemah",
    short_name: "Hameemah",
    description: "Luxury, long-lasting perfumes and attars delivered across Pakistan.",
    start_url: "/",
    lang: "en-PK",
    categories: ["shopping", "lifestyle"],
    display: "standalone",
    background_color: "#06140d",
    theme_color: "#0a2a1c",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
