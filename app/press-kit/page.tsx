import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "Press & Partnerships",
  "Jesus Martinez's creator bio, collaboration formats, and media kit for JM Crypto and The Attention Cycle.",
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
        <span className="eyebrow">Press & partnerships</span>
        <h1>Work with Jesus.</h1>
        <p>
          Independent crypto coverage. Thoughtful conversations. An audience
          that wants to understand what comes next.
        </p>
        <a
          className="button button-primary"
          href={LINKS.mediaKit}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open media assets <span aria-hidden="true">↗</span>
        </a>
      </header>
      <div className="press-layout">
        <section className="press-bio">
          <span className="eyebrow">Short bio</span>
          <h2>Jesus Martinez</h2>
          <p>
            Jesus Martinez is a Miami-based creator and researcher covering
            crypto and AI. Through JM Crypto, he explores market narratives,
            projects, and the people building them, with a particular focus on
            Bittensor and the intersection of AI and crypto.
          </p>
          <p>
            He also hosts The Attention Cycle, a show about where attention and
            speculative capital go next. A first-generation Cuban American,
            Jesus has worked full time in crypto and finance since 2021.
          </p>
        </section>
        <section>
          <span className="eyebrow">Ways to collaborate</span>
          <ul className="format-list">
            {formats.map((f) => (
              <li key={f}>
                {f}
                <span aria-hidden="true">↗</span>
              </li>
            ))}
          </ul>
          <a className="text-link" href={`mailto:${LINKS.email}`}>
            Discuss a partnership <span aria-hidden="true">↗</span>
          </a>
          <p className="small-note">
            Request current audience figures and availability by email.
          </p>
        </section>
      </div>
    </div>
  );
}
