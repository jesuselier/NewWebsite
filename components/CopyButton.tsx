"use client";

import { useState } from "react";

type Props = {
  value: string;
  label?: string;
  copiedLabel?: string;
};

export default function CopyButton({
  value,
  label = "Copy →",
  copiedLabel = "Copied ✓",
}: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-gold hover:text-ink transition-colors"
      style={{ fontSize: 13, letterSpacing: "0.08em" }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
