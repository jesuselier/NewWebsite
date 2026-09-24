import type { Metadata } from "next";
export const LINKS = {
  crypto: "https://www.youtube.com/@jm_crypto",
  attention: "https://www.youtube.com/@JesusMartinezTrades",
  x: "https://x.com/JesusMartinez",
  instagram: "https://www.instagram.com/jesusmartinezez/",
  email: "jmcryptobusiness@gmail.com",
  mediaKit:
    "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK",
};
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: ["/opengraph-image"] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
