# Swarm launch checklist

**Live since October 17, 2026, 11:18 UTC** at https://www.joinswarm.ai (pull request #1, squash-merged to `main`). Jesus approved going live with the internal notes hidden on the live site: the `[CONFIRM]` and `[Data needed]` notes and the legal pages' draft badge stay in the lab copy and the build strips them. What is left below still needs answering. Since the Black Friday build (November 2026) the pricing card shows "Coming soon" in place of a plan's Join button until that plan's checkout link is pasted (Jesus's choice, November 20), and the legal pages are still unreviewed drafts.

## Needed from Jesus

1. **The three Whop checkout links, when they exist.** Jesus chose on November 20 to ship with "Coming soon" in their place: until a plan's link is pasted, the card shows "Coming soon" where its Join Swarm button would be, so that plan cannot sell. The page switches to the Black Friday sale by itself at Nov 24, 12:00 AM ET (2026-11-24T05:00:00Z), whether or not anyone rebuilds it, so the $49.99 sale only takes money once its link is in. In Whop, create three plans on the Swarm product: **Black Friday Monthly, $49.99 a month** (sold only Nov 24, 12:00 AM ET to Dec 1, 11:59 PM ET; untick "Show on store page"), **Standard Monthly, $99 a month**, and **Yearly, $990 a year**. For each one, copy its plan ID (starts with `plan_`) and its own direct checkout link (Dashboard > Checkout links, the link's copy button; never a link with `?session=`), and paste **both** into its line of `CHECKOUT` in the head script of `design-lab/landing/a-core-glow/index.html`:
   `blackfriday: { whopPlanId: "plan_...", checkoutUrl: "https://whop.com/..." },` (and the same for `standard` and `yearly`). A plan only goes live on the card when its full `checkoutUrl` is pasted; an ID alone leaves the card on "Coming soon". Then run `node scripts/build-swarm-site.mjs` and deploy. The build prints a **CHECKOUT COMING SOON** line for each plan still without a link (a notice, not a failure). Open each link once in a private window to check the plan name and price. Until the Black Friday link is in, the sale shows no countdown, its buttons read "See the price", and the card says "Coming soon".
   - **Dec 1, 11:59 PM ET:** archive the Black Friday plan in Whop (not "hidden", which still sells through its link), once Whop confirms archiving keeps existing $49.99 subscriptions renewing.
   - **From Dec 2, 12:00 AM ET:** remove the Black Friday link from `CHECKOUT`, run `node design-lab/landing/black-friday/ship-ended.mjs`, then `node scripts/build-swarm-site.mjs`, and deploy. The page already shows the ENDED offer to visitors by itself; this ships the ENDED text to search engines, link previews and visitors without JavaScript (meta description, share image, static text). The build fails after Dec 2, 12:00 AM ET until it is done.
2. **Contact address: done.** Jesus chose JMCrypto@wealthgardenent.com on October 26; the page footer and all three legal pages use it. (Keep the Vercel records at Cloudflare on **DNS only**, grey cloud, so Cloudflare's cache never serves an old sitemap or 404 page.)
3. **The thirteen legal questions** at the end of `OVERNIGHT.md` (legal entity, Florida law, adviser status, holding assets discussed, whether Standard and Yearly members keep their price, the Yearly refund window and usage limit, whether calls are recorded, what the AI tools store, minimum age 18, the 30-day reply time, the liability cap). Each one is a yellow [CONFIRM] note in the lab copy of the Terms, Privacy or Refund page (`design-lab/landing/a-core-glow/`); the live pages show the drafted wording without the notes.
4. **Sign-off on the wording**: the risk disclaimer and the copy written around your own lines.

## Done

- The page is a static site in `public/swarm-site/`, built from `a-core-glow/` by `node scripts/build-swarm-site.mjs`. The build hides every [CONFIRM] and [Data needed] note on the live site and lists the ones still open.
- joinswarm.ai serves the page at `/` and the legal pages at `/terms`, `/privacy` and `/refunds`, with its own robots.txt, sitemap and favicon. Every other path returns a 404: the Swarm 404 page, or Next's plain 404 for a few odd paths (unknown files under `/brand`, `/swarm-site` and `/swarm`, and capitalized ones such as `/TERMS`). martinezaccess.com is not used for Swarm: it keeps all its pages unchanged, and its old `/swarm` link still redirects to joinswarm.ai.
- Fonts and the 3D library are served from the site itself. Nothing loads from YouTube until a visitor presses play, which matches the privacy policy. Visits are counted with Vercel Analytics, which sets no cookies.
- Lint, tests and the production build pass. Host-header requests and a browser pass on desktop and phone were clean.

## At and after launch

- Rebuild `public/swarm-site/` from the final page, then check the Vercel preview deployment at `/swarm`.
- In Vercel, confirm both joinswarm.ai and www.joinswarm.ai show "Valid Configuration".
- After the deploy, open https://www.joinswarm.ai on a phone, play the video, open each legal page, and paste the link into an X draft to check the share card.

## Not part of Swarm

- Done October 17 (pull request #3): the GPS location data is removed from the two martinezaccess.com photos. The originals are still in the public repository's history and in older Vercel deployments; removing those needs Jesus's go-ahead (make the repo private, delete old deployments, or rewrite history).
