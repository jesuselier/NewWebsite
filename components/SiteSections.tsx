import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/site";
export function Channels({ standalone = false }: { standalone?: boolean }) {
  return (
    <section
      id="channels"
      className={standalone ? "channels-standalone" : "section container"}
    >
      {!standalone && (
        <div className="section-heading">
          <div>
            <span className="eyebrow">Two perspectives. One curiosity.</span>
            <h2>Go deeper.</h2>
          </div>
          <Link className="text-link" href="/channels">
            Explore the channels <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
      <div className="channel-grid">
        <article className="channel-panel crypto-panel">
          <div className="channel-top">
            <span className="channel-symbol" aria-hidden="true">
              JM<span>↗</span>
            </span>
            <span className="channel-tag">THE DAILY PERSPECTIVE</span>
          </div>
          <div>
            <h3>
              JM Crypto<span className="cyan">.</span>
            </h3>
            <p>
              The moves, the narratives, and the people behind crypto. Research
              and conversations to help you understand what matters.
            </p>
          </div>
          <div className="channel-bottom">
            <span>CRYPTO · BITTENSOR · AI</span>
            <a
              href={LINKS.crypto}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch JM Crypto on YouTube"
            >
              Watch JM Crypto <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
        <article className="channel-panel attention-panel">
          <div className="channel-top">
            <Image
              src="/brand/attention-cycle.png"
              alt="The Attention Cycle aperture mark"
              width={64}
              height={64}
            />
            <span className="channel-tag">THE BIGGER PICTURE</span>
          </div>
          <div>
            <h3>
              The Attention
              <br />
              Cycle
            </h3>
            <p>
              Where attention goes, capital follows. A show about the ideas,
              people, and forces shaping what comes next.
            </p>
          </div>
          <div className="channel-bottom">
            <span>ATTENTION · CAPITAL · CONVICTION</span>
            <a
              href={LINKS.attention}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Explore The Attention Cycle on Jesus Martinez's YouTube channel"
            >
              Explore the show <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
export function TierListFeature() {
  return (
    <section className="section container" id="tools">
      <div className="tool-feature">
        <div className="tool-copy">
          <span className="eyebrow">Put your thesis on the board</span>
          <h2>
            Your coins.
            <br />
            Your conviction.
          </h2>
          <p>
            Build your crypto tier list. Rank the projects you follow, make it
            your own, and share your take.
          </p>
          <a className="button button-primary" href="/tier-list">
            Build a tier list <span aria-hidden="true">↗</span>
          </a>
          <span className="tool-note">Free to use. No account needed.</span>
        </div>
        <a
          className="tier-preview"
          href="/tier-list"
          aria-label="Open the crypto tier-list builder"
        >
          <div className="preview-toolbar">
            <span>YOUR CRYPTO TIER LIST</span>
            <span aria-hidden="true">↗</span>
          </div>
          {["S", "A", "B", "C"].map((tier, index) => (
            <div className={`preview-row preview-row-${index}`} key={tier}>
              <span className="preview-label">{tier}</span>
              <span className="preview-slot" />
              <span className="preview-slot" />
              {index % 2 === 0 && <span className="preview-slot" />}
              <span className="preview-drag">
                {index === 1 ? "Drop your next conviction here" : ""}
              </span>
            </div>
          ))}
          <span className="preview-caption">
            A blank board. An independent point of view.
          </span>
        </a>
      </div>
    </section>
  );
}
export function ContactStrip() {
  return (
    <section id="connect" className="container contact-strip">
      <div>
        <span className="eyebrow">Start a conversation</span>
        <h2>
          Something worth
          <br />
          talking about?
        </h2>
        <p>Interviews, collaborations, and ideas with substance.</p>
      </div>
      <Link href="/connect" className="button button-light">
        Let’s connect <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
