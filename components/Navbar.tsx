import Link from "next/link";

const MEDIA_KIT_URL =
  "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK";

const LINKS: { href: string; label: string; sub?: string }[] = [
  { href: "/#channels", label: "Channels" },
  { href: "/#videos", label: "Latest" },
  { href: "/#partners", label: "Partners", sub: "Deals for you" },
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
      <Link href="/" className="flex items-center">
        <span
          className="font-serif text-ink"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              background: "var(--gold)",
              borderRadius: "50%",
              transform: "translateY(-2px)",
              marginRight: 10,
            }}
          />
          Jesus Martinez
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 14,
              color: "var(--ink-mute)",
              marginLeft: 8,
            }}
          >
            — JM Crypto
          </em>
        </span>
      </Link>

      <ul
        className="hidden md:flex"
        style={{
          listStyle: "none",
          gap: 32,
          fontSize: 13,
          color: "var(--ink-dim)",
          margin: 0,
          padding: 0,
        }}
      >
        {LINKS.map((l) => (
          <li key={l.href} style={{ lineHeight: 1 }}>
            <Link
              href={l.href}
              className="hover:text-ink transition-colors"
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <span>{l.label}</span>
              {l.sub && (
                <span
                  className="font-mono text-gold uppercase"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    fontWeight: 500,
                    marginTop: -2,
                  }}
                >
                  {l.sub}
                </span>
              )}
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
