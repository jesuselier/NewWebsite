import type { NextConfig } from "next";

// joinswarm.ai (with or without www) serves the static Swarm page in public/swarm-site
// (built by scripts/build-swarm-site.mjs). martinezaccess.com keeps every existing route.
const SWARM_HOST = [{ type: "host" as const, value: "(?:www\\.)?joinswarm\\.ai" }];
const SITE_HOST = [{ type: "host" as const, value: "(?:www\\.)?martinezaccess\\.com" }];

const nextConfig: NextConfig = {
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
      // On joinswarm.ai the page lives at /, not /swarm.
      { source: "/swarm", has: SWARM_HOST, destination: "/", permanent: false },
      // joinswarm.ai is the Swarm page and its three legal pages: anything that is not one of
      // them, their assets or Next and Vercel internals goes back to the Swarm home page,
      // so martinezaccess.com pages never render under the Swarm domain.
      {
        source:
          "/:path((?!_next/|_vercel/|brand/|swarm|terms$|privacy$|refunds$|favicon\\.ico|robots\\.txt|sitemap\\.xml).+)",
        has: SWARM_HOST,
        destination: "/",
        permanent: false,
      },
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
