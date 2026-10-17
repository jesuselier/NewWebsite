# Swarm launch checklist

What still stands between the page and https://www.joinswarm.ai going live. Nothing ships until Jesus approves it.

## Needed from Jesus

1. **Whop plan IDs** for Founding Monthly, Standard Monthly and Yearly (each starts with `plan_`). Each one goes on one line in the `PLANS` table in `a-core-glow/page.js`; then the site is rebuilt. Until then the pricing card shows "Checkout opens here soon."
2. **The support@joinswarm.ai inbox.** The page footer and all three legal pages use it. Free email forwarding to an inbox you already read is enough (Namecheap offers it while it runs the domain's DNS; if the DNS moved to Vercel, it takes two MX records there).
3. **A launch date**, or say to drop the "[Data needed: launch date]" chip in the FAQ.
4. **The ten legal questions** at the end of `OVERNIGHT.md` (legal entity, Florida law, adviser status, holding assets discussed, whether Standard and Yearly members keep their price, the Yearly refund window and usage limit, where calls run and whether they are recorded, what the AI tools store). Each one is a yellow [CONFIRM] chip on the Terms, Privacy or Refund page.
5. **Sign-off on the wording**: the risk disclaimer and the copy written around your own lines.
6. **Approval to go live.** Then the branch goes up as a pull request to `main`; merging it deploys to Vercel, and joinswarm.ai is already attached to the project.

## Done on the branch (not live)

- The page is a static site in `public/swarm-site/`, built from `a-core-glow/` by `node scripts/build-swarm-site.mjs`. The build lists every open [CONFIRM] and [Data needed] chip, so nothing unresolved slips through.
- joinswarm.ai serves the page at `/` and the legal pages at `/terms`, `/privacy` and `/refunds`, with its own robots.txt, sitemap and favicon. Every other path goes back to `/`. martinezaccess.com is unchanged, and its `/swarm` link redirects to joinswarm.ai.
- Fonts and the 3D library are served from the site itself. Nothing loads from YouTube until a visitor presses play, which matches the privacy policy. Visits are counted with Vercel Analytics, which sets no cookies.
- Lint, tests and the production build pass. Host-header requests and a browser pass on desktop and phone were clean.

## Right before launch

- Rebuild `public/swarm-site/` from the final page, then check the Vercel preview deployment at `/swarm`.
- In Vercel, confirm both joinswarm.ai and www.joinswarm.ai show "Valid Configuration".
- After the deploy, open https://www.joinswarm.ai on a phone, play the video, open each legal page, and paste the link into an X draft to check the share card.

## Not part of Swarm, but worth fixing

- Two photos on martinezaccess.com (`public/media/jesus-martinez-portrait.jpg`, `public/media/jesus-martinez-studio.jpg`) still contain GPS location data. Stripping it is a two-minute change if you want it.
