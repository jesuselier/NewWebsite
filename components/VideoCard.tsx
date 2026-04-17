import Image from "next/image";

type Props = {
  channel: string;
  channelGold?: boolean;
  date: string;
  duration?: string;
  title: string;
  href?: string;
  thumbSrc?: string;
};

export default function VideoCard({
  channel,
  channelGold = false,
  date,
  duration,
  title,
  href = "#",
  thumbSrc,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div
        className={thumbSrc ? undefined : "diag-stripes-thumb"}
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          border: "0.5px solid var(--rule)",
          overflow: "hidden",
        }}
      >
        {thumbSrc ? (
          <Image
            src={thumbSrc}
            alt={title}
            fill
            sizes="(max-width: 900px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <svg
            width="42"
            height="42"
            viewBox="0 0 42 42"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              color: "var(--ink-mute)",
              opacity: 0.5,
            }}
          >
            <circle cx="21" cy="21" r="14" />
            <polygon points="18,15 28,21 18,27" fill="currentColor" stroke="none" />
          </svg>
        )}
        {duration && (
          <span
            className="font-mono"
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              fontSize: 10,
              padding: "4px 7px",
              background: "rgba(10,10,10,0.8)",
              color: "var(--ink)",
              letterSpacing: "0.05em",
              zIndex: 2,
            }}
          >
            {duration}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span
          className={`font-mono uppercase ${channelGold ? "text-gold" : "text-ink-mute"}`}
          style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          {channel}
        </span>
        <span
          className="font-mono text-ink-mute"
          style={{ fontSize: 10, letterSpacing: "0.08em" }}
        >
          {date}
        </span>
      </div>

      <h4
        className="font-serif text-ink"
        style={{
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </h4>
    </a>
  );
}
