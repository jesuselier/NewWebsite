import type { ReactNode } from "react";

type Props = {
  tone?: "mute" | "gold";
  children: ReactNode;
  className?: string;
};

export default function SmallCapsLabel({ tone = "mute", children, className = "" }: Props) {
  const color = tone === "gold" ? "text-gold" : "text-ink-mute";
  return (
    <span
      className={`font-mono uppercase ${color} ${className}`}
      style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
    >
      {children}
    </span>
  );
}
