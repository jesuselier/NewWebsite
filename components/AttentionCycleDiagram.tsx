"use client";

import { useId, useState } from "react";
import Image from "next/image";
import styles from "./AttentionCycle.module.css";

const stages = [
  {
    name: "Attention",
    heading: "First, a story takes over.",
    body: "People start spending their time on the same thing. In my article, gaming in 2020 is the starting point: the audience arrived before everyone had decided how to invest in it.",
    question: "What are people spending their time on?",
    x: "50%",
    y: "11%",
    path: "M 295 50 C 372 50 440 85 476 128",
  },
  {
    name: "Capital",
    heading: "The crowd looks for a way in.",
    body: "Attention becomes an investment story. Money gathers around familiar ways to own it, while brokers, exchanges, and apps make it easier for more people to participate.",
    question: "Where can the crowd express that belief?",
    x: "85%",
    y: "37%",
    path: "M 498 196 C 491 262 464 313 429 344",
  },
  {
    name: "Leverage",
    heading: "Same story. A bigger bet.",
    body: "As the obvious trade gets crowded, speculative capital hunts for more upside in smaller assets, options, or tokens. Here, levered can mean a more volatile expression of the story, not only borrowed money.",
    question: "Which expression is most sensitive to the narrative?",
    x: "72%",
    y: "82%",
    path: "M 362 379 C 301 402 238 398 197 383",
  },
  {
    name: "Round trip",
    heading: "The unwind is part of the cycle.",
    body: "Crowded positions unwind when the next buyer stops showing up. The assets most sensitive to the narrative can rise hardest and fall hardest. The selloff belongs in the same model as the run-up.",
    question: "What happens when the crowd wants out?",
    x: "28%",
    y: "82%",
    path: "M 129 344 C 88 301 67 246 64 195",
  },
  {
    name: "Rotation",
    heading: "Then watch where the money goes.",
    body: "My thesis is that capital seeks another expression of what the crowd already believes. That is why I’m watching AI crypto. But money leaving one trade does not prove it has entered the next one.",
    question: "Is capital rotating, or simply leaving risk?",
    x: "15%",
    y: "37%",
    path: "M 84 130 C 127 80 192 48 245 49",
  },
];

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
            <Image
              src="/brand/attention-cycle.png"
              alt=""
              width={76}
              height={76}
              sizes="76px"
            />
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
