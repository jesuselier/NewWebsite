import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import VideoCard from "@/components/VideoCard";
import { getFullLatest } from "@/lib/youtube";

export const metadata = {
  title: "Latest — Jesus Martinez",
  description:
    "Most recent videos from JM Crypto and the Jesus Martinez podcast, live from YouTube.",
};

export const revalidate = 1800;

export default async function LatestPage() {
  const videos = await getFullLatest(12);

  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="§ 02" title="Latest" />
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
      {videos.length === 0 && (
        <p
          className="font-serif text-ink-mute"
          style={{ fontSize: 18, fontStyle: "italic" }}
        >
          Feed is loading — check back in a moment.
        </p>
      )}
      <Footer />
    </div>
  );
}
