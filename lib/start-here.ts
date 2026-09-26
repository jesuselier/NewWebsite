/**
 * Curated "Start here" path for new viewers.
 *
 * Every title, duration, and publish date below was checked against the
 * public JM Crypto video pages on September 25, 2026. All three are long-form
 * uploads from the channel's Videos tab, not Shorts. Keep titles exactly as
 * published, and re-check them if a video is retitled or replaced.
 */
export type StartHereVideo = {
  id: string;
  kind: "Perspective" | "Research" | "Interview";
  title: string;
  /** Duration exactly as YouTube displays it. */
  duration: string;
  /** Publish time from the video page, in the channel's own offset. */
  published: string;
  why: string;
};

export const START_HERE = {
  checkedAt: "2026-09-25",
  videos: [
    {
      id: "0YufTzt0aXA",
      kind: "Perspective",
      title: "AI Coins Are About to Explode Like Gaming Did in 2021",
      duration: "14:10",
      published: "2026-08-10T09:55:49-07:00",
      why: "The clearest look at how I think. I walk through the 2021 gaming run and the unwind that followed, why I see a similar setup forming in AI crypto, and the data that would prove me wrong.",
    },
    {
      id: "CWW0sEJR7Tk",
      kind: "Research",
      title: "What Is Bittensor? TAO Explained For Complete Beginners",
      duration: "25:13",
      published: "2026-08-31T15:27:34-07:00",
      why: "How I research a project from the ground up. A no-jargon guide to Bittensor, the network I cover most: subnets, miners and validators, the TAO halving, and whether it makes real revenue. Sources are in the description.",
    },
    {
      id: "pnL9yk4Jf0A",
      kind: "Interview",
      title:
        "The Greatest Bittensor Explanation of ALL TIME (feat. Mark Jeffrey)",
      duration: "40:03",
      published: "2026-03-21T13:33:55-07:00",
      why: "What my conversations sound like. Mark Jeffrey, a partner at Stillcore Capital and host of the Hash Rate podcast, explains how Bittensor works, how he filters the noise, and the subnets his fund likes.",
    },
  ] satisfies StartHereVideo[],
};

export function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function thumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hq720.jpg`;
}

/** "14:10" -> 850, "1:03:17" -> 3797 */
export function durationSeconds(duration: string) {
  return duration
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

/** Whole minutes, rounded, for a short label such as "14 min". */
export function durationMinutes(duration: string) {
  return Math.round(durationSeconds(duration) / 60);
}

export function totalMinutes(videos: { duration: string }[]) {
  return Math.round(
    videos.reduce((sum, video) => sum + durationSeconds(video.duration), 0) /
      60,
  );
}

export function formatPublished(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}
