import VideoCard from "@/components/VideoCard";
import { getFullLatest } from "@/lib/youtube";
import { LINKS, pageMetadata } from "@/lib/site";
export const revalidate = 1800;
export const metadata = pageMetadata(
  "Recent Videos",
  "Watch recent JM Crypto research, market coverage, and conversations with Jesus Martinez.",
  "/latest",
);
export default async function LatestPage() {
  const videos = await getFullLatest(12, ["jm_crypto"]);
  return (
    <div className="container page-body">
      <header className="page-heading">
        <span className="eyebrow">JM Crypto / On YouTube</span>
        <h1>A closer look at crypto.</h1>
        <p>Research, interviews, and the stories behind the moves.</p>
        <a
          className="text-link"
          href={LINKS.crypto + "/videos"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the channel for every upload <span aria-hidden="true">↗</span>
        </a>
      </header>
      <div className="video-grid video-grid-full">
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            channel={v.channel}
            date={v.publishedLabel}
            duration={v.duration}
            title={v.title}
            href={v.watchUrl}
            thumbSrc={v.thumbSrc}
          />
        ))}
      </div>
      <div className="archive-note">
        <span>Looking for the bigger picture?</span>
        <a
          className="text-link"
          href={LINKS.attention}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore The Attention Cycle <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
