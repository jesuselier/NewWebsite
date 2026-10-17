# Overnight plan (October 16 to 17, 2026)

Jesus picked Core Glow, applied his notes, and asked for work to continue until the session limits are used, resuming after each reset. Each step below is done in order; check the status line before starting one. Commit and push after every step (the stop hook requires it).

## Steps

1. **Jesus's October 17 notes, then a review round, on `a-core-glow/`** (workflow run `wf_159b12aa-b1e`, task `w53aexst9` after a container restart (was `w31myfui4`); it replaced run `wf_b1bf64f7-f00`, which finished review round 3 and its fix): weekly calls without day or time; the crowd curve redrawn with hexagonal nodes and real spacing; the attention band made fluid with a clean end state; "Why I built Swarm" caption; Discord as the home; founding price policy on cancel and rejoin; FAQ capped at six; footer links to the legal pages; no martinezaccess.com anywhere. Notes applied and round 4 reviewed (ref 7.4, motion 6.4, buyer 7.4, 3 audit blockers). STOPPED at 02:2x UTC on a usage limit before the round 4 fix; RESUMED at 04:15 UTC (task `wstiemcx1`). Resume again if needed: Workflow({scriptPath: 'tools/polish-workflow.js' copy at /root/.claude/projects/-home-user/fdc58892-55e5-54b6-a74d-8da9a91cd372/workflows/scripts/swarm-polish-direction-wf_c23d3f24-1df.js, resumeFromRunId: 'wf_159b12aa-b1e', same args as the last run}); cached agents replay, only the fixer runs.
1b. **Legal pages** (workflow run `wf_ce9082bb-250`, task `wd21m9crp`): `a-core-glow/terms.html`, `privacy.html`, `refunds.html` plus `legal.css`, drafted from the brief and then fact-checked. Status: done (October 17). Ten [CONFIRM] questions for Jesus are listed at the end of this file.
2. **Creative bake-off in `a-lab/`** (workflow run `wf_e1123ff0-384`; all six builds and the wow judge are done; STOPPED on a usage limit before the sell and craft hero judges, the two moment judges and the graft plan. Resume with resumeFromRunId 'wf_e1123ff0-384' and the script at /root/.claude/projects/-home-user/fdc58892-55e5-54b6-a74d-8da9a91cd372/workflows/scripts/core-glow-creative-bakeoff-wf_e1123ff0-384.js): four hero concepts (h1 Rising Routes, h2 Signal Handoff, h3 Push-in, h4 Scroll Convergence) and two signature moments (m1 The Crowd, m2 Lock In Your Seat), judged blind against the control in `scratchpad/lab/control`, ending in `a-lab/GRAFT-PLAN.md`. Status: paused at 02:2x UTC (usage limit), RESUMED at 04:15 UTC (task `wdhv9mk4v`).
3. **Graft the winners** into `a-core-glow/` following `a-lab/GRAFT-PLAN.md`, only after step 1 has finished so the two never edit the same files. Then one verification round (the four reviewers plus a fixer, `tools/polish-workflow.js` style) on the merged page.
4. **Republish the review page** (`index.html`, artifact https://claude.ai/artifact/HMMSbU5c4MjW4SibaJoQAJ) with the final Core Glow: copy the page into the stage folder with `../brand` and `../assets` paths, frame-accurate hero video via `tools/frames.mjs`, folds from the final capture.
5. **Move it into the real site** the way the tier list works: copy the final page to `public/swarm-site/` (paths `/brand/swarm/...` and site-local photos), drop the preview-only CSP meta (Whop Elements will need `cdn.whop.com`), keep the absolute og:image and canonical for https://www.joinswarm.ai, add the Vercel Analytics loader used by the tier list, and leave out the review media and NOTES.md. Copy the legal pages too. Replace the intro link with a click-to-load youtube-nocookie player (the privacy policy promises that). Load the Swarm tokens from a copy with comments stripped (the kit file's comment mentions martinezaccess.com; leave the original untouched). In `next.config.ts`, rewrite `/` on the joinswarm.ai host to `/swarm-site/index.html` (beforeFiles) and point `/swarm` on preview hosts at it. Retire the interim React page in `app/(swarm)/swarm/` but keep the Swarm robots.txt and sitemap routes. Verify with `npm run lint`, `npm test`, `next build`, `next start` plus Host-header curls, and screenshots. Push to the branch only.
6. **Do not merge to `main` or open a PR** without Jesus saying so; going live is his call.

## Notes for whoever resumes

- Serve the lab for captures: `cd design-lab/landing && npx http-server -p 8820 -c-1 -s .`
- Workflows resume with `Workflow({ scriptPath, resumeFromRunId })`; finished agents return from cache.
- Open items still owed by Jesus: Whop plan IDs, weekly call day and time, where Swarm lives after joining, confirmation the AI tools do not place trades, the founding price on cancel and rejoin, refund policy and legal links, approval of the disclaimer wording and the copy written around his lines.

## Legal [CONFIRM] questions for Jesus (from the legal pages)

1. Legal entity name, if any.
2. Create the support@joinswarm.ai inbox.
3. Florida law and Miami-Dade courts.
4. Not a registered investment adviser or broker-dealer.
5. He may hold the assets discussed.
6. Do Standard and Yearly members keep their price when prices rise?
7. The 7-day Yearly refund window.
8. The Yearly usage limit for that refund.
9. Where the weekly calls run (Discord?) and whether they are recorded.
10. What the AI tools store and which AI providers they use.
