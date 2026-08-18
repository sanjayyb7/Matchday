import type { MetadataRoute } from "next";

const BASE_URL = "https://localderby.live";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/matchday-matcha"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
