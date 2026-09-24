import Link from "next/link";
import { LINKS } from "@/lib/site";
export default function Footer() {
  return (
    <footer className="container site-footer">
      <div>
        <Link href="/" className="footer-brand">
          Jesus Martinez<span className="cyan">.</span>
        </Link>
        <p>Research. Conversations. Lessons from the journey.</p>
      </div>
      <div className="footer-links">
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
      </div>
      <span className="copyright">
        © {new Date().getFullYear()} Jesus Martinez / Martinez Access
      </span>
    </footer>
  );
}
