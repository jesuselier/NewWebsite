import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LINKS } from "@/lib/site";
import { SWARM_ORIGIN } from "@/lib/swarm";
import "../globals.css";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
export const viewport: Viewport = {
  themeColor: "#11171d",
  colorScheme: "dark",
};
export const metadata: Metadata = {
  metadataBase: new URL("https://www.martinezaccess.com"),
  title: {
    default: "Jesus Martinez, Creator of JM Crypto",
    template: "%s | Martinez Access",
  },
  description:
    "The story behind JM Crypto. Crypto research, full-length conversations, and tools from Jesus Martinez.",
  authors: [{ name: "Jesus Martinez", url: "https://www.martinezaccess.com" }],
  creator: "Jesus Martinez",
  openGraph: {
    siteName: "Martinez Access",
    locale: "en_US",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@JesusMartinez",
    images: ["/opengraph-image"],
  },
  // favicon.ico lives in public/ so it is not injected into the Swarm pages,
  // which carry their own icons (see app/(swarm)/layout.tsx).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
      { url: "/icon.svg" },
    ],
  },
};
// Jesus as a Person, plus Swarm, the community he founded (joinswarm.ai). The link runs from this site to Swarm only:
// the Swarm pages never mention martinezaccess.com.
const PERSON_ID = "https://www.martinezaccess.com/#person";
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Jesus Martinez",
      url: "https://www.martinezaccess.com",
      image: "https://www.martinezaccess.com/media/jesus-martinez-portrait.jpg",
      jobTitle: "Creator of JM Crypto",
      sameAs: [LINKS.crypto, "https://www.youtube.com/@JesusMartinezTrades", LINKS.x, LINKS.instagram],
      knowsAbout: [
        "Cryptocurrency",
        "Bittensor",
        "Artificial intelligence",
        "Digital assets",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SWARM_ORIGIN}/#organization`,
      name: "Swarm",
      url: `${SWARM_ORIGIN}/`,
      founder: { "@id": PERSON_ID },
    },
  ],
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
