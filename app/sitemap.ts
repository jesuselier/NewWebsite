import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/latest", "/about", "/connect", "/press-kit", "/tier-list"].map(
    (path) => ({
      url: `https://www.martinezaccess.com${path}`,
      lastModified: "2026-09-24",
      changeFrequency: path === "" || path === "/latest" ? "daily" : "monthly",
      priority: path === "" ? 1 : 0.7,
    }),
  );
}
