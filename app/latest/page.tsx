import VideoCard from "@/components/VideoCard";
import { getFullLatest } from "@/lib/youtube";
import { LINKS, pageMetadata } from "@/lib/site";
export const revalidate = 1800;
export const metadata = pageMetadata(
  "JM Crypto Videos",
  "Long-form crypto research, interviews, and market coverage from Jesus Martinez on JM Crypto.",
  "/latest",
);
export default async function LatestPage() {
  const videos = await getFullLatest(12);
  return (
    <div className="container page-body">
      <header className="page-heading">
        <span className="section-label">JM Crypto</span>
        <h1>Go beyond the headline.</h1>
        <p>
          Full-length interviews, project deep dives, and the stories behind the
          moves.
        </p>
        <a
          className="text-link"
          href={LINKS.crypto + "/videos"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube <span aria-hidden="true">↗</span>
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
        <span>New research and conversations on JM Crypto.</span>
        <a
          className="text-link"
          href={LINKS.crypto + "?sub_confirmation=1"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Subscribe to the channel <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
