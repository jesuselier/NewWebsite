import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  START_HERE,
  durationMinutes,
  durationSeconds,
  formatPublished,
  thumbnailUrl,
  totalMinutes,
  watchUrl,
} from "../lib/start-here.ts";

const snapshot = JSON.parse(
  readFileSync(new URL("../lib/youtube-snapshot.json", import.meta.url)),
);

test("Start here covers perspective, research, and interview, in that order", () => {
  assert.deepEqual(
    START_HERE.videos.map((video) => video.kind),
    ["Perspective", "Research", "Interview"],
  );
});

test("Start here entries are well formed and unique", () => {
  const ids = START_HERE.videos.map((video) => video.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const video of START_HERE.videos) {
    assert.match(video.id, /^[\w-]{11}$/);
    assert.match(video.duration, /^\d{1,2}(:\d{2}){1,2}$/);
    assert.ok(Number.isFinite(Date.parse(video.published)), video.published);
    assert.ok(video.title.trim().length > 0);
    assert.ok(video.why.trim().length > 0);
  }
});

test("homepage copy avoids em and en dashes", () => {
  for (const video of START_HERE.videos) {
    assert.doesNotMatch(video.why, /[–—]/, video.id);
  }
});

test("durations and links are derived from the verified data", () => {
  assert.equal(durationSeconds("14:10"), 850);
  assert.equal(durationSeconds("1:03:17"), 3797);
  assert.equal(durationMinutes("40:03"), 40);
  assert.equal(totalMinutes(START_HERE.videos), 79);
  assert.equal(
    watchUrl("0YufTzt0aXA"),
    "https://www.youtube.com/watch?v=0YufTzt0aXA",
  );
  assert.equal(
    thumbnailUrl("0YufTzt0aXA"),
    "https://i.ytimg.com/vi/0YufTzt0aXA/hq720.jpg",
  );
  assert.equal(formatPublished("2026-08-10T09:55:49-07:00"), "Aug 10, 2026");
});

test("fallback snapshot entries stay consistent with their IDs", () => {
  const ids = snapshot.videos.map((video) => video.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const video of snapshot.videos) {
    assert.match(video.id, /^[\w-]{11}$/);
    assert.equal(video.watchUrl, `https://www.youtube.com/watch?v=${video.id}`);
    assert.ok(video.thumbSrc.startsWith(`https://i.ytimg.com/vi/${video.id}/`));
    assert.ok(Number.isFinite(Date.parse(video.published)), video.published);
    assert.match(video.duration, /^\d{1,2}(:\d{2}){1,2}$/);
  }
});
