import { SWARM_ORIGIN } from "@/lib/swarm";

// Served as joinswarm.ai/sitemap.xml through a host rewrite in next.config.ts.
export const dynamic = "force-static";

const PAGES = [
  { path: "/", lastmod: "2026-10-17", changefreq: "weekly", priority: "1" },
  { path: "/terms", lastmod: "2026-10-17", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", lastmod: "2026-10-17", changefreq: "yearly", priority: "0.2" },
  { path: "/refunds", lastmod: "2026-10-17", changefreq: "yearly", priority: "0.2" },
];

export function GET() {
  const urls = PAGES.map(
    (p) => `<url>
<loc>${SWARM_ORIGIN}${p.path}</loc>
<lastmod>${p.lastmod}</lastmod>
<changefreq>${p.changefreq}</changefreq>
<priority>${p.priority}</priority>
</url>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
