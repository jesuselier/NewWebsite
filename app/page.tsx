import PortalSplit from "@/components/PortalSplit";

export default function Home() {
  return (
    <PortalSplit
      creators={[
        {
          href: "/jesus",
          name: "Jesus Martinez",
          tagline: "Crypto markets, macro, and the AI layer reshaping money.",
          portrait: "/Happy.webp",
          alt: "Jesus Martinez",
          pillLabel: "JESUS · 2026",
        },
        {
          href: "/jennifer",
          name: "Jennifer Martinez",
          tagline: "Crypto and AI, explained simply for the next wave.",
          portrait: "/sheesh.jpg",
          alt: "Jennifer Martinez",
          pillLabel: "JENNIFER · 2026",
        },
      ]}
    />
  );
}
