import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LINKS } from "@/lib/site";
import type { YTVideo } from "@/lib/youtube";
import styles from "./home.module.css";

export default function LatestUploads({ videos }: { videos: YTVideo[] }) {
  return (
    <section
      id="videos"
      className={styles.section}
      aria-labelledby="latest-title"
    >
      <div className="container">
        <header className={styles.sectionHead} data-reveal>
          <div>
            <p className={styles.kicker}>Latest from JM Crypto</p>
            <h2 id="latest-title" className={styles.h2}>
              Fresh from the channel.
            </h2>
          </div>
          <div className={styles.headActions}>
            <Link className={styles.arrowLink} href="/latest">
              Browse all videos <span aria-hidden="true">→</span>
            </Link>
            <a
              className={styles.outlineButton}
              href={LINKS.crypto + "?sub_confirmation=1"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>
        <ol className={styles.latestGrid}>
          {videos.map((video, i) => (
            <li
              key={video.id}
              className={styles.tile}
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as CSSProperties}
            >
              <div className={styles.thumb}>
                {video.thumbSrc && (
                  <Image
                    src={video.thumbSrc}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 40vw, (max-width: 1100px) 45vw, 280px"
                  />
                )}
                {video.duration && (
                  <span className={styles.duration}>{video.duration}</span>
                )}
              </div>
              <div className={styles.tileBody}>
                <p className={styles.tileMeta}>
                  <time dateTime={video.published}>{video.publishedLabel}</time>
                </p>
                <h3 className={styles.tileTitle}>
                  <a
                    className={styles.cardLink}
                    href={video.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.title}
                    <span className={styles.srOnly}> (opens on YouTube)</span>
                  </a>
                </h3>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
