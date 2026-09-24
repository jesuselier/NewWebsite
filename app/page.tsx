import JesusHome from "@/components/JesusHome";
import { pageMetadata } from "@/lib/site";
export const revalidate = 1800;
export const metadata = pageMetadata(
  "Jesus Martinez, Creator of JM Crypto",
  "Meet Jesus Martinez. The story behind JM Crypto, long-form crypto research and interviews, and a free crypto tier-list builder.",
  "/",
);
export default function Home() {
  return <JesusHome />;
}
