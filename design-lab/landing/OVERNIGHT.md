# Overnight plan (October 16 to 17, 2026)

Jesus picked Core Glow, applied his notes, and asked for work to continue until the session limits are used, resuming after each reset. Each step below is done in order; check the status line before starting one. Commit and push after every step (the stop hook requires it).

## Steps

1. **Polish rounds on `a-core-glow/`** (workflow run `wf_b1bf64f7-f00`, task `wzowv1bkh`): Jesus's notes are applied; review round 3 scored ref 7.0, motion 6.6, buyer 7.4; the fixer then ran, and round 4 reviews plus a fix follow. Status: running.
2. **Creative bake-off in `a-lab/`** (workflow run `wf_e1123ff0-384`, task `w5rs0ujy6`): four hero concepts (h1 Rising Routes, h2 Signal Handoff, h3 Push-in, h4 Scroll Convergence) and two signature moments (m1 The Crowd, m2 Lock In Your Seat), judged blind against the control in `scratchpad/lab/control`, ending in `a-lab/GRAFT-PLAN.md`. Status: running.
3. **Graft the winners** into `a-core-glow/` following `a-lab/GRAFT-PLAN.md`, only after step 1 has finished so the two never edit the same files. Then one verification round (the four reviewers plus a fixer, `tools/polish-workflow.js` style) on the merged page.
4. **Republish the review page** (`index.html`, artifact https://claude.ai/artifact/HMMSbU5c4MjW4SibaJoQAJ) with the final Core Glow: copy the page into the stage folder with `../brand` and `../assets` paths, frame-accurate hero video via `tools/frames.mjs`, folds from the final capture.
5. **Move it into the real site** the way the tier list works: copy the final page to `public/swarm-site/` (paths `/brand/swarm/...` and site-local photos), drop the preview-only CSP meta (Whop Elements will need `cdn.whop.com`), keep the absolute og:image and canonical for https://www.joinswarm.ai, add the Vercel Analytics loader used by the tier list, and leave out the review media. In `next.config.ts`, rewrite `/` on the joinswarm.ai host to `/swarm-site/index.html` (beforeFiles) and point `/swarm` on preview hosts at it. Retire the interim React page in `app/(swarm)/swarm/` but keep the Swarm robots.txt and sitemap routes. Verify with `npm run lint`, `npm test`, `next build`, `next start` plus Host-header curls, and screenshots. Push to the branch only.
6. **Do not merge to `main` or open a PR** without Jesus saying so; going live is his call.

## Notes for whoever resumes

- Serve the lab for captures: `cd design-lab/landing && npx http-server -p 8820 -c-1 -s .`
- Workflows resume with `Workflow({ scriptPath, resumeFromRunId })`; finished agents return from cache.
- Open items still owed by Jesus: Whop plan IDs, weekly call day and time, where Swarm lives after joining, confirmation the AI tools do not place trades, the founding price on cancel and rejoin, refund policy and legal links, approval of the disclaimer wording and the copy written around his lines.
