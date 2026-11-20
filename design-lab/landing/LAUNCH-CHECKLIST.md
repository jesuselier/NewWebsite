# Swarm launch checklist

**Live since October 17, 2026, 11:18 UTC** at https://www.joinswarm.ai (pull request #1, squash-merged to `main`). Jesus approved going live with the internal notes hidden on the live site: the `[CONFIRM]` and `[Data needed]` notes and the legal pages' draft badge stay in the lab copy and the build strips them. What is left below still needs answering. Since November 20 the page has no pricing at all (Jesus: "Pricing is to be decided"): the Black Friday sale was dropped before it went live, and every gold button and the nav button go to the Swarm updates sign-up on Keychain. The legal pages are still unreviewed drafts.

## Needed from Jesus

1. **Pricing, when it is decided.** Nothing to paste now: the page sells nothing, and its gold buttons and the nav button link to https://keychain.club/jesusmartinez/GETSWARMUPDATES (Jesus's Keychain page, where people leave their email for Swarm updates). The build fails if any built page shows a dollar price, "Black Friday", "locked in" or "Coming soon", or if a gold or nav button stops pointing at the Keychain page. When Jesus decides the plans and prices, they need a new page section, new legal wording (the `[CONFIRM: plans and prices]` and `[CONFIRM: checkout provider]` notes in the Terms, Privacy and Refund drafts) and a change to those build guards. The Black Friday runbook (Whop links in `CHECKOUT`, `black-friday/ship-ended.mjs`) is retired; do not run it.
2. **Contact address: done.** Jesus chose JMCrypto@wealthgardenent.com on October 26; the page footer and all three legal pages use it. (Keep the Vercel records at Cloudflare on **DNS only**, grey cloud, so Cloudflare's cache never serves an old sitemap or 404 page.)
3. **The thirteen legal questions** at the end of `OVERNIGHT.md` (legal entity, Florida law, adviser status, holding assets discussed, whether members keep their price, whether there is a yearly plan and its refund window and usage limit, whether calls are recorded, what the AI tools store, minimum age 18, the 30-day reply time, the liability cap), plus the plans, prices and checkout provider once pricing is decided. Each one is a yellow [CONFIRM] note in the lab copy of the Terms, Privacy or Refund page (`design-lab/landing/a-core-glow/`); the live pages show the drafted wording without the notes.
4. **Sign-off on the wording**: the risk disclaimer and the copy written around your own lines.

## Done

- The page is a static site in `public/swarm-site/`, built from `a-core-glow/` by `node scripts/build-swarm-site.mjs`. The build hides every [CONFIRM] and [Data needed] note on the live site and lists the ones still open.
- joinswarm.ai serves the page at `/` and the legal pages at `/terms`, `/privacy` and `/refunds`, with its own robots.txt, sitemap and favicon. Every other path returns a 404: the Swarm 404 page, or Next's plain 404 for a few odd paths (unknown files under `/brand`, `/swarm-site` and `/swarm`, and capitalized ones such as `/TERMS`). martinezaccess.com is not used for Swarm: it keeps all its pages unchanged, and its old `/swarm` link still redirects to joinswarm.ai.
- Fonts and the 3D library are served from the site itself. Nothing loads from YouTube until a visitor presses play, which matches the privacy policy. Visits are counted with Vercel Analytics, which sets no cookies.
- Lint, tests and the production build pass. Host-header requests and a browser pass on desktop and phone were clean.

## At and after launch

- Rebuild `public/swarm-site/` from the final page, then check the Vercel preview deployment at `/swarm`.
- In Vercel, confirm both joinswarm.ai and www.joinswarm.ai show "Valid Configuration".
- After the deploy, open https://www.joinswarm.ai on a phone, play the video, tap a gold button (it should open the Keychain sign-up in a new tab), open each legal page, and paste the link into an X draft to check the share card.

## Not part of Swarm

- Done October 17 (pull request #3): the GPS location data is removed from the two martinezaccess.com photos. The originals are still in the public repository's history and in older Vercel deployments; removing those needs Jesus's go-ahead (make the repo private, delete old deployments, or rewrite history).
