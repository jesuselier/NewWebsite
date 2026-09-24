import test from "node:test";
import assert from "node:assert/strict";
import {
  parseYouTubeFeed,
  mergeVideos,
  formatVideoDate,
  parseVideosTab,
  selectLongForm,
} from "../lib/youtube-feed.ts";
const entry = (id, title, date) =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><published>${date}</published></entry>`;
const date = "2026-09-23T22:45:44Z";
test("decodes real Atom titles while deriving safe video and image URLs", () => {
  const [video] = parseYouTubeFeed(
    entry("h4JwMVLQGMc", "XRP &amp; AI &#39;research&#39; &#x1F4C8;", date),
  );
  assert.equal(video.title, "XRP & AI 'research' 📈");
  assert.equal(video.watchUrl, "https://www.youtube.com/watch?v=h4JwMVLQGMc");
  assert.equal(
    video.thumbSrc,
    "https://i.ytimg.com/vi/h4JwMVLQGMc/hqdefault.jpg",
  );
});
test("accepts CDATA without decoding it twice", () => {
  assert.equal(
    parseYouTubeFeed(entry("h4JwMVLQGMc", "<![CDATA[Crypto & AI]]>", date))[0]
      .title,
    "Crypto & AI",
  );
});
test("rejects malformed entries without dropping valid neighboring entries", () => {
  const xml =
    entry("../../evil", "Bad", date) +
    entry("h4JwMVLQGMc", "Bad date", "invalid") +
    entry("WmtLSJ0k7t8", "Valid", date);
  assert.deepEqual(
    parseYouTubeFeed(xml).map((v) => v.id),
    ["WmtLSJ0k7t8"],
  );
  assert.deepEqual(parseYouTubeFeed("<html>upstream error</html>"), []);
});
test("handles invalid numeric entities without crashing the feed", () => {
  assert.equal(
    parseYouTubeFeed(entry("h4JwMVLQGMc", "Test &#99999999;", date))[0].title,
    "Test &#99999999;",
  );
});
test("keeps verified videos on upstream failure and sorts chronologically", () => {
  const old = parseYouTubeFeed(
    entry("WmtLSJ0k7t8", "Older", "2026-09-22T12:00:00Z"),
  )[0];
  const recent = parseYouTubeFeed(entry("h4JwMVLQGMc", "Recent", date))[0];
  assert.deepEqual(
    mergeVideos([], [old, recent], 1).map((v) => v.id),
    [recent.id],
  );
  assert.deepEqual(mergeVideos([], [old, recent], 0), []);
});
test("refreshes titles, deduplicates, and retains known duration", () => {
  const video = parseYouTubeFeed(
    entry("h4JwMVLQGMc", "Updated title", date),
  )[0];
  const merged = mergeVideos(
    [video, video],
    [{ ...video, title: "Old title", duration: "1:03:17" }],
    12,
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, "Updated title");
  assert.equal(merged[0].duration, "1:03:17");
});
test("formats dates in the creator timezone independent of server locale", () => {
  assert.equal(formatVideoDate("2026-09-24T01:00:00Z"), "Sep 23, 2026");
});

function channelData(content, mobile = false, title = "Videos") {
  return {
    contents: {
      [mobile
        ? "singleColumnBrowseResultsRenderer"
        : "twoColumnBrowseResultsRenderer"]: {
        tabs: [
          {
            tabRenderer: {
              title: "Shorts",
              content: { videoRenderer: { videoId: "RLn3YbiGL0k" } },
            },
          },
          { tabRenderer: { title, selected: true, content } },
        ],
      },
    },
  };
}

test("reads only the selected Videos tab and excludes Shorts renderers", () => {
  const data = channelData({
    items: [
      {
        videoRenderer: {
          videoId: "h4JwMVLQGMc",
          title: 'A } brace and a "quote"',
          lengthText: { simpleText: "1:03:17" },
        },
      },
      {
        videoRenderer: {
          videoId: "h4JwMVLQGMc",
          lengthText: { simpleText: "1:03:17" },
        },
      },
      {
        reelItemRenderer: {
          videoId: "Bp5VKIUWnYc",
          videoRenderer: { videoId: "Bp5VKIUWnYc" },
        },
      },
      { shortsLockupViewModel: { videoRenderer: { videoId: "RLn3YbiGL0k" } } },
      { videoRenderer: { videoId: "invalid" } },
    ],
  });
  assert.deepEqual(
    parseVideosTab(
      `<script>var ytInitialData = ${JSON.stringify(data)};</script>`,
    ),
    [{ id: "h4JwMVLQGMc", duration: "1:03:17" }],
  );
});

test("supports YouTube's mobile encoded data and duration runs", () => {
  const data = channelData(
    {
      compactVideoRenderer: {
        videoId: "WmtLSJ0k7t8",
        lengthText: { runs: [{ text: "41:11" }] },
      },
    },
    true,
  );
  const encoded = JSON.stringify(data).replace(/"/g, "\\x22");
  assert.deepEqual(
    parseVideosTab(`<script>var ytInitialData = '${encoded}';</script>`),
    [{ id: "WmtLSJ0k7t8", duration: "41:11" }],
  );
});

test("fails closed on upstream errors, malformed data, or the wrong selected tab", () => {
  const content = { videoRenderer: { videoId: "RLn3YbiGL0k" } };
  for (const html of [
    "Access denied",
    "var ytInitialData = {bad",
    "var ytInitialData = {};",
    `var ytInitialData = ${JSON.stringify(channelData(content, false, "Shorts"))};`,
  ]) {
    assert.deepEqual(parseVideosTab(html), []);
  }
});

test("excludes unclassified feed entries but accepts a short-duration regular video", () => {
  const live = parseYouTubeFeed(
    entry("RLn3YbiGL0k", "Short", date) +
      entry("WmtLSJ0k7t8", "Regular two-minute upload", date),
  );
  assert.deepEqual(
    selectLongForm(live, [{ id: "WmtLSJ0k7t8", duration: "2:00" }], [], 12).map(
      (v) => [v.id, v.duration],
    ),
    [["WmtLSJ0k7t8", "2:00"]],
  );
});

test("keeps verified long-form uploads when classification or both upstreams fail", () => {
  const known = {
    ...parseYouTubeFeed(entry("h4JwMVLQGMc", "Known long-form", date))[0],
    duration: "1:03:17",
  };
  const live = parseYouTubeFeed(
    entry("h4JwMVLQGMc", "Updated title", date) +
      entry("RLn3YbiGL0k", "Unknown Short", date),
  );
  const selected = selectLongForm(live, [], [known], 12);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].title, "Updated title");
  assert.equal(selected[0].duration, "1:03:17");
  assert.deepEqual(selectLongForm([], [], [known], 12), [known]);
});
