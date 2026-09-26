import styles from "./home.module.css";

const tiers = [
  { label: "S", slots: 3 },
  { label: "A", slots: 2, hint: "Your next conviction goes here" },
  { label: "B", slots: 3 },
  { label: "C", slots: 2 },
];

// The builder is a standalone document served through a rewrite, so these
// links stay plain anchors rather than next/link.
export default function TierListFeature() {
  return (
    <section
      className={styles.section}
      id="tools"
      aria-labelledby="tools-title"
    >
      <div className={`container ${styles.toolGrid}`}>
        <div className={styles.toolCopy} data-reveal>
          <p className={styles.kicker}>Your turn</p>
          <h2 id="tools-title" className={styles.h2}>
            Where do your coins stand?
          </h2>
          <p className={styles.lede}>
            Rank the projects you follow, customize your labels, and share your
            crypto tier list.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="/tier-list">
              Make a tier list <span aria-hidden="true">↗</span>
            </a>
            <span className={styles.toolNote}>
              Free. No sign-up. Yours to share.
            </span>
          </div>
        </div>
        <div data-reveal>
          <a
            className={styles.tierPreview}
            href="/tier-list"
            aria-label="Open the crypto tier-list builder"
          >
            <span className={styles.previewBar}>
              <span>Your crypto tier list</span>
              <span aria-hidden="true">↗</span>
            </span>
            {tiers.map((tier, index) => (
              <span
                className={styles.previewRow}
                data-tier={index}
                key={tier.label}
              >
                <span className={styles.previewLabel}>{tier.label}</span>
                {Array.from({ length: tier.slots }, (_, slot) => (
                  <span className={styles.previewSlot} key={slot} />
                ))}
                {tier.hint && (
                  <span className={styles.previewHint}>{tier.hint}</span>
                )}
              </span>
            ))}
            <span className={styles.previewCaption}>
              Your research. Your rankings.
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
