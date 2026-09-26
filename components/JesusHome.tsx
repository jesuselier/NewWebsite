import { getFullLatest } from "@/lib/youtube";
import AttentionCycle from "./AttentionCycle";
import { ContactStrip } from "./SiteSections";
import HomeHero from "./home/HomeHero";
import LatestUploads from "./home/LatestUploads";
import ScrollReveal from "./home/ScrollReveal";
import StartHere from "./home/StartHere";
import Story from "./home/Story";
import TierListFeature from "./home/TierListFeature";
import { newsreader } from "./home/fonts";
import styles from "./home/home.module.css";

// Pacing: who I am and what to watch first, a curated path, the story behind
// the channel, the framework that grew out of it, what's new, then the tool.
export default async function JesusHome() {
  const videos = await getFullLatest(4);
  return (
    <div className={`${newsreader.variable} ${styles.home}`}>
      <ScrollReveal />
      <HomeHero />
      <StartHere />
      <Story />
      <AttentionCycle />
      <LatestUploads videos={videos} />
      <TierListFeature />
      <ContactStrip />
    </div>
  );
}
