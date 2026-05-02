import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import EmailTile from "@/components/EmailTile";
import MediaKitTile from "@/components/MediaKitTile";
import SocialTile from "@/components/SocialTile";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Connect - Jesus Martinez",
  description:
    "Contact Jesus Martinez for sponsorships, press, collaborations, and social channels.",
};

export default function ConnectPage() {
  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="04" title="Connect" />

      <Reveal
        as="section"
        className="rule-top rule-bottom row-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <EmailTile />
        <MediaKitTile />
        <SocialTile
          name="X"
          handle="310K followers"
          tag="Daily market takes"
          href="https://twitter.com/JesusMartinez"
          featured
          featuredTag="Primary platform"
        />
        <SocialTile
          name="Instagram"
          handle="@jesusmartinezez"
          tag="Behind the scenes"
          href="https://instagram.com/jesusmartinezez"
        />
      </Reveal>

      <Reveal
        as="section"
        className="premium-panel"
        style={{ marginTop: 48, padding: 40 }}
      >
        <span className="font-mono text-gold uppercase" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
          Best fit
        </span>
        <p
          className="font-serif text-ink"
          style={{ fontSize: 28, lineHeight: 1.3, margin: "12px 0 0", maxWidth: "34ch", fontStyle: "italic" }}
        >
          Sponsorships, media requests, founder interviews, exchange campaigns, wallet tools,
          retirement products, and AI infrastructure stories.
        </p>
      </Reveal>

      <Footer />
    </div>
  );
}
