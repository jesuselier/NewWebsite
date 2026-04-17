export const CHANNELS = {
  jm_crypto: {
    id: "UC9JaJVprqmFUN2iwAcwinjg",
    handle: "@jm_crypto",
    label: "JM Crypto",
    gold: true,
  },
  podcast: {
    id: "UCqC5cIj_RNTRr-0EBcZ6YyA",
    handle: "@JesusMartinezCrypto",
    label: "Podcast",
    gold: false,
  },
} as const;

export type ChannelKey = keyof typeof CHANNELS;

export type YTVideo = {
  id: string;
  title: string;
  published: string;
  publishedLabel: string;
  thumbSrc: string;
  watchUrl: string;
  channel: (typeof CHANNELS)[ChannelKey]["label"];
  channelKey: ChannelKey;
  gold: boolean;
};

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

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
  const res = await fetch(`${RSS_BASE}${ch.id}`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const xml = await res.text();
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
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Landing Latest strip: [JM #1, Podcast #1, JM #2].
 * Middle slot always podcast; other two are JM Crypto's most recent.
 */
export async function getLandingLatest(): Promise<YTVideo[]> {
  const [jm, pod] = await Promise.all([
    fetchChannelFeed("jm_crypto"),
    fetchChannelFeed("podcast"),
  ]);
  const result: YTVideo[] = [];
  if (jm[0]) result.push(jm[0]);
  if (pod[0]) result.push(pod[0]);
  if (jm[1]) result.push(jm[1]);
  return result;
}

/**
 * /latest page: larger feed — interleave but always keep podcast episodes
 * between JM Crypto videos. Returns up to `limit` items.
 */
export async function getFullLatest(limit = 12): Promise<YTVideo[]> {
  const [jm, pod] = await Promise.all([
    fetchChannelFeed("jm_crypto"),
    fetchChannelFeed("podcast"),
  ]);
  const result: YTVideo[] = [];
  let ji = 0;
  let pi = 0;
  // Pattern: JM, Podcast, JM, JM, Podcast, JM, JM, Podcast, ...
  // Guarantees podcasts sit between JM slots, without requiring alternation.
  while (result.length < limit && (ji < jm.length || pi < pod.length)) {
    if (jm[ji]) result.push(jm[ji++]);
    if (result.length >= limit) break;
    if (pod[pi]) result.push(pod[pi++]);
    if (result.length >= limit) break;
    if (jm[ji]) result.push(jm[ji++]);
  }
  return result.slice(0, limit);
}
