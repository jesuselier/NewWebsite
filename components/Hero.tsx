"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import NameSignature from "./NameSignature";
import CTAButton from "./CTAButton";
import CountUp from "./CountUp";

type Portrait = {
  src: string;
  alt: string;
  caption: string;
  sub: string;
  pill: string;
  priority?: boolean;
};

const PORTRAITS: Portrait[] = [
  {
    src: "/Happy.webp",
    alt: "Jesus Martinez",
    caption: "Jesus Martinez",
    sub: "Crypto markets · industry analysis",
    pill: "JESUS · 2026",
    priority: true,
  },
  {
    src: "/sheesh.jpg",
    alt: "Jennifer Martinez",
    caption: "Jennifer Martinez",
    sub: "Crypto + AI · explained simply",
    pill: "JENNIFER · 2026",
  },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const portraitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    const id = requestAnimationFrame(() => setInteractive(!reduce && !touch));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const section = sectionRef.current;
    const vignette = vignetteRef.current;
    if (!section || !vignette) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sRect = section.getBoundingClientRect();
        vignette.style.setProperty("--mx", `${e.clientX - sRect.left}px`);
        vignette.style.setProperty("--my", `${e.clientY - sRect.top}px`);
        vignette.style.opacity = "1";

        for (const portrait of portraitRefs.current) {
          if (!portrait) continue;
          const pRect = portrait.getBoundingClientRect();
          const nx = (e.clientX - (pRect.left + pRect.width / 2)) / (pRect.width / 2);
          const ny = (e.clientY - (pRect.top + pRect.height / 2)) / (pRect.height / 2);
          const clamp = (v: number) => Math.max(-1, Math.min(1, v));
          const rotY = clamp(nx) * 6;
          const rotX = -clamp(ny) * 6;
          portrait.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        }
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      for (const portrait of portraitRefs.current) {
        if (!portrait) continue;
        portrait.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      }
      vignette.style.opacity = "0";
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, [interactive]);

  return (
    <section
      ref={sectionRef}
      className="hero"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1.4fr",
        gap: 72,
        alignItems: "start",
        padding: "72px 0 120px",
      }}
    >
      {/* Cursor-reactive warm vignette */}
      <div
        ref={vignetteRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle 480px at var(--mx, 50%) var(--my, 50%), rgba(239,159,39,0.045), transparent 60%)",
          opacity: 0,
          transition: "opacity 500ms ease-out",
          zIndex: 0,
        }}
      />

      {/* Copy column */}
      <div
        className="hero-copy"
        style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 1 }}
      >
        <span
          className="font-mono text-ink-mute uppercase"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          The brand <span style={{ color: "var(--gold)" }}>·</span> Est. 2026 <span style={{ color: "var(--gold)" }}>·</span> Miami
        </span>

        <NameSignature size="hero" />

        <div
          className="font-serif text-ink"
          style={{
            fontSize: "clamp(36px, 4.5vw, 64px)",
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "0.2em",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "baseline" }}>
            <CountUp end={385} />
            <span>K</span>
          </span>
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              color: "var(--ink-dim)",
              fontSize: "0.55em",
              letterSpacing: "-0.01em",
            }}
          >
            combined reach
          </span>
        </div>

        <p
          className="font-serif text-ink-dim drop-cap"
          style={{ fontSize: 20, lineHeight: 1.5, maxWidth: "52ch", margin: 0 }}
        >
          Crypto, AI, and the future of money — explained by Jesus Martinez and
          Jennifer Martinez. Two perspectives, one mission: make complex ideas
          clear, actionable, and ahead of the curve.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <CTAButton variant="primary" href="https://youtube.com/@jm_crypto" external>
            Watch Jesus Martinez
          </CTAButton>
          <CTAButton variant="primary" href="https://youtube.com/@JenniferMartinezCrypto" external>
            Watch Jennifer Martinez
          </CTAButton>
          <CTAButton variant="ghost" href="#creators" arrow="→">
            Read bios
          </CTAButton>
        </div>

        <div
          className="rule-top hero-meta"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
            paddingTop: 20,
            marginTop: 12,
          }}
        >
          <HeroMeta label="Reach" value="385K combined" />
          <HeroMeta label="Since" value="2021" />
        </div>
      </div>

      {/* Portrait column — two side-by-side, each tilts independently */}
      <div
        className="hero-portraits"
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {PORTRAITS.map((p, i) => (
          <div key={p.alt} style={{ position: "relative" }}>
            <div
              ref={(el) => {
                portraitRefs.current[i] = el;
              }}
              className="diag-stripes"
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                border: "0.5px solid var(--rule)",
                overflow: "hidden",
                transformStyle: "preserve-3d",
                transition: "transform 220ms ease-out",
                willChange: "transform",
              }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                priority={p.priority}
                sizes="(max-width: 900px) 100vw, 28vw"
                style={{ objectFit: "cover" }}
              />
              {/* Caption overlay at the bottom */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "16px 14px 14px",
                  background:
                    "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 60%, transparent 100%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 2,
                }}
              >
                <span
                  className="font-serif text-ink"
                  style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}
                >
                  {p.caption}
                </span>
                <span
                  className="font-mono text-ink-mute uppercase"
                  style={{ fontSize: 9, letterSpacing: "0.16em" }}
                >
                  {p.sub}
                </span>
              </div>
            </div>
            <span
              className="font-mono uppercase"
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--ink)",
                background: "rgba(10,10,10,0.55)",
                padding: "4px 8px",
                zIndex: 3,
              }}
            >
              {p.pill}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        className="font-mono text-ink-mute uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em" }}
      >
        {label}
      </span>
      <span
        className="font-serif text-ink"
        style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.3 }}
      >
        {value}
      </span>
    </div>
  );
}
