export default function Footer() {
  return (
    <footer
      className="rule-top footer-grid"
      style={{
        marginTop: 120,
        padding: "32px 0 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 40,
      }}
    >
      <span
        className="font-serif text-ink-mute"
        style={{ fontSize: 14, fontStyle: "italic" }}
      >
        © 2026 Martinez Access. All rights reserved.
      </span>
      <span className="font-mono text-ink-mute" style={{ fontSize: 12, letterSpacing: "0.3em" }}>
        · <span style={{ color: "var(--gold)" }}>·</span> ·
      </span>
    </footer>
  );
}
