"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import NameSignature from "./NameSignature";
import CTAButton from "./CTAButton";
import CountUp from "./CountUp";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const portraitRef = useRef<HTMLDivElement | null>(null);
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
    const portrait = portraitRef.current;
    const vignette = vignetteRef.current;
    if (!section || !portrait || !vignette) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sRect = section.getBoundingClientRect();
        vignette.style.setProperty("--mx", `${e.clientX - sRect.left}px`);
        vignette.style.setProperty("--my", `${e.clientY - sRect.top}px`);
        vignette.style.opacity = "1";

        const pRect = portrait.getBoundingClientRect();
        const nx = (e.clientX - (pRect.left + pRect.width / 2)) / (pRect.width / 2);
        const ny = (e.clientY - (pRect.top + pRect.height / 2)) / (pRect.height / 2);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        const rotY = clamp(nx) * 6;
        const rotX = -clamp(ny) * 6;
        portrait.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      portrait.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
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
        gridTemplateColumns: "1fr 1.15fr",
        gap: 80,
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
            "radial-gradient(circle 420px at var(--mx, 50%) var(--my, 50%), rgba(239,159,39,0.045), transparent 60%)",
          opacity: 0,
          transition: "opacity 500ms ease-out",
          zIndex: 0,
        }}
      />

      {/* Portrait column (tilt wrapper + fixed-position label) */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          ref={portraitRef}
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
            src="/Happy.webp"
            alt="Jesus Martinez"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{ objectFit: "cover" }}
          />
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              color: "var(--ink-mute)",
              opacity: 0.25,
              pointerEvents: "none",
              zIndex: 2,
            }}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          >
            <circle cx="18" cy="18" r="10" />
            <line x1="18" y1="4" x2="18" y2="32" />
            <line x1="4" y1="18" x2="32" y2="18" />
          </svg>
        </div>
        {/* Corner label — sibling of tilted frame so it stays put */}
        <span
          className="font-mono uppercase"
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            fontSize: 10,
            letterSpacing: "0.16em",
            color: "var(--ink)",
            background: "rgba(10,10,10,0.55)",
            padding: "4px 8px",
            zIndex: 3,
          }}
        >
          JM · 2026
        </span>
      </div>

      {/* Copy */}
      <div
        className="hero-copy"
        style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 1 }}
      >
        <span
          className="font-mono text-ink-mute uppercase"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          The creator <span style={{ color: "var(--gold)" }}>·</span> Est. 2021 <span style={{ color: "var(--gold)" }}>·</span> Miami
        </span>

        <NameSignature size="hero" />

        {/* Promoted stat — hero hook */}
        <div
          className="font-serif text-ink"
          style={{
            fontSize: "clamp(40px, 5vw, 72px)",
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
            across platforms
          </span>
        </div>

        <div
          className="font-serif text-ink-mute"
          style={{ fontSize: 20, fontStyle: "italic" }}
        >
          Creator <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>
          Host <span style={{ color: "var(--gold)", fontStyle: "normal", margin: "0 10px" }}>·</span>
          Analyst
        </div>

        <p
          className="font-serif text-ink-dim drop-cap"
          style={{ fontSize: 20, lineHeight: 1.5, maxWidth: "52ch", margin: 0 }}
        >
          JM Crypto began as a response to noise — a source of clear signal in a sea of
          misinformation. In 2021, my brother lost his life savings and I helped him
          recover through cryptocurrency. I&apos;ve been full-time in the space ever since,
          covering the news, the macro, and the AI reshaping both.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <CTAButton variant="primary" href="https://youtube.com/@jm_crypto" external>
            Watch JM Crypto
          </CTAButton>
          <CTAButton variant="ghost" href="https://www.youtube.com/@JesusMartinezCrypto" arrow="→" external>
            Listen to the podcast
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
          <HeroMeta label="Primary platform" value="X · 310K followers" />
          <HeroMeta label="Since" value="2021" />
        </div>
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
