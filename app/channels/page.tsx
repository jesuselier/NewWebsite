import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Channels - Jesus Martinez",
  description:
    "JM Crypto for daily crypto and macro coverage, and Jesus Martinez Trades for AI stocks and agentic trading.",
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
          tagline="Fast, focused coverage of crypto news, macro liquidity, and policy shifts moving digital assets."
          stats={{ num: "39K", label: "Subscribers", rate: "Daily\nvideos" }}
          ctaHref="https://youtube.com/@jm_crypto"
          ctaText="Watch JM Crypto"
          goldTop
          external
        />
        <ChannelCard
          kicker="AI stocks desk"
          title="Jesus Martinez"
          handle="@JesusMartinezTrades / YouTube"
          tagline="Coverage of AI stocks, semiconductors, and the agentic systems beginning to trade real money."
          stats={{ num: "37K", label: "Subscribers", rate: "2-3x\nweekly" }}
          ctaHref="https://www.youtube.com/@JesusMartinezTrades"
          ctaText="Watch JM Trades"
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
            The two desks work together: JM Crypto keeps the audience current on crypto and
            macro every day, while Jesus Martinez Trades tracks the AI names and agentic
            systems changing how trades get made.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <CTAButton href="/latest" variant="ghost">Latest videos</CTAButton>
          <CTAButton href="/connect">Work with Jesus</CTAButton>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
