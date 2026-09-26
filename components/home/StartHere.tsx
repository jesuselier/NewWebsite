import Image from "next/image";
import type { CSSProperties } from "react";
import {
  START_HERE,
  formatPublished,
  thumbnailUrl,
  totalMinutes,
  watchUrl,
  type StartHereVideo,
} from "@/lib/start-here";
import styles from "./home.module.css";

function StartCard({
  video,
  index,
  featured = false,
}: {
  video: StartHereVideo;
  index: number;
  featured?: boolean;
}) {
  return (
    <article
      className={`${styles.card} ${featured ? styles.featuredCard : styles.compactCard}`}
      data-reveal
      style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
    >
      <div className={styles.thumb}>
        <Image
          src={thumbnailUrl(video.id)}
          alt=""
          fill
          sizes={
            featured
              ? "(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 56vw, 680px"
              : "(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 36vw, 220px"
          }
        />
        <span className={styles.duration}>{video.duration}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardMeta}>
          <span className={styles.cardIndex}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.cardKind}>{video.kind}</span>
          <time dateTime={video.published}>
            {formatPublished(video.published)}
          </time>
        </p>
        <h3 className={styles.cardTitle}>
          <a
            className={styles.cardLink}
            href={watchUrl(video.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {video.title}
            <span className={styles.srOnly}> (opens on YouTube)</span>
          </a>
        </h3>
        <p className={styles.why}>{video.why}</p>
        <span className={styles.watchCue} aria-hidden="true">
          Watch on YouTube <span>↗</span>
        </span>
      </div>
    </article>
  );
}

export default function StartHere() {
  const [first, ...rest] = START_HERE.videos;
  return (
    <section
      id="start-here"
      className={styles.section}
      aria-labelledby="start-here-title"
    >
      <div className="container">
        <header className={styles.sectionHead} data-reveal>
          <div>
            <p className={styles.kicker}>Start here</p>
            <h2 id="start-here-title" className={styles.h2}>
              Three videos to start with.
            </h2>
          </div>
          <p className={styles.lede}>
            One shows how I think, one how I research, and one how I interview.{" "}
            {totalMinutes(START_HERE.videos)} minutes in all, best watched in
            this order.
          </p>
        </header>
        <div className={styles.startGrid}>
          <StartCard video={first} index={0} featured />
          <div className={styles.startList}>
            {rest.map((video, i) => (
              <StartCard key={video.id} video={video} index={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
