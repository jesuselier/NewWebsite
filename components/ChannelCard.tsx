import Link from "next/link";

type Props = {
  kicker: string;
  platform?: string;
  title: string;
  handle: string;
  tagline: string;
  stats: { num: string; label: string; rate: string };
  ctaHref: string;
  ctaText: string;
  goldTop?: boolean;
  external?: boolean;
};

export default function ChannelCard({
  kicker,
  platform,
  title,
  handle,
  tagline,
  stats,
  ctaHref,
  ctaText,
  goldTop = false,
  external = false,
}: Props) {
  const borderTop = goldTop
    ? { borderTop: "1px solid var(--gold)", marginTop: "-0.5px" }
    : {};
  const CTA = external ? "a" : Link;
  const ctaProps = external
    ? { href: ctaHref, target: "_blank", rel: "noopener noreferrer" as const }
    : { href: ctaHref };

  return (
    <article
      className="rule-right"
      style={{
        padding: 48,
        minHeight: 460,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        ...borderTop,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          className={`font-mono uppercase ${goldTop ? "text-gold" : "text-ink-mute"}`}
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          {kicker}
        </span>
        {platform && (
          <span
            className="font-mono text-ink-mute"
            style={{ fontSize: 11, letterSpacing: "0.08em" }}
          >
            — {platform}
          </span>
        )}
      </div>

      <h3
        className="font-serif text-ink"
        style={{
          fontSize: 44,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          margin: 0,
        }}
      >
        {title}
      </h3>

      <div
        className="font-mono text-ink-mute"
        style={{ fontSize: 12, letterSpacing: "0.08em" }}
      >
        {handle}
      </div>

      <p
        className="font-serif text-ink-dim"
        style={{
          fontSize: 20,
          fontStyle: "italic",
          lineHeight: 1.4,
          margin: 0,
          flex: 1,
        }}
      >
        {tagline}
      </p>

      <div
        className="rule-top rule-bottom"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          columnGap: 24,
          alignItems: "baseline",
          padding: "18px 0",
        }}
      >
        <span
          className={`font-serif ${goldTop ? "text-gold" : "text-ink"}`}
          style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.015em" }}
        >
          {stats.num}
        </span>
        <span
          className="font-serif text-ink-dim"
          style={{ fontSize: 15, fontStyle: "italic" }}
        >
          {stats.label}
        </span>
        <span
          className="font-mono text-ink-mute text-right"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            lineHeight: 1.4,
          }}
          dangerouslySetInnerHTML={{ __html: stats.rate.replace(/\n/g, "<br/>") }}
        />
      </div>

      <CTA
        {...ctaProps}
        className={`inline-flex items-center gap-3 hover:text-ink transition-colors ${
          goldTop ? "text-gold" : "text-ink-dim"
        }`}
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          fontWeight: 500,
          marginTop: "auto",
        }}
      >
        {ctaText}
        <span
          style={{ flex: 1, height: "0.5px", background: "var(--rule)", display: "inline-block" }}
        />
        <span className="font-serif" style={{ fontSize: 16 }}>→</span>
      </CTA>
    </article>
  );
}
