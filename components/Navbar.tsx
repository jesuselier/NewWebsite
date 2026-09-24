import Link from "next/link";
export default function Navbar() {
  return (
    <header id="top" className="site-header">
      <nav className="container nav" aria-label="Main navigation">
        <Link href="/" className="wordmark" aria-label="Martinez Access home">
          <span className="brand-monogram">
            JM<span>.</span>
          </span>
          <span>
            Jesus Martinez
            <span className="brand-subtitle">Creator of JM Crypto</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/latest">Videos</Link>
          <Link href="/about">My story</Link>
          <a href="/tier-list">Tier lists</a>
          <Link href="/connect" className="nav-contact">
            Get in touch
          </Link>
        </div>
      </nav>
    </header>
  );
}
