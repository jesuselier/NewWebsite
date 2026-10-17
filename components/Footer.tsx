import Link from "next/link";
import { LINKS } from "@/lib/site";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <nav className="footer-links" aria-label="Footer navigation">
          <a href={LINKS.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href={LINKS.crypto} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <Link href="/press-kit">Media kit</Link>
          <Link href="/#attention-cycle">The Attention Cycle</Link>
        </nav>
        <div className="footer-meta">
          <span className="copyright">
            © {new Date().getFullYear()} Jesus Martinez
          </span>
          <span className="footer-note">Curiosity. Conviction. Perspective.</span>
          <a href="#top" className="back-to-top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
      <div className="footer-signature" aria-hidden="true">
        JESUS MARTINEZ
      </div>
    </footer>
  );
}
