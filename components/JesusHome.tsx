import Image from "next/image";
import Link from "next/link";
import { getFullLatest } from "@/lib/youtube";
import { LINKS } from "@/lib/site";
import VideoCard from "./VideoCard";
import { Channels, TierListFeature, ContactStrip } from "./SiteSections";
export default async function JesusHome() {
  const videos = await getFullLatest(3, ["jm_crypto"]);
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> JESUS MARTINEZ · CREATOR &
            RESEARCHER
          </span>
          <h1>
            Crypto.
            <br />
            <span>With context.</span>
          </h1>
          <p>
            I follow the stories moving crypto, the people building it, and the
            ideas worth a closer look. Welcome to my corner of the internet.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={LINKS.crypto}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="play-icon" aria-hidden="true">
                ▶
              </span>{" "}
              Watch JM Crypto <span aria-hidden="true">↗</span>
            </a>
            <Link href="/about" className="text-link">
              Meet Jesus <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="hero-topics">
            <span>CRYPTO</span>
            <span>AI</span>
            <span>THE ATTENTION ECONOMY</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="portrait-orbit" aria-hidden="true" />
          <span className="portrait-coordinate" aria-hidden="true">
            MIAMI, FL / EST. 2021
          </span>
          <Image
            src="/Happy.webp"
            alt="Jesus Martinez, creator of JM Crypto and The Attention Cycle"
            fill
            sizes="(max-width: 760px) 100vw, 52vw"
            preload
            className="hero-portrait"
          />
          <div className="portrait-caption">
            <span>
              Always asking
              <br />
              the next question.
            </span>
            <span className="portrait-cross" aria-hidden="true">
              +
            </span>
          </div>
        </div>
      </section>
      <section id="videos" className="section container video-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">From the channel</span>
            <h2>The conversation continues.</h2>
          </div>
          <Link className="text-link" href="/latest">
            All videos <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="video-grid">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              channel={v.channel}
              date={v.publishedLabel}
              duration={v.duration}
              title={v.title}
              href={v.watchUrl}
              thumbSrc={v.thumbSrc}
            />
          ))}
        </div>
      </section>
      <Channels />
      <TierListFeature />
      <ContactStrip />
    </>
  );
}
