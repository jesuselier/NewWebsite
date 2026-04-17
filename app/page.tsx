import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import VideoCard from "@/components/VideoCard";
import PartnerCard from "@/components/PartnerCard";
import SocialTile from "@/components/SocialTile";
import PressCard from "@/components/PressCard";
import MediaKitCard from "@/components/MediaKitCard";
import { getLandingLatest } from "@/lib/youtube";

export const revalidate = 1800;

export default async function Home() {
  const latest = await getLandingLatest();
  return (
    <div className="container-page">
      <Navbar />
      <Hero />

      <SectionHead num="§ 01" title="The channels" id="channels" />
      <section
        className="rule-top row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <ChannelCard
          kicker="Daily videos"
          title="JM Crypto"
          handle="@jm_crypto · youtube.com/@jm_crypto"
          tagline="News, macro, and the AI layer reshaping crypto."
          stats={{ num: "38K", label: "Subscribers", rate: "2 videos\nper weekday" }}
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
      </section>

      <SectionHead num="§ 02" title="Latest" id="videos" />
      <section
        className="row-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 40,
        }}
      >
        {latest.map((v) => (
          <VideoCard
            key={v.id}
            channel={v.channel}
            channelGold={v.gold}
            date={v.publishedLabel}
            title={v.title}
            href={v.watchUrl}
            thumbSrc={v.thumbSrc}
          />
        ))}
      </section>

      <SectionHead num="§ 03" title="Partners" id="partners" />
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
          desc="Save money while you build your crypto IRA — long-term positioning without the short-term tax drag."
          details={[
            { label: "Structure", value: "Traditional · Roth" },
            { label: "Capital gains", value: "Deferred or $0" },
          ]}
          ctaHref="https://bit.ly/JesusMartinez-iTrustCapital"
          ctaText="Open an IRA"
        />
      </section>

      <SectionHead num="§ 04" title="Connect" id="connect" />
      <section
        className="rule-top rule-bottom row-4"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
        }}
      >
        <SocialTile
          name="X · @JesusMartinez"
          handle="310K followers · featured platform"
          tag="Real-time market takes"
          featured
          featuredTag="★ Breaking news, threads, daily signal"
          href="https://twitter.com/JesusMartinez"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.656l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
            </svg>
          }
        />
        <SocialTile
          name="Instagram"
          handle="@jesusmartinezez"
          tag="Photo · reels"
          href="https://instagram.com/jesusmartinezez"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
            </svg>
          }
        />
        <SocialTile
          name="YouTube"
          handle="@jm_crypto · 38K"
          tag="Daily videos"
          href="https://youtube.com/@jm_crypto"
          icon={
            <svg width="20" height="14" viewBox="0 0 24 17" fill="currentColor">
              <path d="M23.5 2.6c-.3-1-1-1.8-2-2C19.5 0 12 0 12 0S4.5 0 2.5.6c-1 .2-1.7 1-2 2C0 4.6 0 8.5 0 8.5s0 3.9.5 5.9c.3 1 1 1.8 2 2C4.5 17 12 17 12 17s7.5 0 9.5-.6c1-.2 1.7-1 2-2 .5-2 .5-5.9.5-5.9s0-3.9-.5-5.9ZM9.6 12.3V4.7l6.2 3.8-6.2 3.8Z" />
            </svg>
          }
        />
        <SocialTile
          name="Podcast"
          handle="All platforms"
          tag="Long-form interviews"
          href="/channels"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" />
            </svg>
          }
        />
      </section>

      <SectionHead num="§ 05" title="Press" id="press" />
      <section
        className="press-row"
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 40,
        }}
      >
        <PressCard />
        <MediaKitCard />
      </section>

      <Footer />
    </div>
  );
}
