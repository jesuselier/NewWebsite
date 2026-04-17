import Image from "next/image";
import NameSignature from "./NameSignature";
import CTAButton from "./CTAButton";

export default function Hero() {
  return (
    <section
      className="hero"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.15fr",
        gap: 80,
        alignItems: "start",
        padding: "72px 0 120px",
      }}
    >
      {/* Portrait */}
      <div
        className="diag-stripes"
        style={{
          position: "relative",
          aspectRatio: "3 / 4",
          border: "0.5px solid var(--rule)",
          overflow: "hidden",
        }}
      >
        <Image
          src="/Happy.webp"
          alt="Jesus Martinez"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 45vw"
          style={{ objectFit: "cover" }}
        />
        {/* Corner label */}
        <span
          className="font-mono uppercase"
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            fontSize: 10,
            letterSpacing: "0.16em",
            color: "var(--ink)",
            background: "rgba(10,10,10,0.55)",
            padding: "4px 8px",
            zIndex: 2,
          }}
        >
          JM · 2026
        </span>
        {/* Crosshair overlay */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            color: "var(--ink-mute)",
            opacity: 0.25,
            pointerEvents: "none",
            zIndex: 2,
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        >
          <circle cx="18" cy="18" r="10" />
          <line x1="18" y1="4" x2="18" y2="32" />
          <line x1="4" y1="18" x2="32" y2="18" />
        </svg>
      </div>

      {/* Copy */}
      <div className="hero-copy" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <span
          className="font-mono text-ink-mute uppercase"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          The creator <span style={{ color: "var(--gold)" }}>·</span> Est. 2021 <span style={{ color: "var(--gold)" }}>·</span> Miami
        </span>

        <NameSignature size="hero" />

        <div
          className="font-serif text-ink-mute"
          style={{ fontSize: 20, fontStyle: "italic" }}
        >
          Creator <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>
          Host <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>
          Analyst
        </div>

        <p
          className="font-serif text-ink-dim drop-cap"
          style={{ fontSize: 20, lineHeight: 1.5, maxWidth: "52ch", margin: 0 }}
        >
          JM Crypto began as a response to noise — a source of clear signal in a sea of
          misinformation. In 2021, my brother lost his life savings and I helped him
          recover through cryptocurrency. I&apos;ve been full-time in the space ever since,
          covering the news, the macro, and the AI reshaping both.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <CTAButton variant="primary" href="https://youtube.com/@jm_crypto" external>
            Watch JM Crypto
          </CTAButton>
          <CTAButton variant="ghost" href="https://www.youtube.com/@JesusMartinezCrypto" arrow="→" external>
            Listen to the podcast
          </CTAButton>
        </div>

        <div
          className="rule-top hero-meta"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            paddingTop: 20,
            marginTop: 12,
          }}
        >
          <HeroMeta label="Combined reach" value="385K across platforms" />
          <HeroMeta label="Format" value="Just crypto, every day" />
          <HeroMeta label="Since" value="2021" />
        </div>
      </div>
    </section>
  );
}

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em" }}
      >
        {label}
      </span>
      <span
        className="font-serif text-ink"
        style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.3 }}
      >
        {value}
      </span>
    </div>
  );
}
