import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LINKS } from "@/lib/site";
import "./globals.css";
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
  icons: { icon: "/icon.svg" },
};
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jesus Martinez",
  url: "https://www.martinezaccess.com",
  image: "https://www.martinezaccess.com/media/jesus-martinez-portrait.jpg",
  jobTitle: "Creator of JM Crypto",
  sameAs: [LINKS.crypto, LINKS.x, LINKS.instagram],
  knowsAbout: [
    "Cryptocurrency",
    "Bittensor",
    "Artificial intelligence",
    "Digital assets",
  ],
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
        />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
