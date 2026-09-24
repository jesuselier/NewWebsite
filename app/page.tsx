import JesusHome from "@/components/JesusHome";
import { pageMetadata } from "@/lib/site";
export const revalidate = 1800;
export const metadata = pageMetadata(
  "Jesus Martinez | Crypto, With Context",
  "Crypto research, conversations, and tools from Jesus Martinez. Watch JM Crypto, explore The Attention Cycle, and build your own tier list.",
  "/",
);
export default function Home() {
  return <JesusHome />;
}
