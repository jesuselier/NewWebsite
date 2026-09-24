import { Channels, ContactStrip } from "@/components/SiteSections";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "The Channels",
  "Explore JM Crypto and The Attention Cycle, two perspectives from Jesus Martinez on crypto, AI, attention, and capital.",
  "/channels",
);
export default function ChannelsPage() {
  return (
    <>
      <div className="container page-body">
        <header className="page-heading">
          <span className="eyebrow">The channels</span>
          <h1>Follow your curiosity.</h1>
          <p>
            Daily crypto context. A wider view of where attention and capital
            are going. Pick your starting point.
          </p>
        </header>
        <Channels standalone />
      </div>
      <ContactStrip />
    </>
  );
}
