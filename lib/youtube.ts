import snapshot from "./youtube-snapshot.json";
import {
  parseYouTubeFeed,
  mergeVideos,
  formatVideoDate,
  type FeedVideo,
} from "./youtube-feed";
export const CHANNELS = {
  jm_crypto: {
    id: "UC9JaJVprqmFUN2iwAcwinjg",
    handle: "@jm_crypto",
    label: "JM Crypto",
    gold: false,
  },
  trades: {
    id: "UCqC5cIj_RNTRr-0EBcZ6YyA",
    handle: "@JesusMartinezTrades",
    label: "Jesus Martinez",
    gold: true,
  },
} as const;
export type ChannelKey = keyof typeof CHANNELS;
export type YTVideo = FeedVideo & {
  publishedLabel: string;
  channel: string;
  channelKey: ChannelKey;
  gold: boolean;
};
async function fetchChannelFeed(key: ChannelKey): Promise<YTVideo[]> {
  let live: FeedVideo[] = [];
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNELS[key].id}`,
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(3500) },
    );
    if (response.ok) live = parseYouTubeFeed(await response.text());
  } catch {
    /* Verified uploads remain available if YouTube is unreachable. */
  }
  const verified = snapshot.videos.filter((video) => video.channelKey === key);
  return mergeVideos(live, verified, 24).map((video) => ({
    ...video,
    publishedLabel: formatVideoDate(video.published),
    channel: CHANNELS[key].label,
    channelKey: key,
    gold: CHANNELS[key].gold,
  }));
}
export async function getFullLatest(
  limit = 12,
  channels: ChannelKey[] = ["jm_crypto"],
): Promise<YTVideo[]> {
  const feeds = await Promise.all([...new Set(channels)].map(fetchChannelFeed));
  return feeds
    .flat()
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
    .slice(0, Math.max(0, limit));
}
