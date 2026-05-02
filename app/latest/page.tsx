import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import VideoCard from "@/components/VideoCard";
import { getFullLatest } from "@/lib/youtube";

export const metadata = {
  title: "Latest - Jesus Martinez",
  description:
    "Most recent videos from JM Crypto and the Jesus Martinez podcast, live from YouTube.",
};

export const revalidate = 1800;

export default async function LatestPage() {
  const videos = await getFullLatest(12);
  const usingFallback = videos.some((v) => v.id.endsWith("-fallback"));

  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="02" title="Latest" />

      {usingFallback && (
        <section className="premium-panel" style={{ padding: 28, marginBottom: 34 }}>
          <p className="font-serif text-ink" style={{ fontSize: 22, fontStyle: "italic", margin: 0 }}>
            The live YouTube feed is slow right now, so these links take you straight
            to the newest uploads on each channel.
          </p>
        </section>
      )}

      <section
        className="row-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 40,
          paddingBottom: 24,
        }}
      >
        {videos.map((v) => (
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

      <Footer />
    </div>
  );
}
