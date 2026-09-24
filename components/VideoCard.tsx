import Image from "next/image";
type Props = {
  channel: string;
  channelGold?: boolean;
  date: string;
  duration?: string;
  title: string;
  href: string;
  thumbSrc?: string;
};
export default function VideoCard({
  channel,
  date,
  duration,
  title,
  href,
  thumbSrc,
}: Props) {
  return (
    <article className="video-card">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch ${title} on YouTube`}
      >
        <div className="video-image">
          {thumbSrc && (
            <Image
              src={thumbSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 960px) 46vw, 380px"
            />
          )}
          <span className="video-play" aria-hidden="true">
            ▶
          </span>
          {duration && <span className="video-duration">{duration}</span>}
        </div>
        <div className="video-meta">
          <span>{channel}</span>
          <span>{date}</span>
        </div>
        <h3>{title}</h3>
      </a>
    </article>
  );
}
