"use client";

import Image from "next/image";
import { useState } from "react";
import { SWARM_INTRO } from "@/lib/swarm";
import styles from "./swarm.module.css";

// Click to load: no YouTube request until the visitor presses play, then the
// privacy-enhanced embed starts playing in place.
export default function IntroVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={styles.video}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${SWARM_INTRO.id}?autoplay=1&rel=0&modestbranding=1`}
          title={SWARM_INTRO.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.video} ${styles.videoPoster}`}
      onClick={() => setPlaying(true)}
      aria-label={`Play the Swarm intro, ${SWARM_INTRO.durationLabel}`}
    >
      <Image
        src={`https://i.ytimg.com/vi/${SWARM_INTRO.id}/maxresdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 900px) calc(100vw - 32px), 760px"
      />
      <span className={styles.videoPlay} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
        </svg>
      </span>
      <span className={styles.videoMeta}>
        <span>Welcome to Swarm</span>
        <span>{SWARM_INTRO.duration}</span>
      </span>
    </button>
  );
}
