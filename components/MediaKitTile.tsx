const MEDIA_KIT_URL =
  "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK";

export default function MediaKitTile() {
  return (
    <a
      href={MEDIA_KIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-colors hover:bg-white/[.02]"
      style={{
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderRight: "0.5px solid var(--rule)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span
          className="font-serif text-ink"
          style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          Media kit
        </span>
        <span style={{ color: "var(--ink-mute)" }} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4v12" />
            <path d="M6 11l6 6 6-6" />
            <path d="M5 20h14" />
          </svg>
        </span>
      </div>
      <span
        className="font-mono text-ink-mute"
        style={{ fontSize: 12, letterSpacing: "0.05em" }}
      >
        Press, photos, brand assets
      </span>
      <span
        className="font-mono text-gold uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em" }}
      >
        Open Drive ↗
      </span>
    </a>
  );
}
