import Image from "next/image";
import HiveField from "./HiveField";
import IntroVideo from "./IntroVideo";
import PlanPicker from "./PlanPicker";
import { LINKS } from "@/lib/site";
import { SWARM_INTRO } from "@/lib/swarm";
import styles from "./swarm.module.css";

// Swarm pre-launch page (joinswarm.ai). Copy comes from Jesus's intro video
// (https://youtu.be/n15W6X84IGg) and his pre-launch pricing; see
// design-lab/landing/SWARM-BRIEF.md. No results, member counts or testimonials exist
// yet, so none appear. The disclosure wording is a draft awaiting Jesus's approval.

const CURVE = [
  {
    label: "Cycle 01 · Left curve",
    text: "You buy because everyone else is buying, and you have no idea when to sell.",
  },
  {
    label: "Cycle 02 · Mid curve",
    text: "You got burned last time, so now you overthink everything. You sell too early and watch the big moves from the sidelines.",
  },
  {
    label: "Cycle 03 · Right curve",
    text: "From the outside it looks like left curve, because both are buying. The difference is that right curve knows what it’s buying, why it’s buying it, and when to get out.",
  },
];

const BENEFITS = [
  { title: "Custom AI tools", text: "Built and maintained by me to trade the markets." },
  { title: "My watch list", text: "So you always know what I’m looking at." },
  { title: "Weekly live calls", text: "Live portfolio reviews, every week." },
  {
    title: "Multi-cycle traders",
    text: "Traders who have made it through several cycles, sharing how they see the market right now.",
  },
];

function JoinButton() {
  return (
    <div className={styles.join}>
      <a className={styles.goldButton} href="#join">
        Join Swarm
      </a>
      <p className={styles.small}>Cancel anytime.</p>
    </div>
  );
}

export default function SwarmPage() {
  return (
    <>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <a href="#swarm-main" className={styles.navBrand} aria-label="Swarm, back to top">
            {/* Wordmark only, so the hero's mark stays the one lit cell on screen. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG used as is */}
            <img src="/brand/swarm/logo/swarm-wordmark-for-dark-bg.svg" alt="Swarm" width={112} height={30} />
          </a>
          <nav aria-label="Swarm" className={styles.navLinks}>
            <a href="#intro">Watch the intro</a>
            <a href="#join" className={styles.outlineButton}>
              Join Swarm
            </a>
          </nav>
        </div>
      </header>

      <main id="swarm-main">
        <section className={styles.hero} aria-labelledby="swarm-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.label}>{"// Pre-launch · Join the swarm"}</p>
              <h1 id="swarm-title" className={styles.heroTitle}>
                Early on purpose.
              </h1>
              <p className={styles.lead}>
                Swarm is an AI crypto trading community for the new era, built and run by Jesus
                Martinez of JM Crypto.
              </p>
              <div className={styles.heroActions}>
                <JoinButton />
                <a className={styles.textLink} href="#intro">
                  Watch the intro <span className={styles.mono}>{SWARM_INTRO.duration}</span>
                </a>
              </div>
              <p className={styles.small}>
                The first 50 founding seats lock in $49/month forever.
              </p>
            </div>
            <HiveField />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="curve-title">
          <div className={styles.inner}>
            <p className={styles.label}>{"// The crypto curve"}</p>
            <h2 id="curve-title" className={styles.h2}>
              Most people need three cycles and a lot of pain to get there.
            </h2>
            <p className={styles.lead}>I want to get you there in one.</p>
            <ol className={styles.curve}>
              {CURVE.map((c) => (
                <li key={c.label}>
                  <span className={styles.label}>{c.label}</span>
                  <p>{c.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="inside-title">
          <div className={styles.inner}>
            <p className={styles.label}>{"// Swarm · Members get"}</p>
            <h2 id="inside-title" className={styles.h2}>
              Here’s what you get.
            </h2>
            <ol className={styles.benefits}>
              {BENEFITS.map((b, i) => (
                <li key={b.title}>
                  <span className={styles.benefitIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </li>
              ))}
            </ol>
            <div className={styles.fit}>
              <div className={styles.panel}>
                <p className={styles.label}>If this is your first cycle</p>
                <h3>Skip the expensive lesson.</h3>
                <p>Swarm saves you from learning it the expensive way.</p>
              </div>
              <div className={styles.panel}>
                <p className={styles.label}>If it’s your second</p>
                <h3>Get back in with a plan.</h3>
                <p>Burned last time and waiting on the sideline? This is how you get back in with a plan.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="intro" aria-labelledby="intro-title">
          <div className={styles.inner}>
            <p className={styles.label}>{`// Welcome to Swarm · ${SWARM_INTRO.duration}`}</p>
            <h2 id="intro-title" className={styles.h2}>
              Watch the intro.
            </h2>
            <IntroVideo />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="founder-title">
          <div className={`${styles.inner} ${styles.founder}`}>
            <figure className={styles.founderPhoto}>
              <Image
                src="/media/jesus-martinez-studio.jpg"
                alt="Jesus Martinez smiling at the camera in his studio"
                fill
                sizes="(max-width: 900px) calc(100vw - 32px), 460px"
                style={{ objectPosition: "55% center" }}
              />
            </figure>
            <div className={styles.founderCopy}>
              <p className={styles.label}>{"// The founder"}</p>
              <h2 id="founder-title" className={styles.h2}>
                2021 was my first cycle. This is my third.
              </h2>
              <p>
                I was working as a server and studying economics, and my brother had just lost
                everything trading. For his birthday I gave him three Axies. Two months later they
                were worth tens of thousands of dollars, and that’s what helped him get back on
                his feet.
              </p>
              <p>
                It wasn’t luck. I grew up playing video games, so I understood how game economies
                worked, and I did the same with the crypto games that came after. That started my
                channel and everything I do today.
              </p>
              <p>
                I stayed through the bear market when everyone else left. 2023 was my second
                cycle, and now I’m doing the same deep work on AI that I did on gaming. That’s why
                I built Swarm.
              </p>
              <ol className={styles.cycles} aria-label="My cycles">
                <li>
                  <span>2021</span> First cycle
                </li>
                <li>
                  <span>2023</span> Second cycle
                </li>
                <li>
                  <span>Now</span> Third cycle
                </li>
              </ol>
              <p className={styles.small}>My story, not a typical result and not a promise of yours.</p>
            </div>
          </div>
        </section>

        <section className={styles.section} id="join" aria-labelledby="join-title">
          <div className={styles.inner}>
            <p className={styles.label}>{"// Pre-launch · Join the swarm"}</p>
            <h2 id="join-title" className={styles.h2}>
              Lock in a founding seat.
            </h2>
            <p className={styles.lead}>
              The first 50 founding seats lock in <span className={styles.goldNumber}>$49/month</span>{" "}
              forever. After that it goes to $99/month. Cancel anytime.
            </p>
            <PlanPicker />
            <p className={styles.risk}>
              Swarm is education and research, not financial advice. Crypto is volatile and you can
              lose money, including all of it. Cancel anytime.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.close}`} aria-labelledby="close-title">
          <div className={styles.inner}>
            <h2 id="close-title" className={styles.h2}>
              Being early and being wrong feel the same.
            </h2>
            <p className={styles.lead}>I want you to be early and actually know exactly why.</p>
            <JoinButton />
            <p className={styles.signoff}>I’ll see you inside.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG used as is */}
          <img
            src="/brand/swarm/logo/swarm-horizontal-for-dark-bg.svg"
            alt="Swarm"
            width={200}
            height={61}
            className={styles.footerLogo}
          />
          <nav aria-label="Jesus Martinez" className={styles.footerLinks}>
            <a href="https://www.martinezaccess.com">martinezaccess.com</a>
            <a href={LINKS.crypto} target="_blank" rel="noopener noreferrer">
              JM Crypto on YouTube
            </a>
            <a href={LINKS.x} target="_blank" rel="noopener noreferrer">
              @JesusMartinez on X
            </a>
          </nav>
          <div className={styles.disclosure}>
            <p>
              Swarm is an educational community. Nothing here is financial, investment, tax or
              legal advice, or a recommendation to buy or sell anything.
            </p>
            <p>
              Crypto assets are volatile and can lose most or all of their value. Only use money
              you can afford to lose. Past results, including Jesus’s, do not predict future
              results.
            </p>
            <p>
              AI tools can be wrong. Treat what they show as information to check, not
              instructions. Payments are processed by Whop.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
