import type { Metadata } from "next";
import { Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jesus Martinez - Martinez Access",
    template: "%s | Martinez Access",
  },
  description:
    "Markets, macro, and the AI that now trades them — two desks from Jesus Martinez: JM Crypto and Jesus Martinez Trades.",
  keywords: [
    "Jesus Martinez",
    "JM Crypto",
    "Jesus Martinez Trades",
    "Martinez Access",
    "crypto news",
    "AI stocks",
    "agentic trading",
    "AI and crypto",
    "macro markets",
  ],
  authors: [{ name: "Jesus Martinez", url: "https://martinezaccess.com" }],
  creator: "Jesus Martinez",
  publisher: "Martinez Access",
  metadataBase: new URL("https://martinezaccess.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jesus Martinez - Martinez Access",
    description:
      "Markets, macro, and the AI that now trades them — by Jesus Martinez.",
    url: "https://martinezaccess.com",
    siteName: "Martinez Access",
    images: ["/opengraph-image"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jesus Martinez - Martinez Access",
    description:
      "Markets, macro, and the AI that now trades them — by Jesus Martinez.",
    images: ["/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jesus Martinez",
  url: "https://martinezaccess.com",
  image: "https://martinezaccess.com/Happy.webp",
  jobTitle: "Creator and market analyst",
  brand: {
    "@type": "Brand",
    name: "Martinez Access",
  },
  sameAs: [
    "https://youtube.com/@jm_crypto",
    "https://www.youtube.com/@JesusMartinezTrades",
    "https://x.com/JesusMartinez",
    "https://instagram.com/jesusmartinezez",
  ],
  knowsAbout: [
    "cryptocurrency",
    "macro markets",
    "artificial intelligence",
    "AI stocks",
    "agentic trading",
    "digital assets",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
