import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Metha Offshore — ADF",
    short_name: "Metha ADF",
    description: "Avaliação de Desempenho de Campo — IRATA",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1B26",
    theme_color: "#0E1B26",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
