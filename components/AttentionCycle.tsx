import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import AttentionCycleDiagram from "./AttentionCycleDiagram";
import styles from "./AttentionCycle.module.css";

const didot = localFont({
  src: "../public/fonts/GFSDidotBold.otf",
  weight: "700",
  variable: "--font-cycle-display",
  display: "swap",
  preload: false,
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cycle-label",
  display: "swap",
  preload: false,
});
const articleUrl = "https://x.com/JesusMartinez/status/2085797626448896297";

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
  return (
    <section
      id="attention-cycle"
      aria-labelledby="attention-cycle-title"
      className={`container ${styles.section} ${didot.variable} ${mono.variable}`}
    >
      <div className={styles.surface}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>My market framework</p>
            <h2 id="attention-cycle-title">The Attention Cycle</h2>
          </div>
          <p className={styles.intro}>
            The lens behind my research on JM Crypto. Follow what captures
            people’s attention, how they bet on it, and where that money goes
            next.
          </p>
        </header>
        <blockquote className={styles.law}>
          “Capital does not buy the best expression of a narrative. It buys the
          most levered one.”
        </blockquote>
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
        <div className={styles.grounding}>
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
        <footer className={styles.source}>
          <a href={articleUrl} target="_blank" rel="noopener noreferrer">
            Read my original article on X <span aria-hidden="true">↗</span>
          </a>
          <span>Published August 7, 2026</span>
        </footer>
      </div>
    </section>
  );
}
