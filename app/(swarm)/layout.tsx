import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Unbounded } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SWARM_ORIGIN } from "@/lib/swarm";
// The approved Swarm tokens, used as they are and scoped to the .swarm wrapper.
import "@/public/brand/swarm/swarm-tokens.css";
import "./swarm.css";

// Root layout for Swarm (joinswarm.ai). It is separate from the martinezaccess.com
// layout in app/(site) so neither brand's styles, fonts or metadata leak into the other.

const display = Unbounded({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-swarm-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-swarm-mono",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-swarm-body",
  display: "swap",
});

const title = "Swarm | AI Crypto Trading Community";
const description =
  "Swarm is Jesus Martinez's AI crypto trading community for the new era: custom AI tools he builds and maintains, his watch list, weekly live portfolio reviews, and traders who have been through several cycles.";
const ogImage = {
  url: "/brand/swarm/social/swarm-og-1200x630.png",
  width: 1200,
  height: 630,
  alt: "Swarm, AI crypto trading",
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SWARM_ORIGIN),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Swarm",
    locale: "en_US",
    title,
    description,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@JesusMartinez",
    title,
    description,
    images: [ogImage],
  },
  icons: {
    icon: [
      { url: "/brand/swarm/icons/favicon.ico", sizes: "any" },
      { url: "/brand/swarm/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/swarm/icons/apple-touch-icon-180.png", sizes: "180x180" }],
  },
};

export default function SwarmRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body className="swarm">
        <a className="swarm-skip" href="#swarm-main">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
