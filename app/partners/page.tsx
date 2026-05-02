import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import PartnerCard from "@/components/PartnerCard";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Partners - Jesus Martinez",
  description:
    "Current partner offers and sponsorship opportunities with Jesus Martinez and JM Crypto.",
};

export default function PartnersPage() {
  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="03" title="Partner offers" />

      <Reveal
        as="section"
        className="premium-panel"
        style={{ padding: 44, marginBottom: 42 }}
      >
        <p
          className="font-serif text-ink"
          style={{ fontSize: 30, lineHeight: 1.25, margin: 0, maxWidth: "28ch", fontStyle: "italic" }}
        >
          Partner placements should feel like useful access, not random ads.
        </p>
        <p className="text-ink-dim" style={{ margin: "16px 0 0", maxWidth: "62ch" }}>
          Current offers are kept evergreen where possible so visitors do not see expired
          campaign windows. Always confirm the final terms on the partner site before joining.
        </p>
      </Reveal>

      <Reveal
        as="section"
        className="rule-top row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <PartnerCard
          logo="BTCC"
          logoEm="exchange"
          pill="Current"
          desc="Deposit cashback, VIP status, trading-fee relief, and bonus opportunities through the active JM Crypto partner campaign."
          details={[
            { label: "Trading bonus", value: "Up to +$5,000 USDT" },
            { label: "Campaign", value: "Limited-time offer" },
          ]}
          ctaHref="https://www.btcc.com/market-promotion/bonus2/kol?name=JMCryptoTrading"
          ctaText="Join BTCC"
        />
        <PartnerCard
          logo="iTrustCapital"
          logoEm="IRA"
          pill="Retirement"
          desc="Tax-advantaged crypto IRA access for investors who want long-term exposure inside retirement accounts."
          details={[
            { label: "Structure", value: "Traditional / Roth" },
            { label: "Tax profile", value: "Deferred or $0 gains" },
          ]}
          ctaHref="https://bit.ly/JesusMartinez-iTrustCapital"
          ctaText="Open an IRA"
        />
      </Reveal>

      <Reveal
        as="section"
        className="rule-top"
        style={{
          marginTop: 56,
          paddingTop: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="font-mono text-gold uppercase" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
            Sponsorship inquiries
          </span>
          <p className="font-serif text-ink" style={{ fontSize: 24, margin: "10px 0 0", fontStyle: "italic" }}>
            Reach crypto-native retail audiences with a trusted creator-led placement.
          </p>
        </div>
        <CTAButton href="/press-kit">View press kit</CTAButton>
      </Reveal>

      <Footer />
    </div>
  );
}
