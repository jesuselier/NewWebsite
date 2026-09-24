export type FeedVideo = {
  id: string;
  title: string;
  published: string;
  thumbSrc: string;
  watchUrl: string;
  duration?: string;
};

export type ChannelVideo = { id: string; duration?: string };

/** Read YouTube's data literal without evaluating any page JavaScript. */
export function parseVideosTab(html: string): ChannelVideo[] {
  try {
    const marker = /(?:var\s+)?ytInitialData\s*=\s*/.exec(html);
    if (!marker) return [];
    const start = marker.index + marker[0].length;
    let json = "";
    const quote = html[start];
    if (quote === "'" || quote === '"') {
      let end = start + 1;
      for (; end < html.length; end++) {
        if (html[end] === "\\") {
          end++;
          continue;
        }
        if (html[end] === quote) break;
      }
      json = html
        .slice(start + 1, end)
        .replace(
          /\\(x[\da-f]{2}|u[\da-f]{4}|[\\'"nrtbf/])/gi,
          (_, escape: string) => {
            if (/^[xu]/i.test(escape))
              return String.fromCharCode(parseInt(escape.slice(1), 16));
            const escapes: Record<string, string> = {
              n: "\n",
              r: "\r",
              t: "\t",
              b: "\b",
              f: "\f",
            };
            return escapes[escape] ?? escape;
          },
        );
    } else {
      let depth = 0,
        inString = false;
      for (let end = start; end < html.length; end++) {
        const char = html[end];
        if (inString && char === "\\") {
          end++;
          continue;
        }
        if (char === '"') inString = !inString;
        if (!inString) {
          if (char === "{") depth++;
          if (char === "}" && --depth === 0) {
            json = html.slice(start, end + 1);
            break;
          }
        }
      }
    }
    const data = JSON.parse(json);
    const tabs = (
      data?.contents?.twoColumnBrowseResultsRenderer ??
      data?.contents?.singleColumnBrowseResultsRenderer
    )?.tabs;
    const selected = Array.isArray(tabs)
      ? tabs.find((tab) => tab.tabRenderer?.selected)?.tabRenderer
      : undefined;
    if (!selected || selected.title !== "Videos") return [];
    const videos = new Map<string, ChannelVideo>();
    function walk(node: unknown) {
      if (!node || typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      // Shorts use separate renderers and must never become approved video IDs.
      if (record.reelItemRenderer || record.shortsLockupViewModel) return;
      const video = (record.videoRenderer ?? record.compactVideoRenderer) as
        | {
            videoId?: string;
            lengthText?: { simpleText?: string; runs?: { text: string }[] };
          }
        | undefined;
      if (video && video.videoId && /^[\w-]{11}$/.test(video.videoId)) {
        videos.set(video.videoId, {
          id: video.videoId,
          duration:
            video.lengthText?.simpleText ??
            video.lengthText?.runs?.map((run) => run.text).join(""),
        });
        return;
      }
      Object.values(record).forEach(walk);
    }
    walk(selected.content);
    return [...videos.values()];
  } catch {
    return [];
  }
}

/** Unknown uploads are withheld when classification fails; never guess from duration. */
export function selectLongForm(
  live: FeedVideo[],
  approved: ChannelVideo[],
  snapshot: FeedVideo[],
  limit: number,
): FeedVideo[] {
  const ids = new Set([
    ...approved.map((video) => video.id),
    ...snapshot.map((video) => video.id),
  ]);
  const duration = new Map(approved.map((video) => [video.id, video.duration]));
  const longForm = live
    .filter((video) => ids.has(video.id))
    .map((video) => ({
      ...video,
      ...(duration.get(video.id) ? { duration: duration.get(video.id) } : {}),
    }));
  return mergeVideos(longForm, snapshot, limit);
}

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
