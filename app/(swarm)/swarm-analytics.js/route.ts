// The static Swarm page (public/swarm-site) bypasses the Next.js layouts, so it loads the same
// Vercel Analytics loader as the tier list from here.
export const dynamic = "force-static";

export { GET } from "../../tier-list-analytics.js/route";
