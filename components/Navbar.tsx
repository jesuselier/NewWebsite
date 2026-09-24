import Link from "next/link";
export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Main navigation">
        <Link href="/" className="wordmark" aria-label="Martinez Access home">
          <span className="brand-dot" />
          MARTINEZ<span className="wordmark-light">ACCESS</span>
        </Link>
        <div className="nav-links">
          <Link href="/channels">Channels</Link>
          <Link href="/latest">Videos</Link>
          <a href="/tier-list">
            Tier lists{" "}
            <span className="small-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <Link href="/about">About</Link>
          <Link href="/connect" className="nav-contact">
            Get in touch <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
