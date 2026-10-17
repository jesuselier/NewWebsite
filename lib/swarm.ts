// Swarm, Jesus's AI crypto trading community, served at joinswarm.ai.
// The page itself is static (public/swarm-site, built by scripts/build-swarm-site.mjs);
// next.config.ts serves it at / on that host. martinezaccess.com is unaffected.

// Vercel redirects joinswarm.ai to www.joinswarm.ai, so the www host is canonical.
// If the primary domain is switched to the bare host in Vercel, change it here and in the build script.
export const SWARM_ORIGIN = "https://www.joinswarm.ai";
