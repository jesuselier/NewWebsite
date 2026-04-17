import CopyButton from "./CopyButton";

export default function PressCard() {
  const email = "jmcryptobusiness@gmail.com";
  return (
    <div
      className="rule-strong-all"
      style={{
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
        justifyContent: "space-between",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3
          className="font-serif text-ink"
          style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.015em", margin: 0 }}
        >
          Business inquiries
        </h3>
        <p
          className="font-serif text-ink-mute"
          style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}
        >
          Sponsorships, interview bookings, syndication and editorial partnerships.
        </p>
      </div>
      <div
        className="rule-top"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0 0",
        }}
      >
        <a
          href={`mailto:${email}`}
          className="font-mono text-gold hover:text-ink transition-colors"
          style={{ fontSize: 15, letterSpacing: "0.02em" }}
        >
          {email}
        </a>
        <CopyButton value={email} />
      </div>
    </div>
  );
}
