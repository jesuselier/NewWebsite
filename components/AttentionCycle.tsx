import AttentionCycleDiagram from "./AttentionCycleDiagram";
import { ATTENTION_CYCLE_ARTICLE, stages } from "./attention-cycle-stages";
import { START_HERE, durationMinutes, watchUrl } from "@/lib/start-here";
import styles from "./AttentionCycle.module.css";

function Pathway({
  kind,
  title,
  items,
  hypothesis = false,
}: {
  kind: string;
  title: string;
  items: string[];
  hypothesis?: boolean;
}) {
  return (
    <div className={styles.pathway}>
      <div className={styles.pathwayLabel}>
        <span>{kind}</span>
        <h4>{title}</h4>
      </div>
      <ol className={styles.pathwayNodes} aria-label={title}>
        {items.map((item, index) => (
          <li
            key={item}
            className={
              hypothesis && index === items.length - 1
                ? styles.hypothesisNode
                : undefined
            }
          >
            {index > 0 && (
              <span className={styles.pathArrow} aria-hidden="true">
                →
              </span>
            )}
            <span className={styles.pathNode}>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AttentionCycle() {
  // The Start-here perspective video is this framework applied on camera.
  const explainer = START_HERE.videos[0];
  return (
    <section
      id="attention-cycle"
      aria-labelledby="attention-cycle-title"
      className={`container ${styles.section}`}
    >
      <div className={styles.surface}>
        <div className={styles.top} data-reveal>
          <header className={styles.header}>
            <p className={styles.eyebrow}>My research framework</p>
            <h2 id="attention-cycle-title">The Attention Cycle</h2>
            <p className={styles.intro}>
              The lens behind my research on JM Crypto, shaped by the 2021
              gaming cycle I lived through. Follow what captures people’s
              attention, how they bet on it, and where that money goes next.
            </p>
          </header>
          <blockquote className={styles.law}>
            <p>
              Capital does not buy the best expression of a narrative. It buys
              the most levered one.
            </p>
          </blockquote>
        </div>

        <ol
          className={styles.track}
          aria-label="The five stages of the Attention Cycle"
          data-reveal
        >
          {stages.map((stage, index) => (
            <li key={stage.name}>
              <span className={styles.trackNumber} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.trackName}>{stage.name}</span>
              <span className={styles.trackHeading}>{stage.heading}</span>
            </li>
          ))}
        </ol>

        <div className={styles.grounding} data-reveal>
          <div>
            <h3>Both halves matter.</h3>
            <p>
              The gaming-token boom was followed by a deep unwind. The same
              sensitivity that creates a huge run can create a huge loss. A
              narrative can survive while its most speculative assets collapse.
            </p>
          </div>
          <div>
            <h3>What would change my mind?</h3>
            <p>
              If equity margin debt falls and crypto trading volume keeps
              falling with it, that points to deleveraging, not the rotation I’m
              looking for. Capital has to show up somewhere else for the thesis
              to hold.
            </p>
          </div>
        </div>

        <details className={styles.deeper}>
          <summary className={styles.deeperSummary}>
            <span className={styles.deeperText}>
              <span className={styles.deeperLabel}>
                Explore the full framework
              </span>
              <span className={styles.deeperHint}>
                Each stage in depth, and the gaming and AI cycles side by side.
              </span>
            </span>
            <span className={styles.deeperIcon} aria-hidden="true" />
          </summary>
          <div className={styles.deeperBody}>
            <AttentionCycleDiagram />
            <div className={styles.comparison}>
              <h3>Different narratives. The same question.</h3>
              <Pathway
                kind="My reading of 2020 / 2021"
                title="The gaming cycle"
                items={["Gaming attention", "Gaming stocks", "Gaming tokens"]}
              />
              <Pathway
                kind="The thesis I’m testing"
                title="The AI cycle"
                items={["AI attention", "AI equities", "AI crypto?"]}
                hypothesis
              />
              <p className={styles.comparisonNote}>
                The final AI handoff is my thesis, not a completed rotation or a
                timetable.
              </p>
            </div>
          </div>
        </details>

        <footer className={styles.source}>
          <div className={styles.sourceLinks}>
            <a
              href={watchUrl(explainer.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch me apply it ({durationMinutes(explainer.duration)} min){" "}
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href={ATTENTION_CYCLE_ARTICLE}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read my original article on X <span aria-hidden="true">↗</span>
            </a>
          </div>
          <span>Article published August 7, 2026</span>
        </footer>
      </div>
    </section>
  );
}
