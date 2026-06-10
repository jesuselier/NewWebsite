export const CHANNELS = {
  jm_crypto: {
    id: "UC9JaJVprqmFUN2iwAcwinjg",
    handle: "@jm_crypto",
    label: "JM Crypto",
    gold: true,
  },
  trades: {
    id: "UCqC5cIj_RNTRr-0EBcZ6YyA",
    handle: "@JesusMartinezTrades",
    label: "JM Trades",
    gold: false,
  },
} as const;

export type ChannelKey = keyof typeof CHANNELS;

export type YTVideo = {
  id: string;
  title: string;
  published: string;
  publishedLabel: string;
  thumbSrc?: string;
  watchUrl: string;
  channel: (typeof CHANNELS)[ChannelKey]["label"];
  channelKey: ChannelKey;
  gold: boolean;
};

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

export const FALLBACK_VIDEOS: YTVideo[] = [
  {
    id: "jm-crypto-fallback",
    title: "Open the newest JM Crypto market update",
    published: new Date(0).toISOString(),
    publishedLabel: "Live feed fallback",
    watchUrl: "https://www.youtube.com/@jm_crypto/videos",
    channel: CHANNELS.jm_crypto.label,
    channelKey: "jm_crypto",
    gold: CHANNELS.jm_crypto.gold,
  },
  {
    id: "trades-fallback",
    title: "Browse the latest Jesus Martinez Trades videos",
    published: new Date(0).toISOString(),
    publishedLabel: "Live feed fallback",
    watchUrl: "https://www.youtube.com/@JesusMartinezTrades/videos",
    channel: CHANNELS.trades.label,
    channelKey: "trades",
    gold: CHANNELS.trades.gold,
  },
];

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchChannelFeed(key: ChannelKey): Promise<YTVideo[]> {
  const ch = CHANNELS[key];
  let xml = "";

  try {
    const res = await fetch(`${RSS_BASE}${ch.id}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    xml = await res.text();
  } catch {
    return [];
  }

  const entries = xml.split("<entry>").slice(1);
  const candidates = entries
    .map((chunk): YTVideo | null => {
      const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(chunk)?.[1];
      const title = /<title>([^<]+)<\/title>/.exec(chunk)?.[1];
      const published = /<published>([^<]+)<\/published>/.exec(chunk)?.[1];
      const thumb = /<media:thumbnail url="([^"]+)"/.exec(chunk)?.[1];
      if (!id || !title || !published || !thumb) return null;
      return {
        id,
        title: decodeEntities(title),
        published,
        publishedLabel: formatDate(published),
        thumbSrc: thumb.replace("hqdefault.jpg", "maxresdefault.jpg"),
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        channel: ch.label,
        channelKey: key,
        gold: ch.gold,
      };
    })
    .filter((v): v is YTVideo => v !== null);

  const shortFlags = await Promise.all(candidates.map((v) => isShort(v.id)));
  return candidates.filter((_, i) => !shortFlags[i]);
}

/**
 * Probe `/shorts/{id}` — YouTube returns 200 for actual shorts and a 3xx
 * redirect to `/watch?v=id` for long-form videos. Treat unexpected failures
 * as "not a short" so we never silently drop regular videos.
 */
async function isShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "manual",
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(2500),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Full Latest feed: round-robin across the requested channels,
 * skipping channels that have run dry. Returns up to `limit` items.
 */
export async function getFullLatest(
  limit = 12,
  channels: ChannelKey[] = ["jm_crypto", "trades"],
): Promise<YTVideo[]> {
  const feeds = await Promise.all(channels.map((k) => fetchChannelFeed(k)));
  const queues = feeds.map((f) => f.slice());
  const result: YTVideo[] = [];
  while (result.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (!q.length) continue;
      result.push(q.shift()!);
      if (result.length >= limit) break;
    }
  }
  return result.length ? result.slice(0, limit) : FALLBACK_VIDEOS.slice(0, limit);
}
