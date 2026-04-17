import CTAButton from "./CTAButton";

export default function MediaKitCard() {
  return (
    <div
      className="rule-strong-all"
      style={{
        padding: "36px 40px",
        background: "var(--bg-elev)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minHeight: 220,
      }}
    >
      <div
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em", display: "flex", gap: 10 }}
      >
        <span>PDF</span>
        <span style={{ color: "var(--gold)" }}>·</span>
        <span>4.2 MB</span>
        <span style={{ color: "var(--gold)" }}>·</span>
        <span>Updated Apr 2026</span>
      </div>
      <h3
        className="font-serif text-ink"
        style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.015em", margin: 0 }}
      >
        Media kit
      </h3>
      <p
        className="font-serif text-ink-mute"
        style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.5, margin: 0, flex: 1 }}
      >
        Brand guidelines, audience data, demographics, rate card, past partnerships and logo suite.
      </p>
      <div>
        <CTAButton
          variant="ghost"
          href="https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK"
          arrow="↓"
          external
        >
          Download media kit
        </CTAButton>
      </div>
    </div>
  );
}
