import type { ReactNode } from "react";

type Props = {
  name: string;
  handle: string;
  tag: string;
  icon?: ReactNode;
  featured?: boolean;
  featuredTag?: string;
  href: string;
};

export default function SocialTile({
  name,
  handle,
  tag,
  icon,
  featured = false,
  featuredTag,
  href,
}: Props) {
  const base: React.CSSProperties = {
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderRight: "0.5px solid var(--rule)",
  };
  const featuredStyle: React.CSSProperties = featured
    ? {
        border: "0.5px solid var(--gold)",
        margin: "-0.5px",
        background: "var(--gold-soft)",
      }
    : {};

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-colors hover:bg-white/[.02]"
      style={{ ...base, ...featuredStyle }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span
          className="font-serif text-ink"
          style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          {name}
        </span>
        {icon && <span style={{ color: "var(--ink-mute)" }}>{icon}</span>}
      </div>
      <span
        className="font-mono text-ink-mute"
        style={{ fontSize: 12, letterSpacing: "0.05em" }}
      >
        {handle}
      </span>
      <span
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em" }}
      >
        {tag}
      </span>
      {featured && featuredTag && (
        <span
          className="font-mono text-gold uppercase"
          style={{ fontSize: 9, letterSpacing: "0.16em", marginTop: 8 }}
        >
          {featuredTag}
        </span>
      )}
    </a>
  );
}
