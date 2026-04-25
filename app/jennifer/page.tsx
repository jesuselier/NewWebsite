import type { Metadata } from "next";
import PersonalNavbar from "@/components/PersonalNavbar";
import Footer from "@/components/Footer";
import CreatorHero from "@/components/CreatorHero";
import SectionHead from "@/components/SectionHead";
import ChannelCard from "@/components/ChannelCard";
import EmailTile from "@/components/EmailTile";
import MediaKitTile from "@/components/MediaKitTile";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";
import LatestPinned from "@/components/LatestPinned";
import { getFullLatest } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Jennifer Martinez — Martinez Access",
  description:
    "Crypto and AI, explained simply — by Jennifer Martinez. Beginner-friendly takes on digital money and the future of technology.",
  openGraph: {
    title: "Jennifer Martinez — Martinez Access",
    description:
      "Crypto and AI, explained simply — by Jennifer Martinez.",
    images: ["/sheesh.jpg"],
  },
};

export const revalidate = 1800;

export default async function JenniferPage() {
  const latest = await getFullLatest(10, ["jennifer"]);
  const hasVideos = latest.length > 0;
  return (
    <div className="container-page">
      <PersonalNavbar current="jennifer" />

      <CreatorHero
        kicker={
          <>
            The creator <span style={{ color: "var(--gold)" }}>·</span> Launching 2026{" "}
            <span style={{ color: "var(--gold)" }}>·</span> Miami
          </>
        }
        name={{ primary: "Jennifer", secondary: "Martinez" }}
        portraitSrc="/sheesh.jpg"
        portraitAlt="Jennifer Martinez"
        pillLabel="JENNIFER · 2026"
        stat={{ num: 2026, label: "new chapter" }}
        role={
          <>
            Educator{" "}
            <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>{" "}
            Crypto + AI{" "}
            <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>{" "}
            Future tech
          </>
        }
        paragraph={
          <>
            A new channel for the people the space usually leaves behind — the curious,
            the cautious, the just-starting-out. Crypto, AI, and the future of money,
            explained simply, one idea at a time.
          </>
        }
        ctas={
          <CTAButton
            variant="primary"
            href="https://youtube.com/@JenniferMartinezCrypto"
            external
          >
            Subscribe on YouTube
          </CTAButton>
        }
        meta={[
          { label: "Channel", value: "@JenniferMartinezCrypto" },
          { label: "Launching", value: "2026" },
        ]}
      />

      <SectionHead num="§ 01" title="Channel" id="channels" />
      <Reveal as="section"
        className="rule-top"
        style={{ display: "grid", gridTemplateColumns: "1fr" }}
      >
        <ChannelCard
          kicker="New · Crypto + AI"
          title="Jennifer Martinez"
          handle="@JenniferMartinezCrypto · youtube"
          tagline="Beginner-friendly takes on crypto, AI, and the future of money."
          stats={{ num: "New", label: "Channel", rate: "Launching\n2026" }}
          ctaHref="https://youtube.com/@JenniferMartinezCrypto"
          ctaText="Subscribe on YouTube"
          goldTop
          external
        />
      </Reveal>

      <SectionHead num="§ 02" title="Latest" id="videos" />
      {hasVideos ? (
        <LatestPinned videos={latest} />
      ) : (
        <Reveal as="section"
          className="rule-top"
          style={{
            padding: "56px 0",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p
            className="font-serif text-ink-dim"
            style={{ fontSize: 22, fontStyle: "italic", lineHeight: 1.5, maxWidth: "56ch", margin: 0 }}
          >
            First episodes coming soon. Subscribe on YouTube and you&apos;ll be there
            for episode one.
          </p>
          <span
            className="font-mono text-ink-mute uppercase"
            style={{ fontSize: 10, letterSpacing: "0.14em" }}
          >
            Channel launching 2026.
          </span>
        </Reveal>
      )}

      <SectionHead num="§ 03" title="Connect" id="connect" />
      <Reveal as="section"
        className="rule-top rule-bottom row-2"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr" }}
      >
        <EmailTile />
        <MediaKitTile />
      </Reveal>

      <Footer />
    </div>
  );
}
