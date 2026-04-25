import Link from "next/link";

const MEDIA_KIT_URL =
  "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK";

const SIBLINGS = {
  jesus: { href: "/jennifer", label: "Jennifer Martinez", arrow: "→" },
  jennifer: { href: "/jesus", label: "Jesus Martinez", arrow: "←" },
} as const;

type Props = {
  current: keyof typeof SIBLINGS;
};

export default function PersonalNavbar({ current }: Props) {
  const sibling = SIBLINGS[current];
  return (
    <nav
      className="rule-bottom"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 0",
        gap: 32,
      }}
    >
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            background: "var(--gold)",
            borderRadius: "50%",
          }}
        />
        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span
            className="font-serif text-ink"
            style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            Martinez{" "}
            <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--ink-dim)" }}>
              Access
            </span>
          </span>
          <span
            className="font-mono text-ink-mute uppercase"
            style={{ fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}
          >
            {current === "jesus" ? "Jesus Martinez" : "Jennifer Martinez"}
          </span>
        </span>
      </Link>

      <Link
        href={sibling.href}
        className="nav-links font-mono uppercase hover:text-ink transition-colors"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--ink-dim)",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {current === "jennifer" && (
          <span className="font-serif text-gold" style={{ fontSize: 14 }}>
            {sibling.arrow}
          </span>
        )}
        <span style={{ letterSpacing: "0.16em" }}>{sibling.label}</span>
        {current === "jesus" && (
          <span className="font-serif text-gold" style={{ fontSize: 14 }}>
            {sibling.arrow}
          </span>
        )}
      </Link>

      <a
        href={MEDIA_KIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono uppercase hover:text-gold transition-colors"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          padding: "9px 14px",
          border: "0.5px solid var(--rule-strong)",
          color: "var(--ink-dim)",
        }}
      >
        Media kit
      </a>
    </nav>
  );
}
