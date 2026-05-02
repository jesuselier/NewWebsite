import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreatorHero from "@/components/CreatorHero";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import PartnerCard from "@/components/PartnerCard";
import EmailTile from "@/components/EmailTile";
import MediaKitTile from "@/components/MediaKitTile";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";
import LatestPinned from "@/components/LatestPinned";
import { getFullLatest } from "@/lib/youtube";

export default async function JesusHome() {
  const latest = await getFullLatest(10, ["jm_crypto", "podcast"]);

  return (
    <div className="container-page">
      <Navbar />

      <CreatorHero
        kicker={
          <>
            Market signal <span style={{ color: "var(--gold)" }}>/</span> Since 2021{" "}
            <span style={{ color: "var(--gold)" }}>/</span> Miami
          </>
        }
        name={{ primary: "Jesus", secondary: "Martinez" }}
        portraitSrc="/Happy.webp"
        portraitAlt="Jesus Martinez"
        pillLabel="JM / 2026"
        stat={{ num: 385, suffix: "K", label: "across platforms" }}
        role={
          <>
            Creator{" "}
            <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>/</span>{" "}
            Host{" "}
            <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>/</span>{" "}
            Analyst
          </>
        }
        paragraph={
          <>
            JM Crypto turns fast-moving crypto, macro, and AI narratives into clear
            signal for serious retail investors. The work began in 2021 after helping
            my brother recover from a devastating loss. Since then, I have covered the
            markets full-time with one standard: clarity before hype.
          </>
        }
        ctas={
          <>
            <CTAButton variant="primary" href="https://youtube.com/@jm_crypto" external>
              Watch JM Crypto
            </CTAButton>
            <CTAButton
              variant="ghost"
              href="https://www.youtube.com/@JesusMartinezCrypto"
              arrow="->"
              external
            >
              Listen to the podcast
            </CTAButton>
          </>
        }
        meta={[
          { label: "Primary platform", value: "X / 310K followers" },
          { label: "Focus", value: "Crypto, macro, and AI" },
        ]}
      />

      <div className="signal-tape rule-top rule-bottom" aria-label="Coverage areas">
        <div>
          Crypto market signal / AI infrastructure / Macro liquidity / Founder interviews / Risk-first retail strategy /{" "}
        </div>
        <div aria-hidden>
          Crypto market signal / AI infrastructure / Macro liquidity / Founder interviews / Risk-first retail strategy /{" "}
        </div>
      </div>

      <SectionHead num="01" title="Channels" id="channels" />
      <Reveal
        as="section"
        className="rule-top row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <ChannelCard
          kicker="Daily videos"
          title="JM Crypto"
          handle="@jm_crypto / youtube.com/@jm_crypto"
          tagline="Daily crypto news, macro context, and AI market narratives without the noise."
          stats={{ num: "38K", label: "Subscribers", rate: "Daily\nepisodes" }}
          ctaHref="https://youtube.com/@jm_crypto"
          ctaText="Subscribe on YouTube"
          goldTop
          external
        />
        <ChannelCard
          kicker="Podcast"
          title="Jesus Martinez"
          handle="@JesusMartinezCrypto / podcast"
          tagline="Long-form conversations with founders, investors, and operators moving the space."
          stats={{ num: "37K", label: "Subscribers", rate: "Weekly\nepisodes" }}
          ctaHref="https://www.youtube.com/@JesusMartinezCrypto"
          ctaText="Listen to the show"
          external
        />
      </Reveal>

      <SectionHead num="02" title="Latest" id="videos" />
      <LatestPinned videos={latest} />

      <SectionHead num="03" title="Partner offers" id="partners" />
      <Reveal>
        <div style={{ maxWidth: 720, padding: "0 0 48px" }}>
          <p
            className="font-serif text-ink"
            style={{
              fontSize: 24,
              fontStyle: "italic",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            Curated platforms, tools, and campaigns I trust enough to put my name on.
          </p>
          <p
            className="font-mono text-gold uppercase"
            style={{ fontSize: 11, letterSpacing: "0.16em", marginTop: 12, marginBottom: 0 }}
          >
            Current partner offers
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
            desc="10% cashback on your first deposit, plus VIP3 status for one month and 30% off trading fees."
            details={[
              { label: "Trading bonus", value: "Up to +$5,000 USDT" },
              { label: "Status", value: "Current campaign" },
            ]}
            ctaHref="https://www.btcc.com/market-promotion/bonus2/kol?name=JMCryptoTrading"
            ctaText="Join BTCC"
          />
          <PartnerCard
            logo="iTrustCapital"
            logoEm="IRA"
            pill="Retirement"
            desc="Make your retirement money work for you with tax-advantaged crypto IRA options."
            details={[
              { label: "Structure", value: "Traditional / Roth" },
              { label: "Tax profile", value: "Deferred or $0 gains" },
            ]}
            ctaHref="https://bit.ly/JesusMartinez-iTrustCapital"
            ctaText="Open an IRA"
          />
        </section>
      </Reveal>

      <SectionHead num="04" title="Connect" id="connect" />
      <Reveal
        as="section"
        className="rule-top rule-bottom row-3"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr" }}
      >
        <FollowUsTile />
        <EmailTile />
        <MediaKitTile />
      </Reveal>

      <Footer />
    </div>
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
        <span className="font-serif text-ink" style={{ fontSize: 22, fontWeight: 400 }}>
          Follow Jesus
        </span>
        <span className="font-mono text-gold uppercase" style={{ fontSize: 9, letterSpacing: "0.16em" }}>
          Daily takes
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
              <span className="font-serif" style={{ fontSize: 15 }}>
                {r.handle}
              </span>
              <span className="font-serif text-gold" style={{ fontSize: 14 }}>-&gt;</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
