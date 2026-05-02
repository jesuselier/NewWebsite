import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Channels - Jesus Martinez",
  description:
    "JM Crypto daily market coverage and the Jesus Martinez podcast for long-form crypto, macro, and AI conversations.",
};

export default function ChannelsPage() {
  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="01" title="Channels" />

      <Reveal
        as="section"
        className="rule-top row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <ChannelCard
          kicker="Daily market desk"
          title="JM Crypto"
          handle="@jm_crypto / YouTube"
          tagline="Fast, focused coverage of crypto news, macro liquidity, policy shifts, and AI narratives moving digital assets."
          stats={{ num: "38K", label: "Subscribers", rate: "Daily\nvideos" }}
          ctaHref="https://youtube.com/@jm_crypto"
          ctaText="Watch JM Crypto"
          goldTop
          external
        />
        <ChannelCard
          kicker="Long-form show"
          title="Jesus Martinez"
          handle="@JesusMartinezCrypto / Podcast"
          tagline="Founder, investor, and operator conversations for people who want the context behind the headlines."
          stats={{ num: "37K", label: "Subscribers", rate: "Weekly\nepisodes" }}
          ctaHref="https://www.youtube.com/@JesusMartinezCrypto"
          ctaText="Open the podcast"
          external
        />
      </Reveal>

      <Reveal
        as="section"
        className="premium-panel"
        style={{
          marginTop: 48,
          padding: 40,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 36,
          alignItems: "center",
        }}
      >
        <div>
          <p
            className="font-serif text-ink"
            style={{ fontSize: 28, lineHeight: 1.25, margin: 0, fontStyle: "italic" }}
          >
            Built for viewers who want the signal before the market narrative becomes obvious.
          </p>
          <p className="text-ink-dim" style={{ margin: "16px 0 0", maxWidth: "58ch" }}>
            The two channels work together: daily episodes keep the audience current, while
            long-form interviews deepen trust with builders and investors across the space.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <CTAButton href="/latest" variant="ghost">Latest videos</CTAButton>
          <CTAButton href="/partners">Partner with Jesus</CTAButton>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
