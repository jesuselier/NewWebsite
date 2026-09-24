import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});
const didot = localFont({
  src: "../public/fonts/GFSDidotBold.otf",
  weight: "700",
  variable: "--font-didot",
  display: "swap",
  preload: false,
});
export const metadata: Metadata = {
  metadataBase: new URL("https://www.martinezaccess.com"),
  title: {
    default: "Jesus Martinez | Crypto, With Context",
    template: "%s | Martinez Access",
  },
  description:
    "Crypto research, conversations, and tools from Jesus Martinez. Watch JM Crypto, explore The Attention Cycle, and build your own crypto tier list.",
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
  image: "https://www.martinezaccess.com/Happy.webp",
  jobTitle: "Crypto creator and researcher",
  sameAs: [
    "https://www.youtube.com/@jm_crypto",
    "https://www.youtube.com/@JesusMartinezTrades",
    "https://x.com/JesusMartinez",
    "https://www.instagram.com/jesusmartinezez/",
  ],
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
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${didot.variable}`}
    >
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
