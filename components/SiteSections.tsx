import Link from "next/link";
import { LINKS } from "@/lib/site";

// Shared by the homepage and /about. The homepage's story and tier-list
// sections live in components/home.
export function ContactStrip() {
  return (
    <section
      id="connect"
      className="container contact-strip"
      aria-labelledby="connect-title"
    >
      <div className="contact-copy">
        <h2 id="connect-title">Let’s build something.</h2>
        <p>Interviews, partnerships, or an idea worth a conversation.</p>
      </div>
      <div className="contact-actions">
        <a className="contact-email" href={`mailto:${LINKS.email}`}>
          {LINKS.email}
        </a>
        <div className="contact-links">
          <Link href="/connect" className="button button-dark">
            Get in touch <span aria-hidden="true">→</span>
          </Link>
          <Link href="/press-kit" className="text-link">
            Media kit <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
