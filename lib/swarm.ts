// Swarm, Jesus's AI crypto trading community, served at joinswarm.ai.
// next.config.ts routes that host to app/(swarm)/swarm; martinezaccess.com is unaffected.

// Vercel redirects joinswarm.ai to www.joinswarm.ai, so the www host is canonical.
// If the primary domain is switched to the bare host in Vercel, change it here too.
export const SWARM_ORIGIN = "https://www.joinswarm.ai";

export const SWARM_INTRO = {
  id: "n15W6X84IGg",
  title: "Welcome To Swarm | AI Agentic Trading",
  duration: "4:05",
  durationLabel: "4 minutes 5 seconds",
  url: "https://youtu.be/n15W6X84IGg",
};

export type SwarmPlanKey = "founding" | "standard" | "yearly";

export type SwarmPlan = {
  key: SwarmPlanKey;
  name: string;
  price: string;
  period: string;
  note: string;
  // Whop plan (variant) IDs, prefixed plan_. Set them in Vercel's environment
  // variables; until they exist the page shows a checkout placeholder.
  whopPlanId: string | undefined;
};

// Pricing from Jesus's pre-launch checkout, October 16, 2026. Yearly confirmed
// the same day as $990 (two months free on the $99 plan).
export const SWARM_PLANS: SwarmPlan[] = [
  {
    key: "founding",
    name: "Founding Monthly",
    price: "$49",
    period: "/mo",
    note: "Forever. Cancel whenever. 50 seats only.",
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_PLAN_FOUNDING || undefined,
  },
  {
    key: "standard",
    name: "Standard Monthly",
    price: "$99",
    period: "/mo",
    note: "The price once the founding seats are gone.",
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_PLAN_STANDARD || undefined,
  },
  {
    key: "yearly",
    name: "Yearly",
    price: "$990",
    period: "/yr",
    note: "2 months free.",
    whopPlanId: process.env.NEXT_PUBLIC_WHOP_PLAN_YEARLY || undefined,
  },
];
