import Image from "next/image";
import { ContactStrip } from "@/components/SiteSections";
import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "About Jesus Martinez",
  "Meet Jesus Martinez, the Miami-based creator behind JM Crypto and The Attention Cycle.",
  "/about",
);
export default function AboutPage() {
  return (
    <>
      <div className="container page-body">
        <header className="page-heading">
          <span className="eyebrow">The person behind the channels</span>
          <h1>Curiosity brought me here.</h1>
        </header>
        <div className="about-layout">
          <div className="about-photo">
            <Image
              src="/Happy.webp"
              alt="Jesus Martinez"
              fill
              sizes="(max-width: 760px) 92vw, 40vw"
            />
          </div>
          <div className="about-copy">
            <h2>I’m Jesus Martinez.</h2>
            <p>
              A first-generation Cuban American based in Miami. I’ve been
              working full time in crypto and finance since 2021, asking
              questions, doing the research, and learning in public.
            </p>
            <p>
              Before crypto, I spent years inside competitive gaming and its
              digital economies. Today, that same curiosity takes me into
              Bittensor, AI, and the networks being built around them.
            </p>
            <p>
              JM Crypto is where I follow the projects, speak with the builders,
              and put the market’s biggest stories in context. The Attention
              Cycle zooms out to a question that keeps pulling me back: where
              does attention go next, and what follows it?
            </p>
            <a
              className="text-link"
              href={LINKS.crypto}
              target="_blank"
              rel="noopener noreferrer"
            >
              Come follow the conversation <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
      <ContactStrip />
    </>
  );
}
