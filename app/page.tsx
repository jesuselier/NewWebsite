import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import PartnerCard from "@/components/PartnerCard";
import EmailTile from "@/components/EmailTile";
import MediaKitTile from "@/components/MediaKitTile";
import Reveal from "@/components/Reveal";
import LatestPinned from "@/components/LatestPinned";
import { getFullLatest } from "@/lib/youtube";

export const revalidate = 1800;

export default async function Home() {
  const latest = await getFullLatest(10);
  return (
    <div className="container-page">
      <Navbar />
      <Hero />

      <SectionHead num="§ 01" title="The creators" id="creators" />
      <Reveal as="section"
        className="rule-top row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <CreatorCard
          monogram="JM"
          kicker="Founder · Host · Analyst"
          name="Jesus Martinez"
          role="Crypto markets & industry analysis"
          bio="Founder of JM Crypto and the Jesus Martinez podcast — covering markets, macro, AI's impact on the space, and long-form interviews with the people building it."
          goldTop
        />
        <CreatorCard
          monogram="J"
          kicker="Educator · Future tech"
          name="Jennifer Martinez"
          role="Crypto + AI explained simply"
          bio="Beginner-friendly education on crypto, AI, digital money, and the future of technology — bringing clarity to the next wave of the internet."
        />
      </Reveal>

      <SectionHead num="§ 02" title="The channels" id="channels" />
      <Reveal as="section"
        className="rule-top row-3"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}
      >
        <ChannelCard
          kicker="Daily videos"
          title="JM Crypto"
          handle="@jm_crypto · youtube"
          tagline="News, macro, and the AI layer reshaping crypto."
          stats={{ num: "38K", label: "Subscribers", rate: "Daily\nepisodes" }}
          ctaHref="https://youtube.com/@jm_crypto"
          ctaText="Subscribe on YouTube"
          goldTop
          external
        />
        <ChannelCard
          kicker="Podcast"
          title="Jesus Martinez"
          handle="@JesusMartinezCrypto · podcast"
          tagline="Long-form conversations with the people moving the space."
          stats={{ num: "37K", label: "Subscribers", rate: "Weekly\nepisodes" }}
          ctaHref="https://www.youtube.com/@JesusMartinezCrypto"
          ctaText="Listen to the show"
          external
        />
        <ChannelCard
          kicker="New · Crypto + AI"
          title="Jennifer Martinez"
          handle="@JenniferMartinezCrypto · youtube"
          tagline="Beginner-friendly takes on crypto, AI, and the future of money."
          stats={{ num: "New", label: "Channel", rate: "Launching\n2026" }}
          ctaHref="https://youtube.com/@JenniferMartinezCrypto"
          ctaText="Subscribe on YouTube"
          external
        />
      </Reveal>

      <SectionHead num="§ 03" title="Latest" id="videos" />
      <LatestPinned videos={latest} />

      <SectionHead num="§ 04" title="Partner offers" id="partners" />
      <Reveal>
        <div style={{ maxWidth: 680, padding: "0 0 48px" }}>
          <p
            className="font-serif text-ink"
            style={{
              fontSize: 24,
              fontStyle: "italic",
              lineHeight: 1.35,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Curated tools and platforms we trust and use.
          </p>
          <p
            className="font-mono text-gold uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Deals for you, below.
          </p>
        </div>

        <section
          className="rule-top row-2"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
        >
          <PartnerCard
            logo="BTCC"
            logoEm="exchange"
            pill="Live campaign"
            desc="10% cashback on your first deposit, plus VIP3 status for one month — 30% off trading fees."
            details={[
              { label: "Trading bonus", value: "Up to +$5,000 USDT" },
              { label: "Window", value: "Mar 31 – Apr 30" },
            ]}
            ctaHref="https://www.btcc.com/market-promotion/bonus2/kol?name=JMCryptoTrading"
            ctaText="Join BTCC"
          />
          <PartnerCard
            logo="iTrustCapital"
            logoEm="IRA"
            pill="Retirement"
            desc="Make your retirement money work for you — save up to 37% on crypto taxes."
            details={[
              { label: "Structure", value: "Traditional · Roth" },
              { label: "Capital gains", value: "Deferred or $0" },
            ]}
            ctaHref="https://bit.ly/JesusMartinez-iTrustCapital"
            ctaText="Open an IRA"
          />
        </section>
      </Reveal>

      <SectionHead num="§ 05" title="Connect" id="connect" />
      <Reveal as="section"
        className="rule-top rule-bottom row-3"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.4fr 1fr",
        }}
      >
        <FollowUsTile />
        <EmailTile />
        <MediaKitTile />
      </Reveal>

      <Footer />
    </div>
  );
}

type CreatorCardProps = {
  monogram: string;
  kicker: string;
  name: string;
  role: string;
  bio: string;
  goldTop?: boolean;
};

function CreatorCard({ monogram, kicker, name, role, bio, goldTop = false }: CreatorCardProps) {
  const borderTop = goldTop
    ? { borderTop: "1px solid var(--gold)", marginTop: "-0.5px" }
    : {};
  return (
    <article
      className="rule-right"
      style={{
        padding: 48,
        minHeight: 360,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: 36,
        alignItems: "start",
        ...borderTop,
      }}
    >
      <div
        className="diag-stripes"
        style={{
          width: 120,
          height: 120,
          border: "0.5px solid var(--rule-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className={`font-serif ${goldTop ? "text-gold" : "text-ink"}`}
          style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1 }}
        >
          {monogram}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span
          className={`font-mono uppercase ${goldTop ? "text-gold" : "text-ink-mute"}`}
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          {kicker}
        </span>
        <h3
          className="font-serif text-ink"
          style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, margin: 0 }}
        >
          {name}
        </h3>
        <span
          className="font-serif text-ink-dim"
          style={{ fontSize: 16, fontStyle: "italic", letterSpacing: "-0.005em" }}
        >
          {role}
        </span>
        <p
          className="font-serif text-ink-dim"
          style={{ fontSize: 17, lineHeight: 1.5, margin: "10px 0 0" }}
        >
          {bio}
        </p>
      </div>
    </article>
  );
}

function FollowUsTile() {
  const rows: { label: string; handle: string; href: string }[] = [
    { label: "X", handle: "@JesusMartinez", href: "https://twitter.com/JesusMartinez" },
    { label: "Instagram", handle: "@jesusmartinezez", href: "https://instagram.com/jesusmartinezez" },
  ];
  return (
    <div
      style={{
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: "0.5px solid var(--gold)",
        margin: "-0.5px",
        background: "var(--gold-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span
          className="font-serif text-ink"
          style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          Follow us
        </span>
        <span className="font-mono text-gold uppercase" style={{ fontSize: 9, letterSpacing: "0.16em" }}>
          ★ Daily takes
        </span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <li key={`${r.label}-${r.handle}`}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                alignItems: "baseline",
                gap: 12,
                color: "var(--ink-dim)",
                padding: "8px 0",
                borderTop: "0.5px solid var(--rule)",
              }}
            >
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ink-mute)" }}
              >
                {r.label}
              </span>
              <span className="font-serif" style={{ fontSize: 15, letterSpacing: "-0.005em" }}>
                {r.handle}
              </span>
              <span className="font-serif text-gold" style={{ fontSize: 14 }}>↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
