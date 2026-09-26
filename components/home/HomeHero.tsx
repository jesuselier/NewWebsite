import Image from "next/image";
import { AUDIENCE, LINKS } from "@/lib/site";
import styles from "./home.module.css";

export default function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className={styles.intro}>Hey, my name is Jesus Martinez.</p>
          <h1 id="home-title" className={styles.title}>
            Crypto <br />
            changed <em className={styles.titleAccent}>my life.</em>
          </h1>
          <p className={styles.deck}>
            What started as a way to help my brother became JM Crypto. Now I
            break down the projects shaping crypto and AI in plain English,
            through deep dives, long-form interviews, and the framework I use to
            follow attention and capital.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primaryButton}
              href={LINKS.crypto + "?sub_confirmation=1"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true" className={styles.play}>
                ▶
              </span>
              Join me on YouTube
            </a>
            <a className={styles.quietLink} href="#start-here">
              New here? Start here <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <figure className={styles.portrait}>
            <Image
              src="/media/jesus-martinez-city-portrait.png"
              alt="Jesus Martinez smiling in front of the New York City skyline at night"
              fill
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 64px), (max-width: 1100px) 42vw, 480px"
              preload
            />
          </figure>
        </div>
        <div className={styles.proof}>
          <ul className={styles.proofList}>
            <li>
              <a
                href={AUDIENCE.youtube.source}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${AUDIENCE.youtube.count.toLocaleString("en-US")} subscribers on JM Crypto, open YouTube`}
              >
                <strong>{AUDIENCE.youtube.display}</strong>
                <span>Subscribers on JM Crypto</span>
              </a>
            </li>
            <li>
              <a
                href={AUDIENCE.x.source}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${AUDIENCE.x.count.toLocaleString("en-US")} followers on X, open profile`}
              >
                <strong>{AUDIENCE.x.display}</strong>
                <span>Followers on X</span>
              </a>
            </li>
            <li>
              <strong>Since 2021</strong>
              <span>Full time in crypto</span>
            </li>
          </ul>
          <p className={styles.proofNote}>
            Public counts checked{" "}
            <time dateTime={AUDIENCE.checkedAt}>{AUDIENCE.checkedLabel}</time>.
          </p>
        </div>
      </div>
    </section>
  );
}
