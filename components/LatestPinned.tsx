"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { YTVideo } from "@/lib/youtube";

type Props = { videos: YTVideo[] };

export default function LatestPinned({ videos }: Props) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const apply = () => setDesktop(mq.matches);
    const id = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener("change", apply);
    };
  }, []);

  if (!desktop) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {videos.map((v) => (
          <VideoTile key={v.id} v={v} />
        ))}
      </section>
    );
  }

  return (
    <section
      className="latest-strip"
      style={{
        display: "flex",
        gap: 32,
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        scrollPaddingLeft: "var(--pad, 56px)",
        paddingBottom: 18,
        marginLeft: "calc(var(--pad, 56px) * -1)",
        marginRight: "calc(var(--pad, 56px) * -1)",
        paddingLeft: "var(--pad, 56px)",
        paddingRight: "var(--pad, 56px)",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--rule-strong) transparent",
      }}
    >
      {videos.map((v) => (
        <div
          key={v.id}
          style={{
            flex: "0 0 auto",
            width: "clamp(360px, 36vw, 480px)",
            scrollSnapAlign: "start",
          }}
        >
          <VideoTile v={v} />
        </div>
      ))}
    </section>
  );
}

function VideoTile({ v }: { v: YTVideo }) {
  return (
    <a
      href={v.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          border: "0.5px solid var(--rule)",
          overflow: "hidden",
        }}
      >
        <Image
          src={v.thumbSrc}
          alt={v.title}
          fill
          sizes="(max-width: 900px) 100vw, 40vw"
          style={{ objectFit: "cover" }}
          unoptimized
        />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span
          className={`font-mono uppercase ${v.gold ? "text-gold" : "text-ink-mute"}`}
          style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em" }}
        >
          {v.channel}
        </span>
        <span
          className="font-mono text-ink-mute"
          style={{ fontSize: 10, letterSpacing: "0.08em" }}
        >
          {v.publishedLabel}
        </span>
      </div>
      <h4
        className="font-serif text-ink"
        style={{
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {v.title}
      </h4>
    </a>
  );
}
