import Link from "next/link";
export function StoryFeature() {
  return (
    <section className="story-feature" id="story">
      <div className="container story-inner">
        <div>
          <span className="section-label">How it started</span>
          <h2>
            I got into crypto
            <br />
            to help my brother.
          </h2>
          <Link className="text-link" href="/about">
            The full story <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="story-excerpt">
          <p>
            In 2021, my brother lost his life savings through high-leverage
            trading. I wanted to help him rebuild, so I started learning
            everything I could.
          </p>
          <p>
            I put $700 into Axie Infinity, half of what I had in the bank.
            Through the game’s breeding market, I turned that into mid-five
            figures and helped my brother recover.
          </p>
          <p>
            That experience changed my direction. Today, I’m all in on growing
            JM Crypto and sharing what I learn.
          </p>
        </div>
      </div>
    </section>
  );
}
export function TierListFeature() {
  return (
    <section className="section container" id="tools">
      <div className="tool-feature">
        <div className="tool-copy">
          <span className="section-label">A tool for your next thesis</span>
          <h2>
            Where do your
            <br />
            coins stand?
          </h2>
          <p>
            Rank the projects you follow, customize your labels, and share your
            crypto tier list.
          </p>
          <a className="button button-primary" href="/tier-list">
            Make a tier list <span aria-hidden="true">↗</span>
          </a>
          <span className="tool-note">Free. No sign-up. Yours to share.</span>
        </div>
        <a
          className="tier-preview"
          href="/tier-list"
          aria-label="Open the crypto tier-list builder"
        >
          <div className="preview-toolbar">
            <span>Your crypto tier list</span>
            <span aria-hidden="true">↗</span>
          </div>
          {["S", "A", "B", "C"].map((tier, index) => (
            <div className={`preview-row preview-row-${index}`} key={tier}>
              <span className="preview-label">{tier}</span>
              <span className="preview-slot" />
              <span className="preview-slot" />
              {index % 2 === 0 && <span className="preview-slot" />}
              <span className="preview-drag">
                {index === 1 ? "Your next conviction goes here" : ""}
              </span>
            </div>
          ))}
          <span className="preview-caption">Your research. Your rankings.</span>
        </a>
      </div>
    </section>
  );
}
export function ContactStrip() {
  return (
    <section id="connect" className="container contact-strip">
      <div>
        <h2>Let’s build something.</h2>
        <p>Interviews, partnerships, or an idea worth a conversation.</p>
      </div>
      <Link href="/connect" className="button button-dark">
        Get in touch <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
