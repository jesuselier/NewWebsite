import Link from "next/link";
export default function Footer() {
  return (
    <footer className="container site-footer">
      <div>
        <Link href="/" className="footer-brand">
          Martinez Access<span className="cyan">.</span>
        </Link>
        <p>Independent curiosity. Informed perspective.</p>
      </div>
      <div className="footer-links">
        <a
          href="https://x.com/JesusMartinez"
          target="_blank"
          rel="noopener noreferrer"
        >
          X ↗
        </a>
        <a
          href="https://www.youtube.com/@jm_crypto"
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube ↗
        </a>
        <Link href="/press-kit">Press kit</Link>
      </div>
      <span className="copyright">
        © {new Date().getFullYear()} Jesus Martinez
      </span>
    </footer>
  );
}
