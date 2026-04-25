"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import NameSignature from "./NameSignature";
import CountUp from "./CountUp";

export type CreatorHeroProps = {
  kicker: ReactNode;
  name: { primary: string; secondary: string };
  portraitSrc: string;
  portraitAlt: string;
  pillLabel: string;
  stat: { num: number; suffix?: string; label: string };
  role: ReactNode;
  paragraph: ReactNode;
  ctas: ReactNode;
  meta: { label: string; value: string }[];
};

export default function CreatorHero({
  kicker,
  name,
  portraitSrc,
  portraitAlt,
  pillLabel,
  stat,
  role,
  paragraph,
  ctas,
  meta,
}: CreatorHeroProps) {
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
            src={portraitSrc}
            alt={portraitAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{ objectFit: "cover" }}
          />
        </div>
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
          {pillLabel}
        </span>
      </div>

      <div
        className="hero-copy"
        style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 1 }}
      >
        <span
          className="font-mono text-ink-mute uppercase"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          {kicker}
        </span>

        <NameSignature size="hero" text={name} />

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
            <CountUp end={stat.num} />
            {stat.suffix && <span>{stat.suffix}</span>}
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
            {stat.label}
          </span>
        </div>

        <div
          className="font-serif text-ink-mute"
          style={{ fontSize: 20, fontStyle: "italic" }}
        >
          {role}
        </div>

        <div
          className="font-serif text-ink-dim drop-cap"
          style={{ fontSize: 20, lineHeight: 1.5, maxWidth: "52ch", margin: 0 }}
        >
          {paragraph}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>{ctas}</div>

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
          {meta.map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                className="font-mono text-ink-mute uppercase"
                style={{ fontSize: 10, letterSpacing: "0.14em" }}
              >
                {m.label}
              </span>
              <span
                className="font-serif text-ink"
                style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.3 }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
