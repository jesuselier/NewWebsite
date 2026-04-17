type Props = {
  num: string;
  title: string;
  id?: string;
};

export default function SectionHead({ num, title, id }: Props) {
  return (
    <header
      id={id}
      style={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr max-content",
        alignItems: "center",
        gap: 20,
        padding: "120px 0 48px",
      }}
    >
      <span
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
      >
        {num}
      </span>
      <span
        style={{ height: "0.5px", background: "var(--rule)", display: "block" }}
      />
      <span
        className="font-serif text-ink"
        style={{ fontSize: 20, fontStyle: "italic", fontWeight: 400 }}
      >
        {title}
      </span>
    </header>
  );
}
