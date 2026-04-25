"use client";

import { useState } from "react";

const EMAIL = "jmcryptobusiness@gmail.com";

export default function EmailTile() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy email ${EMAIL}`}
      className="transition-colors hover:bg-white/[.02]"
      style={{
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderRight: "0.5px solid var(--rule)",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span
          className="font-serif text-ink"
          style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          Email
        </span>
        <span style={{ color: "var(--ink-mute)" }} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </span>
      </div>
      <span
        className="font-mono text-gold"
        style={{ fontSize: 13, letterSpacing: "0.01em", whiteSpace: "nowrap" }}
      >
        {EMAIL}
      </span>
      <span
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em" }}
        aria-live="polite"
      >
        {copied ? "Copied ✓" : "Click to copy"}
      </span>
    </button>
  );
}
