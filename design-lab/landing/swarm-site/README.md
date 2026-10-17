# swarm-site (production-only files)

`scripts/build-swarm-site.mjs` builds `public/swarm-site/` (the page joinswarm.ai serves at `/`) from `../a-core-glow/` and copies these two files in:

- `swarm-site.js` plays the launch video in a youtube-nocookie player after a click (the privacy policy promises this) and fixes the legal links on preview hosts.
- `swarm-site.css` styles that player.

Rebuild after any change to the lab page: `node scripts/build-swarm-site.mjs`. Do not edit `public/swarm-site/` by hand.
