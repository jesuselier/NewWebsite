type Detail = { label: string; value: string };

type Props = {
  logo: string;
  logoEm: string;
  pill: string;
  desc: string;
  details: Detail[];
  ctaHref: string;
  ctaText: string;
};

export default function PartnerCard({
  logo,
  logoEm,
  pill,
  desc,
  details,
  ctaHref,
  ctaText,
}: Props) {
  return (
    <article
      className="rule-right"
      style={{
        padding: 44,
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div
          className="font-serif text-ink"
          style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          {logo}
          <em
            className="text-ink-mute"
            style={{ fontStyle: "italic", fontWeight: 300, fontSize: 22, marginLeft: 8 }}
          >
            / {logoEm}
          </em>
        </div>
        <span
          className="font-mono text-gold uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            padding: "5px 10px",
            border: "0.5px solid var(--gold)",
          }}
        >
          {pill}
        </span>
      </div>

      <p
        className="font-serif text-ink-dim"
        style={{ fontSize: 19, lineHeight: 1.45, margin: 0, maxWidth: "38ch", flex: 1 }}
      >
        {desc}
      </p>

      <div
        className="rule-top rule-bottom"
        style={{
          display: "flex",
          gap: 32,
          padding: "16px 0",
          flexWrap: "wrap",
        }}
      >
        {details.map((d) => (
          <div key={d.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              className="font-mono text-ink-mute uppercase"
              style={{ fontSize: 10, letterSpacing: "0.14em" }}
            >
              {d.label}
            </span>
            <b
              className="font-serif text-ink"
              style={{ fontSize: 16, fontWeight: 400 }}
            >
              {d.value}
            </b>
          </div>
        ))}
      </div>

      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-gold hover:text-ink transition-colors"
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          fontWeight: 500,
          marginTop: "auto",
        }}
      >
        {ctaText}
        <span className="font-serif" style={{ fontSize: 16 }}>→</span>
      </a>
    </article>
  );
}
