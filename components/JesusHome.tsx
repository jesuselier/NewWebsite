import Image from "next/image";
import Link from "next/link";
import { getFullLatest } from "@/lib/youtube";
import { LINKS } from "@/lib/site";
import Audience from "./Audience";
import VideoCard from "./VideoCard";
import { StoryFeature, TierListFeature, ContactStrip } from "./SiteSections";
export default async function JesusHome() {
  const videos = await getFullLatest(3);
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <p className="hero-intro">Hey, I’m Jesus Martinez.</p>
          <h1>
            Crypto changed
            <br />
            my life.
          </h1>
          <p className="hero-description">
            What started as a way to help my brother became JM Crypto. Now I
            share the research, conversations, and lessons I pick up along the
            way.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={LINKS.crypto + "?sub_confirmation=1"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">▶</span> Join me on YouTube
            </a>
            <Link href="/about" className="text-link">
              Read my story
            </Link>
          </div>
          <Audience />
        </div>
        <div className="hero-visual">
          <Image
            src="/media/jesus-martinez-studio.jpg"
            alt="Jesus Martinez smiling in the JM Crypto studio"
            fill
            sizes="(max-width: 760px) 92vw, 46vw"
            preload
            className="hero-portrait"
          />
          <span className="portrait-caption">
            Miami, Florida. Building JM Crypto.
          </span>
        </div>
      </section>
      <section id="videos" className="section container video-section">
        <div className="section-heading">
          <div>
            <h2>From the channel</h2>
            <p>Full conversations. Deeper research. A little more context.</p>
          </div>
          <Link className="text-link" href="/latest">
            Browse all videos <span aria-hidden="true">↗</span>
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
      <StoryFeature />
      <TierListFeature />
      <ContactStrip />
    </>
  );
}
