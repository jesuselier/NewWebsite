import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/channels",
    "/latest",
    "/about",
    "/connect",
    "/press-kit",
    "/tier-list",
  ].map((path) => ({
    url: `https://www.martinezaccess.com${path}`,
    lastModified: "2026-09-24",
    changeFrequency: path === "/latest" || path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
