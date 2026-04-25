type Props = {
  size?: "hero" | "inline";
  className?: string;
};

export default function NameSignature({ size = "hero", className = "" }: Props) {
  if (size === "inline") {
    return (
      <span
        className={`font-serif text-ink ${className}`}
        style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        Martinez <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--ink-dim)" }}>Access</span>
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
      Martinez
      <br />
      <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--ink-dim)" }}>
        Access
      </span>
    </h1>
  );
}
