import Link from "next/link";
import EmailTile from "@/components/EmailTile";
import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "Get in Touch",
  "Contact Jesus Martinez for JM Crypto interviews, collaborations, sponsorships, and press.",
  "/connect",
);
export default function ConnectPage() {
  return (
    <div className="container page-body">
      <header className="page-heading">
        <span className="section-label">Get in touch</span>
        <h1>Let’s talk.</h1>
        <p>
          Have a story, a project, or a perspective my audience should hear?
          Send a little context.
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
          <span className="section-label">The daily conversation</span>
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
          <span className="section-label">Behind the scenes</span>
          <h2>
            Instagram <span aria-hidden="true">↗</span>
          </h2>
          <p>@jesusmartinezbuilds</p>
        </a>
        <Link className="contact-card" href="/press-kit">
          <span className="section-label">For partners & press</span>
          <h2>
            Media kit <span aria-hidden="true">↗</span>
          </h2>
          <p>My bio, audience numbers, and a downloadable portrait.</p>
        </Link>
      </div>
      <p className="contact-help">
        Include your project, the format you have in mind, and your timeline.
      </p>
    </div>
  );
}
