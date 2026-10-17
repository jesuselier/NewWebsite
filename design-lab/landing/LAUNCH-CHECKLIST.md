# Swarm launch checklist

**Live since October 17, 2026, 11:18 UTC** at https://www.joinswarm.ai (pull request #1, squash-merged to `main`). Jesus approved going live with the internal notes hidden on the live site: the `[CONFIRM]` and `[Data needed]` notes and the legal pages' draft badge stay in the lab copy and the build strips them. What is left below still needs answering; until then the checkout shows "Opens here soon" and the legal pages are unreviewed drafts.

## Needed from Jesus

1. **Whop plan IDs** for Founding Monthly, Standard Monthly and Yearly (each starts with `plan_`). Each one goes on one line in the `PLANS` table in `a-core-glow/page.js`; then the site is rebuilt. Until then the pricing card shows "Checkout opens here soon."
2. **The support@joinswarm.ai inbox.** The page footer and all three legal pages use it. Free email forwarding to an inbox you already read is enough. The domain's DNS is on Cloudflare, not Namecheap, so use Cloudflare Email Routing (steps in `SEO-PLAN.md`, Part 2, step 9). While you are in Cloudflare DNS, leave the records that point to Vercel set to **DNS only** (grey cloud, as they are now). Switching them to Proxied would put Cloudflare's cache in front of Vercel, and it could keep serving an old sitemap or 404 page after an update.
3. **The thirteen legal questions** at the end of `OVERNIGHT.md` (legal entity, Florida law, adviser status, holding assets discussed, whether Standard and Yearly members keep their price, the Yearly refund window and usage limit, whether calls are recorded, what the AI tools store, minimum age 18, the 30-day reply time, the liability cap). Each one is a yellow [CONFIRM] note in the lab copy of the Terms, Privacy or Refund page (`design-lab/landing/a-core-glow/`); the live pages show the drafted wording without the notes.
4. **Sign-off on the wording**: the risk disclaimer and the copy written around your own lines.

## Done

- The page is a static site in `public/swarm-site/`, built from `a-core-glow/` by `node scripts/build-swarm-site.mjs`. The build hides every [CONFIRM] and [Data needed] note on the live site and lists the ones still open.
- joinswarm.ai serves the page at `/` and the legal pages at `/terms`, `/privacy` and `/refunds`, with its own robots.txt, sitemap and favicon. Every other path returns a 404: the Swarm 404 page, or Next's plain 404 for a few odd paths (unknown files under `/brand`, `/swarm-site` and `/swarm`, and capitalized ones such as `/TERMS`). martinezaccess.com keeps all its pages; its footer now has a Swarm link, its structured data names Swarm as the community Jesus founded, and its `/swarm` links redirect permanently (308) to joinswarm.ai.
- Fonts and the 3D library are served from the site itself. Nothing loads from YouTube until a visitor presses play, which matches the privacy policy. Visits are counted with Vercel Analytics, which sets no cookies.
- Lint, tests and the production build pass. Host-header requests and a browser pass on desktop and phone were clean.

## At and after launch

- Rebuild `public/swarm-site/` from the final page, then check the Vercel preview deployment at `/swarm`.
- In Vercel, confirm both joinswarm.ai and www.joinswarm.ai show "Valid Configuration".
- After the deploy, open https://www.joinswarm.ai on a phone, play the video, open each legal page, and paste the link into an X draft to check the share card.

## Not part of Swarm

- Done October 17 (pull request #3): the GPS location data is removed from the two martinezaccess.com photos. The originals are still in the public repository's history and in older Vercel deployments; removing those needs Jesus's go-ahead (make the repo private, delete old deployments, or rewrite history).
