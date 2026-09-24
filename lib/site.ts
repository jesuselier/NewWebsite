import type { Metadata } from "next";
export const LINKS = {
  crypto: "https://www.youtube.com/@jm_crypto",
  x: "https://x.com/JesusMartinez",
  instagram: "https://www.instagram.com/jesusmartinezbuilds/",
  email: "jmcryptobusiness@gmail.com",
  mediaKit: "/press-kit",
};
export const AUDIENCE = {
  checkedAt: "2026-09-23",
  checkedLabel: "September 23, 2026",
  youtube: { count: 40000, display: "40K", source: LINKS.crypto },
  x: { count: 322735, display: "322.7K", source: LINKS.x },
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
