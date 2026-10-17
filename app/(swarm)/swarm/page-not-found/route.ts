import { readFileSync } from "node:fs";
import { join } from "node:path";

// next.config.ts rewrites every joinswarm.ai path that is not the Swarm page, its legal pages or their files to
// here, so a mistyped or retired URL gets a real 404 instead of a redirect to the home page. The page itself is
// built by scripts/build-swarm-site.mjs from design-lab/landing/a-core-glow/404.html.
export const dynamic = "force-static";

export function GET() {
  const html = readFileSync(join(process.cwd(), "public/swarm-site/404.html"), "utf8");
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
