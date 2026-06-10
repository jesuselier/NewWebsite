import type { Metadata } from "next";
import JesusHome from "@/components/JesusHome";

export const metadata: Metadata = {
  title: {
    absolute: "Jesus Martinez - Martinez Access",
  },
  description:
    "Markets, macro, and the AI that now trades them. Home of JM Crypto and Jesus Martinez Trades.",
  openGraph: {
    title: "Jesus Martinez - Martinez Access",
    description:
      "Markets, macro, and the AI that now trades them — by Jesus Martinez.",
    images: ["/opengraph-image"],
  },
};

export const revalidate = 1800;

export default JesusHome;
