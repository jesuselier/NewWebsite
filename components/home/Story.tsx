import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export default function Story() {
  return (
    <section className={styles.story} id="story" aria-labelledby="story-title">
      <div className={`container ${styles.storyGrid}`}>
        <figure className={styles.storyPhoto} data-reveal>
          <Image
            src="/media/jesus-martinez-professional.jpg"
            alt="Jesus Martinez seated at the microphone during a JM Crypto conversation"
            fill
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 64px), (max-width: 1100px) 44vw, 470px"
          />
        </figure>
        <div className={styles.storyCopy} data-reveal>
          <p className={styles.kicker}>How it started</p>
          <h2 id="story-title" className={styles.h2}>
            I got into crypto to help my brother.
          </h2>
          <p>
            In 2021, my brother lost his life savings through high-leverage
            trading. I wanted to help him rebuild, so I started learning
            everything I could.
          </p>
          <dl className={styles.ledger}>
            <div>
              <dt>$700</dt>
              <dd>
                My start in Axie Infinity, half of what I had in the bank.
              </dd>
            </div>
            <div>
              <dt>Mid-five figures</dt>
              <dd>What I turned it into through the game’s breeding market.</dd>
            </div>
          </dl>
          <p>
            It helped my brother recover, and it changed my direction. Today,
            I’m all in on growing JM Crypto and sharing what I learn.
          </p>
          <Link className={styles.arrowLink} href="/about">
            Read the full story <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
