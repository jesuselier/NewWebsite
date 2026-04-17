import Navbar from "./Navbar";
import Footer from "./Footer";
import SectionHead from "./SectionHead";
import type { ReactNode } from "react";

type Props = {
  num: string;
  title: string;
  blurb: string;
  children?: ReactNode;
};

export default function PagePlaceholder({ num, title, blurb, children }: Props) {
  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num={num} title={title} />
      <section
        className="rule-top"
        style={{
          padding: "56px 0",
          minHeight: 420,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <p
          className="font-serif text-ink-dim"
          style={{
            fontSize: 22,
            fontStyle: "italic",
            lineHeight: 1.5,
            maxWidth: "56ch",
            margin: 0,
          }}
        >
          {blurb}
        </p>
        <span
          className="font-mono text-ink-mute uppercase"
          style={{ fontSize: 10, letterSpacing: "0.14em" }}
        >
          Expanded content arriving in the next pass.
        </span>
        {children}
      </section>
      <Footer />
    </div>
  );
}
