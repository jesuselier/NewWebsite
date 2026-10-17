import { SWARM_ORIGIN } from "@/lib/swarm";

// Served as joinswarm.ai/robots.txt through a host rewrite in next.config.ts.
export const dynamic = "force-static";

export function GET() {
  return new Response(`User-Agent: *\nAllow: /\n\nSitemap: ${SWARM_ORIGIN}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
