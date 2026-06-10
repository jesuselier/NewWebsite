import type { MetadataRoute } from "next";

const routes = ["", "/channels", "/latest", "/connect", "/press-kit"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `https://martinezaccess.com${route}`,
    lastModified: new Date("2026-06-10"),
    changeFrequency: index === 0 || route === "/latest" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.75,
  }));
}
