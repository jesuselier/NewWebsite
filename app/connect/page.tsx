import Link from "next/link";
import EmailTile from "@/components/EmailTile";
import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "Get in Touch",
  "Contact Jesus Martinez for interviews, collaborations, sponsorships, and press. Find JM Crypto and The Attention Cycle.",
  "/connect",
);
export default function ConnectPage() {
  return (
    <div className="container page-body">
      <header className="page-heading">
        <span className="eyebrow">Let’s connect</span>
        <h1>
          Good conversations
          <br />
          start somewhere.
        </h1>
        <p>
          Have a story, a product, or a perspective my audience should hear?
          Send a little context and let’s talk.
        </p>
      </header>
      <EmailTile />
      <div className="contact-grid">
        <a
          className="contact-card"
          href={LINKS.x}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="eyebrow">The daily conversation</span>
          <h2>
            Find me on X <span aria-hidden="true">↗</span>
          </h2>
          <p>@JesusMartinez</p>
        </a>
        <a
          className="contact-card"
          href={LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="eyebrow">Behind the scenes</span>
          <h2>
            Instagram <span aria-hidden="true">↗</span>
          </h2>
          <p>@jesusmartinezez</p>
        </a>
        <Link className="contact-card" href="/press-kit">
          <span className="eyebrow">For partners & press</span>
          <h2>
            Press kit <span aria-hidden="true">↗</span>
          </h2>
          <p>Bio, collaboration formats, and media assets.</p>
        </Link>
      </div>
      <p className="contact-help">
        For a faster conversation, include your project, the format you have in
        mind, and your timeline.
      </p>
    </div>
  );
}
