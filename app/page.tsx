import type { Metadata } from "next";
import JesusHome from "@/components/JesusHome";

export const metadata: Metadata = {
  title: {
    absolute: "Jesus Martinez - Martinez Access",
  },
  description:
    "Crypto markets, macro, and the AI layer reshaping money by Jesus Martinez. Home of JM Crypto and the Jesus Martinez podcast.",
  openGraph: {
    title: "Jesus Martinez - Martinez Access",
    description:
      "Crypto markets, macro, and the AI layer reshaping money by Jesus Martinez.",
    images: ["/opengraph-image"],
  },
};

export const revalidate = 1800;

export default JesusHome;
