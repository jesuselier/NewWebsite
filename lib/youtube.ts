import snapshot from "./youtube-snapshot.json";
import {
  parseYouTubeFeed,
  parseVideosTab,
  selectLongForm,
  formatVideoDate,
} from "./youtube-feed";
export const CHANNELS = {
  jm_crypto: {
    id: "UC9JaJVprqmFUN2iwAcwinjg",
    handle: "@jm_crypto",
    label: "JM Crypto",
    gold: false,
  },
} as const;
export type ChannelKey = keyof typeof CHANNELS;
export type YTVideo = (typeof snapshot.videos)[number] & {
  publishedLabel: string;
  channelKey: ChannelKey;
};
async function fetchText(url: string) {
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}
export async function getFullLatest(
  limit = 12,
  channels: ChannelKey[] = ["jm_crypto"],
): Promise<YTVideo[]> {
  if (!channels.includes("jm_crypto")) return [];
  const [xml, html] = await Promise.all([
    fetchText(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNELS.jm_crypto.id}`,
    ),
    fetchText("https://www.youtube.com/@jm_crypto/videos?hl=en"),
  ]);
  return selectLongForm(
    parseYouTubeFeed(xml),
    parseVideosTab(html),
    snapshot.videos,
    limit,
  ).map((video) => ({
    ...video,
    duration: video.duration ?? "",
    publishedLabel: formatVideoDate(video.published),
    channel: "JM Crypto",
    channelKey: "jm_crypto",
    gold: false,
  }));
}
