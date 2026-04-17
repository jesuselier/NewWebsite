"use client";

import { useState } from "react";

export default function PressCard() {
  const email = "jmcryptobusiness@gmail.com";
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <div
      className="rule-strong-all"
      style={{
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        minHeight: 220,
        justifyContent: "space-between",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3
          className="font-serif text-ink"
          style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.015em", margin: 0 }}
        >
          Business inquiries
        </h3>
        <p
          className="font-serif text-ink-mute"
          style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}
        >
          Sponsorships, interview bookings, syndication and editorial partnerships.
        </p>
      </div>
      <div
        className="rule-top"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0 0",
          gap: 16,
        }}
      >
        <button
          type="button"
          onClick={onCopy}
          className="font-mono text-gold hover:text-ink transition-colors"
          style={{ fontSize: 15, letterSpacing: "0.02em", textAlign: "left" }}
          aria-label={`Copy email ${email}`}
        >
          {email}
        </button>
        <span
          className="font-mono text-ink-mute uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          aria-live="polite"
        >
          {copied ? (
            "Copied ✓"
          ) : (
            <>
              <span
                aria-hidden
                className="font-serif"
                style={{ color: "var(--gold)", fontSize: 16, letterSpacing: 0 }}
              >
                ←
              </span>
              Click to copy
            </>
          )}
        </span>
      </div>
    </div>
  );
}
