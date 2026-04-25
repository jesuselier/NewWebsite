import Image from "next/image";
import Link from "next/link";

export type PortalCreator = {
  href: string;
  name: string;
  tagline: string;
  portrait: string;
  alt: string;
  pillLabel: string;
};

type Props = { creators: [PortalCreator, PortalCreator] };

export default function PortalSplit({ creators }: Props) {
  return (
    <div className="portal-root">
      <header className="portal-header">
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            background: "var(--gold)",
            borderRadius: "50%",
            marginRight: 12,
            transform: "translateY(-3px)",
          }}
        />
        <span
          className="font-serif text-ink"
          style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, letterSpacing: "-0.015em" }}
        >
          Martinez{" "}
          <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--ink-dim)" }}>
            Access
          </span>
        </span>
        <span
          className="font-mono text-ink-mute uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            marginTop: 10,
          }}
        >
          Jesus Martinez{" "}
          <span style={{ color: "var(--gold)" }}>·</span> Jennifer Martinez
        </span>
      </header>

      <main className="portal-split">
        {creators.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="portal-tile"
            aria-label={`Enter ${c.name}'s page`}
          >
            <div className="portal-tile-img">
              <Image
                src={c.portrait}
                alt={c.alt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>

            <span
              className="font-mono uppercase portal-tile-pill"
              style={{
                position: "absolute",
                top: 20,
                left: 24,
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--ink)",
                background: "rgba(10,10,10,0.6)",
                padding: "5px 10px",
                zIndex: 3,
              }}
            >
              {c.pillLabel}
            </span>

            <div className="portal-tile-caption">
              <span
                className="font-serif text-ink"
                style={{
                  fontSize: "clamp(40px, 5.5vw, 84px)",
                  fontWeight: 400,
                  letterSpacing: "-0.025em",
                  lineHeight: 0.95,
                }}
              >
                {c.name}
              </span>
              <span
                className="font-serif text-ink-dim"
                style={{
                  fontSize: "clamp(15px, 1.4vw, 19px)",
                  fontStyle: "italic",
                  marginTop: 14,
                  letterSpacing: "-0.005em",
                }}
              >
                {c.tagline}
              </span>
              <span
                className="font-mono text-gold uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  marginTop: 28,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                Enter
                <span className="portal-tile-arrow font-serif" style={{ fontSize: 18, letterSpacing: 0 }}>
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}
      </main>

      <footer className="portal-footer">
        <span
          className="font-serif text-ink-mute"
          style={{ fontSize: 13, fontStyle: "italic" }}
        >
          © 2026 Martinez Access
        </span>
        <span className="font-mono text-ink-mute" style={{ fontSize: 11, letterSpacing: "0.3em" }}>
          · <span style={{ color: "var(--gold)" }}>·</span> ·
        </span>
      </footer>
    </div>
  );
}
