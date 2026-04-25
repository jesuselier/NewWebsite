import Link from "next/link";

const MEDIA_KIT_URL =
  "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK";

const LINKS: { href: string; label: string }[] = [
  { href: "/#channels", label: "Channels" },
  { href: "/#videos", label: "Latest" },
  { href: "/#partners", label: "Deals" },
  { href: "/#connect", label: "Connect" },
];

export default function Navbar() {
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
            Jesus Martinez{" "}
            <span style={{ color: "var(--gold)" }}>·</span> Jennifer Martinez
          </span>
        </span>
      </Link>

      <ul
        className="nav-links"
        style={{
          display: "flex",
          listStyle: "none",
          gap: 32,
          fontSize: 13,
          color: "var(--ink-dim)",
          margin: 0,
          padding: 0,
        }}
      >
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-ink transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

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
