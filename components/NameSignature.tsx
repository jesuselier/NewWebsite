type Props = {
  size?: "hero" | "inline";
  className?: string;
  text?: { primary: string; secondary: string };
};

const DEFAULT_TEXT = { primary: "Martinez", secondary: "Access" };

export default function NameSignature({
  size = "hero",
  className = "",
  text = DEFAULT_TEXT,
}: Props) {
  if (size === "inline") {
    return (
      <span
        className={`font-serif text-ink ${className}`}
        style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        {text.primary}{" "}
        <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--ink-dim)" }}>
          {text.secondary}
        </span>
      </span>
    );
  }
  return (
    <h1
      className={`font-serif text-ink ${className}`}
      style={{
        fontSize: "clamp(56px, 7vw, 112px)",
        fontWeight: 400,
        lineHeight: 0.94,
        letterSpacing: "-0.025em",
        margin: 0,
      }}
    >
      {text.primary}
      <br />
      <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--ink-dim)" }}>
        {text.secondary}
      </span>
    </h1>
  );
}
