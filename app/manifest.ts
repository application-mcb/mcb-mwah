import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Marian College of Baliuag Student Portal",
  short_name: "MCB Portal",
  description:
    "Progressive Web App for Marian College of Baliuag, Inc. featuring enrollment, registrar, grades, scholarships, and real-time campus services.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  dir: "ltr",
  lang: "en-PH",
  background_color: "#ffffff",
  theme_color: "#0f172a",
  categories: ["education", "productivity", "communication"],
  icons: [
    {
      src: "/logo.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/logo.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
  screenshots: [
    {
      src: "/hero.png",
      sizes: "1200x630",
      type: "image/png",
      label: "Marian College of Baliuag Student Portal dashboard",
    },
  ],
  shortcuts: [
    {
      name: "Open Registrar",
      url: "/registrar",
      description: "Access registrar workflows in one tap.",
    },
    {
      name: "View Grades",
      url: "/dashboard",
      description: "Jump directly to grade and performance tracking.",
    },
    {
      name: "Teacher Portal",
      url: "/teacher",
      description: "Manage classes, assignments, and tasks.",
    },
  ],
  prefer_related_applications: false,
});

export default manifest;

