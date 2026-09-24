export type FeedVideo = {
  id: string;
  title: string;
  published: string;
  thumbSrc: string;
  watchUrl: string;
  duration?: string;
};

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (entity, key: string) => {
      if (!key.startsWith("#")) return named[key.toLowerCase()] ?? entity;
      const point = key.toLowerCase().startsWith("#x")
        ? parseInt(key.slice(2), 16)
        : Number(key.slice(1));
      return point > 0 &&
        point <= 0x10ffff &&
        !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point)
        : entity;
    },
  );
}

/** YouTube Atom feeds have a small, fixed schema. Construct URLs from validated IDs. */
export function parseYouTubeFeed(xml: string): FeedVideo[] {
  return [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].flatMap(
    ([, entry]) => {
      const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1]?.trim();
      const rawTitle = /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/.exec(
        entry,
      )?.[1];
      const published = /<published>([^<]+)<\/published>/
        .exec(entry)?.[1]
        ?.trim();
      if (
        !id ||
        !/^[\w-]{11}$/.test(id) ||
        !rawTitle ||
        !published ||
        !Number.isFinite(Date.parse(published))
      )
        return [];
      const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(rawTitle);
      const title = (cdata ? cdata[1] : decodeEntities(rawTitle)).trim();
      if (!title) return [];
      return [
        {
          id,
          title,
          published,
          thumbSrc: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
        },
      ];
    },
  );
}

/** Retain verified uploads during upstream failures, and preserve known durations. */
export function mergeVideos(
  live: FeedVideo[],
  snapshot: FeedVideo[],
  limit: number,
): FeedVideo[] {
  const videos = new Map(snapshot.map((video) => [video.id, video]));
  for (const video of live)
    videos.set(video.id, { ...videos.get(video.id), ...video });
  return [...videos.values()]
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
    .slice(0, Math.max(0, limit));
}

export function formatVideoDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}
