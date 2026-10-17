import { SWARM_ORIGIN } from "@/lib/swarm";
import pages from "@/lib/swarm-pages.json";

// Served as joinswarm.ai/sitemap.xml through a host rewrite in next.config.ts. The dates come from
// lib/swarm-pages.json, which scripts/build-swarm-site.mjs updates only when a page really changes.
export const dynamic = "force-static";

export function GET() {
  const urls = pages
    .map((p) => `<url>\n<loc>${SWARM_ORIGIN}${p.path}</loc>\n<lastmod>${p.lastmod}</lastmod>\n</url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
