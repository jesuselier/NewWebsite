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
    "Crypto markets, macro, and the AI layer reshaping money by Jesus Martinez.",
  keywords: [
    "Jesus Martinez",
    "JM Crypto",
    "Martinez Access",
    "crypto news",
    "crypto podcast",
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
      "Crypto markets, macro, and the AI layer reshaping money by Jesus Martinez.",
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
      "Crypto markets, macro, and the AI layer reshaping money by Jesus Martinez.",
    images: ["/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jesus Martinez",
  url: "https://martinezaccess.com",
  image: "https://martinezaccess.com/Happy.webp",
  jobTitle: "Creator, host, and crypto market analyst",
  brand: {
    "@type": "Brand",
    name: "Martinez Access",
  },
  sameAs: [
    "https://youtube.com/@jm_crypto",
    "https://www.youtube.com/@JesusMartinezCrypto",
    "https://twitter.com/JesusMartinez",
    "https://instagram.com/jesusmartinezez",
  ],
  knowsAbout: ["cryptocurrency", "macro markets", "artificial intelligence", "digital assets"],
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
