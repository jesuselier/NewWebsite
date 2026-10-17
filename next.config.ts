import type { NextConfig } from "next";

// joinswarm.ai (with or without www) serves the static Swarm page in public/swarm-site
// (built by scripts/build-swarm-site.mjs). martinezaccess.com keeps every existing route.
const SWARM_HOST = [{ type: "host" as const, value: "(?:www\\.)?joinswarm\\.ai" }];
const SITE_HOST = [{ type: "host" as const, value: "(?:www\\.)?martinezaccess\\.com" }];

const nextConfig: NextConfig = {
  // The Swarm 404 route reads the built page; keep it in that route's server bundle.
  outputFileTracingIncludes: { "/swarm/page-not-found": ["./public/swarm-site/404.html"] },
  async redirects() {
    return [
      // Swarm has its own domain.
      {
        source: "/swarm",
        has: SITE_HOST,
        destination: "https://www.joinswarm.ai/",
        permanent: false,
      },
      { source: "/swarm-site/:path*", has: SITE_HOST, destination: "https://www.joinswarm.ai/", permanent: false },
      // On joinswarm.ai the page lives at / and the legal pages at /terms, /privacy and /refunds.
      { source: "/swarm", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/index.html", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/swarm-site/index.html", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/swarm-site/:page(terms|privacy|refunds).html", has: SWARM_HOST, destination: "/:page", permanent: true },
    ];
  },
  async rewrites() {
    return {
      // beforeFiles so these override the martinezaccess.com files at the same paths.
      beforeFiles: [
        { source: "/", has: SWARM_HOST, destination: "/swarm-site/index.html" },
        { source: "/:page(terms|privacy|refunds)", has: SWARM_HOST, destination: "/swarm-site/:page.html" },
        { source: "/robots.txt", has: SWARM_HOST, destination: "/swarm/robots.txt" },
        { source: "/sitemap.xml", has: SWARM_HOST, destination: "/swarm/sitemap.xml" },
        { source: "/favicon.ico", has: SWARM_HOST, destination: "/brand/swarm/icons/favicon.ico" },
        // The built 404 page is a public file too: answer its own URL with a real 404, not a 200 copy of the page.
        { source: "/swarm-site/404.html", has: SWARM_HOST, destination: "/swarm/page-not-found" },
        // Keep last. Every other joinswarm.ai path gets the Swarm 404 page with a real 404 status (not a redirect
        // home, which Google treats as a soft 404), so martinezaccess.com pages and files never render under the
        // Swarm domain. beforeFiles rewrites keep matching after a hit, so the destinations above are excluded too.
        {
          source:
            "/:path((?!_next/|_vercel/|brand/|swarm-site/|swarm/|swarm-analytics\\.js$|terms$|privacy$|refunds$|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$).+)",
          has: SWARM_HOST,
          destination: "/swarm/page-not-found",
        },
      ],
      afterFiles: [
        { source: "/tier-list", destination: "/tier-list-assets/index.html" },
        // Preview deployments show the Swarm page at /swarm (the two production hosts redirect it).
        { source: "/swarm", destination: "/swarm-site/index.html" },
      ],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i1.ytimg.com" },
      { protocol: "https", hostname: "i2.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      { protocol: "https", hostname: "i4.ytimg.com" },
    ],
  },
};

export default nextConfig;
