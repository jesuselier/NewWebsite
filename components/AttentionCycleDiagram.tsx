"use client";

import { useId, useState } from "react";
import { stages } from "./attention-cycle-stages";
import styles from "./AttentionCycle.module.css";

export default function AttentionCycleDiagram() {
  const [active, setActive] = useState(0);
  const id = useId();
  const stage = stages[active];
  return (
    <div className={styles.explorer}>
      <div>
        <div
          className={styles.map}
          role="group"
          aria-label="Explore the five stages of the Attention Cycle"
        >
          <svg
            className={styles.connectors}
            viewBox="0 0 560 450"
            aria-hidden="true"
          >
            <defs>
              <marker
                id={`${id}-arrow`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {stages.map((item, index) => (
              <path
                key={item.name}
                d={item.path}
                fill="none"
                stroke="currentColor"
                strokeWidth={active === index ? 2.5 : 1.5}
                opacity={active === index ? 1 : 0.4}
                markerEnd={`url(#${id}-arrow)`}
              />
            ))}
          </svg>
          <div className={styles.mapCenter} aria-hidden="true">
            <strong>
              The attention<br />
              becomes the trade.
            </strong>
            <span>
              Follow the attention.
              <br />
              Watch the capital.
            </span>
          </div>
          {stages.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={styles.stageButton}
              style={{ left: item.x, top: item.y }}
              aria-pressed={active === index}
              aria-controls={`${id}-explanation`}
              onClick={() => setActive(index)}
            >
              <span className={styles.stageNumber} aria-hidden="true">
                {index + 1}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <p className={styles.mapHint}>Choose a stage to explore the idea.</p>
      </div>
      <div className={styles.stageDetail}>
        <div
          id={`${id}-explanation`}
          className={styles.explanation}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className={styles.stageCounter}>
            Stage {active + 1} of 5 / {stage.name}
          </p>
          <h3>{stage.heading}</h3>
          <p className={styles.stageBody}>{stage.body}</p>
          <p className={styles.stageQuestion}>{stage.question}</p>
        </div>
        <button
          className={styles.nextStage}
          type="button"
          onClick={() => setActive((active + 1) % stages.length)}
        >
          {active === stages.length - 1 ? "Back to attention" : "Next stage"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
