import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aula Studio Virtuale",
    short_name: "Aula",
    description: "Aula studio privata e condivisa in tempo reale.",
    start_url: "/",
    display: "standalone",
    background_color: "#030710",
    theme_color: "#07111f",
    icons: [
      {
        src: "/aula-app-icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
