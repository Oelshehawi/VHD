import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VHD Application",
    short_name: "VHD App",
    description: "VHD CRM",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/icon_192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon_512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
