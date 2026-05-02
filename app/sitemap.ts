import type { MetadataRoute } from "next";

const routes = ["", "/channels", "/latest", "/partners", "/connect", "/press-kit"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `https://martinezaccess.com${route}`,
    lastModified: new Date("2026-05-02"),
    changeFrequency: index === 0 || route === "/latest" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.75,
  }));
}
