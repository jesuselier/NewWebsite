import Image from "next/image";
import Audience from "@/components/Audience";
import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "Media Kit & Partnerships",
  "Jesus Martinez's bio, verified public audience counts, downloadable portrait, and partnership contact for JM Crypto.",
  "/press-kit",
);
const formats = [
  "YouTube integrations",
  "Project deep dives",
  "Founder interviews",
  "Conference appearances",
  "Social campaigns",
  "Podcast conversations",
];
export default function PressKitPage() {
  return (
    <div className="container page-body">
      <header className="page-heading">
        <span className="section-label">Media kit & partnerships</span>
        <h1>Work with Jesus.</h1>
        <p>
          Crypto research and conversations from a creator who’s been in it full
          time since 2021.
        </p>
      </header>
      <div className="media-intro">
        <Audience />
        <a
          className="button button-dark"
          href={`mailto:${LINKS.email}?subject=JM%20Crypto%20partnership`}
        >
          Discuss a partnership <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="press-layout">
        <section className="press-bio">
          <h2>Jesus Martinez</h2>
          <p>
            Jesus Martinez is a Miami-based creator and the voice behind JM
            Crypto. A first-generation Cuban American, he entered crypto in 2021
            after his brother lost his life savings. A $700 start in Axie
            Infinity grew into mid-five figures through the game’s breeding
            market, helping his brother recover and setting Jesus on a new path.
          </p>
          <p>
            Today, JM Crypto covers the wider crypto market through research,
            project deep dives, and interviews, with a particular interest in
            Bittensor and AI. Jesus is focused on growing the channel and
            creating work that helps his audience understand the space.
          </p>
          <figure className="press-photo">
            <Image
              src="/media/jesus-martinez-portrait.jpg"
              alt="Jesus Martinez in the JM Crypto studio"
              width={1920}
              height={1080}
              sizes="(max-width:760px) 92vw, 52vw"
            />
          </figure>
          <a
            className="text-link"
            href="/media/jesus-martinez-portrait.jpg"
            download="Jesus-Martinez-JM-Crypto.jpg"
          >
            Download portrait (1920 × 1080 JPG){" "}
            <span aria-hidden="true">↓</span>
          </a>
        </section>
        <section>
          <h2>Ways to collaborate</h2>
          <ul className="format-list">
            {formats.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="small-note">
            For current availability, audience details, and campaign ideas:
          </p>
          <a className="press-email" href={`mailto:${LINKS.email}`}>
            {LINKS.email}
          </a>
        </section>
      </div>
    </div>
  );
}
