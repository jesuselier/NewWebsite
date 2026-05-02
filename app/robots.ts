import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://martinezaccess.com/sitemap.xml",
    host: "https://martinezaccess.com",
  };
}
