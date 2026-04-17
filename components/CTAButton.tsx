import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  variant?: "primary" | "ghost";
  href: string;
  children: ReactNode;
  arrow?: "→" | "↓" | null;
  className?: string;
  external?: boolean;
};

export default function CTAButton({
  variant = "primary",
  href,
  children,
  arrow = "→",
  className = "",
  external = false,
}: Props) {
  const base =
    "cta-btn inline-flex items-center gap-[10px] transition-colors duration-150";
  const style: React.CSSProperties = {
    padding: "15px 22px",
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.005em",
    border: "0.5px solid transparent",
  };
  let variantClass = "";
  if (variant === "primary") {
    style.background = "var(--gold)";
    style.color = "#0A0A0A";
    variantClass = "hover:!bg-white";
  } else {
    style.background = "transparent";
    style.color = "var(--ink)";
    style.borderColor = "var(--rule-strong)";
    variantClass = "hover:!border-[var(--ink)]";
  }

  const inner = (
    <>
      {children}
      {arrow && (
        <span
          className="cta-arrow font-serif"
          style={{
            fontSize: 16,
            display: "inline-block",
            transition: "transform 180ms ease-out",
            willChange: "transform",
          }}
        >
          {arrow}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${variantClass} ${className}`}
        style={style}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={`${base} ${variantClass} ${className}`} style={style}>
      {inner}
    </Link>
  );
}
