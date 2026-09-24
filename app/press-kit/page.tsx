import Image from "next/image";
import Audience from "@/components/Audience";
import CopyBio from "@/components/CopyBio";
import kit from "@/lib/media-kit.json";
import downloads from "@/lib/media-kit-downloads.json";
import { AUDIENCE, LINKS, pageMetadata } from "@/lib/site";
import styles from "./press-kit.module.css";

export const metadata = pageMetadata("Media Kit & Photos", "Download Jesus Martinez's photos, JM Crypto channel artwork, bios, and one-page media kit for interviews, events, and editorial coverage.", "/press-kit");

export default function PressKitPage() {
  return (
    <div className="container page-body">
      <header className={`page-heading ${styles.heading}`}>
        <span className="section-label">Jesus Martinez / JM Crypto</span>
        <h1>For your next feature.</h1>
        <p>Photos, bios, and channel details. Everything you need to introduce Jesus or feature JM Crypto.</p>
        <div className={styles.actions}>
          <a className="button button-primary" href="/media-kit/Jesus-Martinez-Media-Kit.zip" download>Download everything <span aria-hidden="true">↓</span></a>
          <a className="text-link" href="/media-kit/Jesus-Martinez-Media-Kit.pdf" download>One-page overview (PDF) ↓</a>
        </div>
        <p className={styles.downloadNote}>ZIP · {downloads.zipSize} · 4 photos, channel artwork, bios, and PDF · Updated {AUDIENCE.checkedLabel}</p>
      </header>
      <div className={styles.audience}>
        <Audience />
        <a className={styles.views} href={kit.lifetimeViews.source} target="_blank" rel="noopener noreferrer"><strong>{kit.lifetimeViews.display}</strong><span>Lifetime YouTube views</span><small>Public channel total, September 23, 2026</small></a>
      </div>
      <section aria-labelledby="photos-heading" className={styles.section}>
        <div className={styles.sectionHeading}><div><h2 id="photos-heading">Photos of Jesus</h2><p>Pick the image that suits your layout. Downloads are the full files.</p></div><a className="text-link" href="#using-the-kit">Using these assets ↗</a></div>
        <div className={styles.photoGrid}>
          {kit.photos.map((photo) => {
            const file = downloads.photos.find((item) => item.id === photo.id)!;
            return <article key={photo.id} className={styles.photoCard}>
              <div className={styles.photoFrame}><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 45vw, 575px" style={{ objectPosition: photo.position }} /></div>
              <div className={styles.photoHeading}><h3>{photo.title}</h3><a className="text-link" href={photo.src} download={photo.filename} aria-label={`Download ${photo.title}`}>Download ↓</a></div>
              <p>{photo.description}</p><small>{file.width} × {file.height} · {file.format} · {file.size}</small><small className={styles.treatment}>{photo.treatment}</small>
            </article>;
          })}
        </div>
      </section>
      <section aria-labelledby="bios-heading" className={styles.section}>
        <div className={styles.sectionHeading}><div><h2 id="bios-heading">A ready-to-use introduction</h2><p>Use the short bio for event listings, or the extended bio for a feature.</p></div><a className="text-link" href="/media-kit/Jesus-Martinez-Bios.txt" download>Download both (TXT) ↓</a></div>
        <div className={styles.bioGrid}>
          <article className={styles.bio}><div className={styles.bioHeading}><h3>Short bio</h3><CopyBio text={kit.shortBio} label="Copy short bio" /></div><p>{kit.shortBio}</p></article>
          <article className={styles.bio}><div className={styles.bioHeading}><h3>Extended bio</h3><CopyBio text={kit.extendedBio.join("\n\n")} label="Copy extended bio" /></div>{kit.extendedBio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
        </div>
      </section>
      <section aria-labelledby="channel-heading" className={styles.section}>
        <div className={styles.sectionHeading}><div><h2 id="channel-heading">The channel, at a glance</h2><p>Research, project deep dives, and conversations. Full time in crypto since 2021.</p></div></div>
        <div className={styles.channelGrid}>
          <div><div className={styles.banner}><Image src={kit.banner.src} alt="JM Crypto channel banner: No BS. Just Crypto. Daily." width={2560} height={424} sizes="(max-width: 760px) 92vw, 60vw" /></div><a className="text-link" href={kit.banner.src} download={kit.banner.filename}>Download channel banner (2560 × 424 JPG) ↓</a><div className={styles.topics}>{kit.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div>
          <dl className={styles.facts}>
            <div><dt>Name</dt><dd>Jesus Martinez</dd></div><div><dt>Channel</dt><dd>JM Crypto</dd></div><div><dt>Based in</dt><dd>Miami, Florida</dd></div>
            <div><dt>YouTube</dt><dd><a href={LINKS.crypto} target="_blank" rel="noopener noreferrer">@jm_crypto ↗</a></dd></div><div><dt>X</dt><dd><a href={LINKS.x} target="_blank" rel="noopener noreferrer">@JesusMartinez ↗</a></dd></div><div><dt>Instagram</dt><dd><a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">@jesusmartinezbuilds ↗</a></dd></div>
          </dl>
        </div>
      </section>
      <section id="using-the-kit" className={`${styles.section} ${styles.usageGrid}`}>
        <div><h2>Using the kit</h2><p>{kit.usage}</p><p className={styles.note}>Audience figures are dated public snapshots. YouTube rounds its subscriber count. The city portrait is an AI-assisted crop and color correction; the other three photos are originals.</p></div>
        <div><h2>Let’s work together.</h2><p>Interviews, integrations, appearances, or a thoughtful collaboration.</p><a className={styles.email} href={`mailto:${LINKS.email}?subject=JM%20Crypto%20media%20inquiry`}>{LINKS.email} ↗</a><p className={styles.note}>For current availability, campaign details, and audience breakdowns, get in touch.</p></div>
      </section>
    </div>
  );
}
