type Props = {
  num: string;
  label: string;
  rate?: string;
  numGold?: boolean;
};

export default function StatBlock({ num, label, rate, numGold = false }: Props) {
  return (
    <div
      className="rule-top rule-bottom"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        columnGap: 24,
        alignItems: "baseline",
        padding: "18px 0",
      }}
    >
      <span
        className={`font-serif ${numGold ? "text-gold" : "text-ink"}`}
        style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.015em" }}
      >
        {num}
      </span>
      <span
        className="font-serif text-ink-dim"
        style={{ fontSize: 16, fontStyle: "italic" }}
      >
        {label}
      </span>
      {rate && (
        <span
          className="font-mono text-ink-mute text-right"
          style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.4 }}
          dangerouslySetInnerHTML={{ __html: rate.replace(/\n/g, "<br/>") }}
        />
      )}
    </div>
  );
}
